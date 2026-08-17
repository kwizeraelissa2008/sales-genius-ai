/** Server-only plan quota helpers. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type UsageKind = Database["public"]["Enums"]["usage_kind"];
export type PlanId = Database["public"]["Enums"]["subscription_plan"];

type Client = SupabaseClient<Database>;

/** null = unlimited */
export const PLAN_QUOTAS: Record<PlanId, Record<"ai_email" | "enrichment", number | null>> = {
  free: { ai_email: 20, enrichment: 10 },
  pro: { ai_email: 500, enrichment: 200 },
  business: { ai_email: null, enrichment: null },
};

/** Soft (non-blocking) daily send guidance for cold outreach deliverability. */
export const DAILY_SEND_SOFT_LIMIT = 50;

export function monthStartISO(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export function dayStartISO(now = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export async function getPlan(supabase: Client, userId: string): Promise<PlanId> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan,status")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data || data.status !== "active") return "free";
  return data.plan;
}

async function countSince(
  supabase: Client,
  userId: string,
  kind: UsageKind,
  sinceISO: string,
): Promise<number> {
  const { count } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", kind)
    .gte("created_at", sinceISO);
  return count ?? 0;
}

export async function logUsage(supabase: Client, userId: string, kind: UsageKind) {
  await supabase.from("usage_events").insert({ user_id: userId, kind });
}

export class QuotaExceededError extends Error {}

const LABEL: Record<"ai_email" | "enrichment", string> = {
  ai_email: "AI email generations",
  enrichment: "lead enrichments",
};

/**
 * Throws a friendly, user-facing error when the caller is over their
 * monthly allowance. `units` covers batch actions (e.g. 3 links at once).
 */
export async function assertWithinQuota(
  supabase: Client,
  userId: string,
  kind: "ai_email" | "enrichment",
  units = 1,
): Promise<void> {
  const plan = await getPlan(supabase, userId);
  const limit = PLAN_QUOTAS[plan][kind];
  if (limit === null) return;
  const used = await countSince(supabase, userId, kind, monthStartISO());
  if (used + units > limit) {
    throw new QuotaExceededError(
      `You've used ${used} of ${limit} ${LABEL[kind]} on the ${plan} plan this month. Upgrade in Billing to keep going — your allowance resets at the start of next month.`,
    );
  }
}

export type UsageSummary = {
  plan: PlanId;
  monthStart: string;
  aiEmails: { used: number; limit: number | null };
  enrichments: { used: number; limit: number | null };
  sendsToday: { used: number; softLimit: number };
};

export async function getUsage(supabase: Client, userId: string): Promise<UsageSummary> {
  const plan = await getPlan(supabase, userId);
  const since = monthStartISO();
  const [ai, enrich, sends] = await Promise.all([
    countSince(supabase, userId, "ai_email", since),
    countSince(supabase, userId, "enrichment", since),
    countSince(supabase, userId, "email_send", dayStartISO()),
  ]);
  return {
    plan,
    monthStart: since,
    aiEmails: { used: ai, limit: PLAN_QUOTAS[plan].ai_email },
    enrichments: { used: enrich, limit: PLAN_QUOTAS[plan].enrichment },
    sendsToday: { used: sends, softLimit: DAILY_SEND_SOFT_LIMIT },
  };
}
