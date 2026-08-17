import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CompanyProfile = Database["public"]["Tables"]["company_profiles"]["Row"];
export type CompanyProfileInput =
  Database["public"]["Tables"]["company_profiles"]["Insert"];

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertCompanyProfile(
  patch: Omit<CompanyProfileInput, "user_id">,
): Promise<CompanyProfile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("company_profiles")
    .upsert({ ...patch, user_id: user.id }, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export const INDUSTRIES = [
  "Software",
  "SaaS",
  "Consulting",
  "Healthcare",
  "Finance",
  "Marketing",
  "Real Estate",
  "Education",
  "Manufacturing",
  "Other",
];

export const PRICE_RANGES = [
  "<$100",
  "$100–$500",
  "$500–$2,000",
  "$2,000–$10,000",
  "$10,000+",
];

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

export const TARGET_TITLES = [
  "CEO",
  "CTO",
  "CMO",
  "VP Sales",
  "VP Marketing",
  "Director",
  "Manager",
  "Founder",
  "Owner",
];

export const REGIONS = [
  "North America",
  "Europe",
  "Latin America",
  "Africa",
  "Middle East",
  "Asia Pacific",
];
