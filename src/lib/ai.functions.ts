import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertWithinQuota, logUsage } from "@/lib/usage.server";

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

export type ToneId = "direct" | "story";

export const TONES: { id: ToneId; label: string; hint: string }[] = [
  { id: "direct", label: "Short & Direct", hint: "60-90 words, one crisp ask" },
  { id: "story", label: "Value & Storytelling", hint: "120-160 words, narrative proof" },
];

export type EmailVariant = {
  tone: ToneId;
  label: string;
  subject: string;
  body: string;
};

export type GenerateResult = {
  variants: EmailVariant[];
  mode: "groq" | "fallback";
};

function heuristicVariants(input: z.infer<typeof GenerateInput>): EmailVariant[] {
  const first = input.leadName.split(/\s+/)[0];
  const co = input.leadCompany ? ` at ${input.leadCompany}` : "";
  const title = input.leadTitle ? ` as ${input.leadTitle}` : "";
  const sender = input.senderName || "the team";
  const senderCo = input.senderCompany || "our company";
  const goal = input.goal.toLowerCase();

  return [
    {
      tone: "direct",
      label: "Short & Direct",
      subject: `Quick question, ${first}`,
      body: `Hi ${first},

I'll keep this short: I'm reaching out because ${goal}.

${senderCo} helps sales teams score leads, personalise outreach and track pipeline in one place — most teams see more qualified conversations inside two weeks.

Worth a 15-minute call next week?

Best,
${sender}`,
    },
    {
      tone: "story",
      label: "Value & Storytelling",
      subject: `Quick idea for ${input.leadCompany ?? first}`,
      body: `Hi ${first},

I came across your work${title}${co} and was impressed by what you're building. I'm reaching out because ${goal}.

A team about your size came to us buried in spreadsheets and guesswork about which leads to chase. After moving to ${senderCo}, they let AI score and enrich every lead, generate the first-touch email, and surface a weighted forecast — qualified conversations went up without adding headcount.

I think there's a similar opportunity here, and I'd rather show you than describe it.

Would you be open to a short 15-minute call next week to explore whether it's a fit?

Best,
${sender}`,
    },
  ];
}

export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => GenerateInput.parse(data))
  .handler(async ({ data, context }): Promise<GenerateResult> => {
    await assertWithinQuota(context.supabase, context.userId, "ai_email");

    const apiKey = process.env['GROQ_API_KEY'];

    // Load the sender's company profile for context (may be null pre-onboarding).
    const { data: profile } = await context.supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    const senderCompany = data.senderCompany || profile?.company_name || null;
    const senderName = data.senderName || null;

    let result: GenerateResult;

    if (!apiKey) {
      result = {
        variants: heuristicVariants({ ...data, senderCompany }),
        mode: "fallback",
      };
    } else {
      try {
        const companyCtx = profile
          ? `
Sender company: ${profile.company_name}${profile.industry ? ` (${profile.industry})` : ""}
Product: ${profile.product_name ?? "N/A"} — ${profile.product_description ?? ""}
Key features: ${(profile.key_features ?? []).join(", ") || "N/A"}
Value proposition: ${profile.value_proposition ?? "N/A"}
Pain points solved: ${profile.pain_points ?? "N/A"}
Ideal customer titles: ${(profile.target_titles ?? []).join(", ") || "N/A"}
`
          : "Sender company: (profile not set — write generically)";

        const prompt = `You are an expert B2B sales copywriter. Write TWO alternative versions of the same cold outreach email so the sender can pick a tone.

${companyCtx}

Lead: ${data.leadName}${data.leadTitle ? `, ${data.leadTitle}` : ""}${data.leadCompany ? ` at ${data.leadCompany}` : ""}
Lead score: ${data.leadScore ?? "N/A"}/100
Sender: ${senderName ?? "Sales rep"}${senderCompany ? ` (${senderCompany})` : ""}
Goal: ${data.goal}

Return ONLY valid JSON in this exact shape:
{"direct": {"subject": "...", "body": "..."}, "story": {"subject": "...", "body": "..."}}

"direct" = Short & Direct: 60-90 word body, blunt and respectful of their time, one clear ask.
"story" = Value & Storytelling: 120-160 word body, opens with a specific observation, includes a short customer-style proof point tied to the value proposition, one clear ask.

Both: personalized 6-10 word subject with no spam triggers, no emojis, no markdown, no "I hope this email finds you well".`;

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
        const parsed = JSON.parse(json.choices[0].message.content) as Record<
          string,
          { subject?: string; body?: string }
        >;
        const variants: EmailVariant[] = TONES.map((t) => ({
          tone: t.id,
          label: t.label,
          subject: parsed[t.id]?.subject ?? "",
          body: parsed[t.id]?.body ?? "",
        }));
        if (variants.some((v) => !v.subject || !v.body)) throw new Error("Incomplete AI response");
        result = { variants, mode: "groq" };
      } catch (err) {
        console.error("Groq generation failed, using fallback:", err);
        result = {
          variants: heuristicVariants({ ...data, senderCompany }),
          mode: "fallback",
        };
      }
    }

    // Persist the preferred (first) variant as a draft template.
    const primary = result.variants[0];
    await context.supabase.from("email_templates").insert({
      user_id: context.userId,
      subject: primary.subject,
      body: primary.body,
      ai_mode_used: result.mode,
    });

    await logUsage(context.supabase, context.userId, "ai_email");

    return result;
  });
