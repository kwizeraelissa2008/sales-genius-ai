/** Client-safe usage/quota display helpers. */
export type UsageSummary = {
  plan: "free" | "pro" | "business";
  monthStart: string;
  aiEmails: { used: number; limit: number | null };
  enrichments: { used: number; limit: number | null };
  sendsToday: { used: number; softLimit: number };
};

export function quotaLabel(q: { used: number; limit: number | null }, noun: string) {
  return q.limit === null
    ? `${q.used} ${noun} this month · unlimited`
    : `${q.used} / ${q.limit} ${noun} used this month`;
}

export function quotaPercent(q: { used: number; limit: number | null }) {
  if (q.limit === null || q.limit === 0) return 0;
  return Math.min(100, Math.round((q.used / q.limit) * 100));
}
