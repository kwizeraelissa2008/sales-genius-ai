/** Server-only helper that flattens a company profile into a prompt-friendly context block. */

type ProfileLike = {
  company_name?: string | null;
  industry?: string | null;
  product_name?: string | null;
  product_description?: string | null;
  key_features?: string[] | null;
  value_proposition?: string | null;
  pain_points?: string | null;
  target_titles?: string[] | null;
  target_industries?: string[] | null;
  price_range?: string | null;
} | null;

export function buildCompanyContext(profile: ProfileLike): string {
  if (!profile) return "(No company profile set yet — keep suggestions generic B2B.)";
  return [
    `Company: ${profile.company_name ?? "N/A"}${profile.industry ? ` (${profile.industry})` : ""}`,
    `Product: ${profile.product_name ?? "N/A"} — ${profile.product_description ?? ""}`,
    `Key features: ${(profile.key_features ?? []).join(", ") || "N/A"}`,
    `Value proposition: ${profile.value_proposition ?? "N/A"}`,
    `Pain points solved: ${profile.pain_points ?? "N/A"}`,
    `Ideal titles: ${(profile.target_titles ?? []).join(", ") || "N/A"}`,
    `Target industries: ${(profile.target_industries ?? []).join(", ") || "N/A"}`,
    `Price range: ${profile.price_range ?? "N/A"}`,
  ].join("\n");
}
