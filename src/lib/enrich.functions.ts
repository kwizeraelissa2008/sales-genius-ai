import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enrichUrl, suggestGoalsAI, type EnrichedPerson } from "@/lib/enrich.server";
import { sendViaResend, type SendResult } from "@/lib/mailer.server";
import { buildCompanyContext } from "@/lib/company-context.server";
import { assertWithinQuota, logUsage } from "@/lib/usage.server";

export const enrichLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ urls: z.array(z.string().min(4)).min(1).max(5) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<EnrichedPerson[]> => {
    await assertWithinQuota(context.supabase, context.userId, "enrichment", data.urls.length);
    const apiKey = process.env['GROQ_API_KEY'];
    const { data: profile } = await context.supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    const ctx = buildCompanyContext(profile);
    const results = await Promise.all(data.urls.map((u) => enrichUrl(u, apiKey, ctx)));
    for (const _ of data.urls) await logUsage(context.supabase, context.userId, "enrichment");
    return results;
  });

export const suggestGoals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        leadName: z.string().optional(),
        leadTitle: z.string().nullable().optional(),
        leadCompany: z.string().nullable().optional(),
        leadBio: z.string().nullable().optional(),
        leadStatus: z.string().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<string[]> => {
    const apiKey = process.env['GROQ_API_KEY'];
    const { data: profile } = await context.supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    const summary = [
      data.leadName ?? "Unknown lead",
      data.leadTitle ?? "",
      data.leadCompany ? `at ${data.leadCompany}` : "",
      data.leadStatus ? `(pipeline stage: ${data.leadStatus})` : "",
      data.leadBio ? `Bio: ${data.leadBio}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return suggestGoalsAI(apiKey, summary, buildCompanyContext(profile));
  });

export const sendLeadEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        to: z.string().email(),
        subject: z.string().min(1),
        body: z.string().min(1),
        fromName: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<SendResult> => {
    const result = await sendViaResend({
      to: data.to,
      subject: data.subject,
      body: data.body,
      fromName: data.fromName,
      replyTo: context.claims?.email as string | undefined,
    });

    await context.supabase.from("email_templates").insert({
      user_id: context.userId,
      lead_id: data.leadId,
      subject: data.subject,
      body: data.body,
      ai_mode_used: result.delivered ? "sent" : "draft",
    });

    if (result.delivered) {
      await logUsage(context.supabase, context.userId, "email_send");
      await context.supabase
        .from("leads")
        .update({ status: "contacted", last_contacted_at: new Date().toISOString() })
        .eq("id", data.leadId)
        .eq("user_id", context.userId);
    }

    return result;
  });

export const getMailerStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<{ connected: boolean; provider: "resend" | "none" }> => {
    const connected = Boolean(process.env['RESEND_API_KEY']);
    return { connected, provider: connected ? "resend" : "none" };
  });
