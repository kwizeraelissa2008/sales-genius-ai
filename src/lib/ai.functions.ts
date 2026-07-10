import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GenerateInput = z.object({
  leadName: z.string().min(1),
  leadCompany: z.string().nullable().optional(),
  leadTitle: z.string().nullable().optional(),
  leadEmail: z.string().nullable().optional(),
  leadScore: z.number().optional(),
  goal: z.string().min(1),
  senderName: z.string().nullable().optional(),
  senderCompany: z.string().nullable().optional(),
});

export type GenerateResult = {
  subject: string;
  body: string;
  mode: "groq" | "fallback";
};

function heuristicEmail(input: z.infer<typeof GenerateInput>): GenerateResult {
  const first = input.leadName.split(/\s+/)[0];
  const co = input.leadCompany ? ` at ${input.leadCompany}` : "";
  const title = input.leadTitle ? ` as ${input.leadTitle}` : "";
  const sender = input.senderName || "the team";
  const senderCo = input.senderCompany || "our company";
  const subject = `Quick idea for ${input.leadCompany ?? first}`;
  const body = `Hi ${first},

I came across your work${title}${co} and was impressed by what you're building. I'm reaching out because ${input.goal.toLowerCase()}.

At ${senderCo}, we help teams like yours move faster with AI-powered sales intelligence — lead scoring, personalized outreach, and pipeline analytics in one place. Most of our customers see a measurable lift in qualified conversations within the first two weeks.

Would you be open to a short 15-minute call next week to explore whether it's a fit?

Best,
${sender}`;
  return { subject, body, mode: "fallback" };
}

export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => GenerateInput.parse(data))
  .handler(async ({ data, context }): Promise<GenerateResult> => {
    const apiKey = process.env.GROQ_API_KEY;
    let result: GenerateResult;

    if (!apiKey) {
      result = heuristicEmail(data);
    } else {
      try {
        const prompt = `You are an expert B2B sales copywriter. Write a concise, personalized cold outreach email.

Lead: ${data.leadName}${data.leadTitle ? `, ${data.leadTitle}` : ""}${data.leadCompany ? ` at ${data.leadCompany}` : ""}
Lead score: ${data.leadScore ?? "N/A"}/100
Sender: ${data.senderName ?? "Sales rep"}${data.senderCompany ? ` (${data.senderCompany})` : ""}
Goal: ${data.goal}

Return ONLY valid JSON: {"subject": "...", "body": "..."}
The body must be 90-150 words, warm but professional, one clear CTA, no emojis, no markdown.`;

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: "You output only valid JSON." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          }),
        });
        if (!res.ok) throw new Error(`Groq ${res.status}`);
        const json = (await res.json()) as {
          choices: { message: { content: string } }[];
        };
        const parsed = JSON.parse(json.choices[0].message.content) as {
          subject: string;
          body: string;
        };
        result = { subject: parsed.subject, body: parsed.body, mode: "groq" };
      } catch (err) {
        console.error("Groq generation failed, using fallback:", err);
        result = heuristicEmail(data);
      }
    }

    // Persist template
    await context.supabase.from("email_templates").insert({
      user_id: context.userId,
      subject: result.subject,
      body: result.body,
      ai_mode_used: result.mode,
    });

    return result;
  });
