import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadStatus = Database["public"]["Enums"]["lead_status"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "interested", "closed"];

export const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-muted text-muted-foreground",
  contacted: "bg-primary/10 text-primary",
  interested: "bg-warning/15 text-warning",
  closed: "bg-success/15 text-success",
};

/** Heuristic lead scoring — used as a fallback when Groq is unavailable. */
export function heuristicScore(lead: {
  job_title?: string | null;
  company?: string | null;
  email?: string | null;
}): number {
  let score = 40;
  const title = (lead.job_title ?? "").toLowerCase();
  if (/(ceo|founder|owner|president)/.test(title)) score += 45;
  else if (/(cto|cfo|coo|cmo|cro|chief)/.test(title)) score += 40;
  else if (/(vp|vice president|head of)/.test(title)) score += 30;
  else if (/(director|principal)/.test(title)) score += 22;
  else if (/(manager|lead)/.test(title)) score += 12;
  else if (title) score += 5;

  const company = (lead.company ?? "").trim();
  if (company.length > 0) score += 8;

  const email = (lead.email ?? "").toLowerCase();
  if (email && !/(gmail|yahoo|hotmail|outlook|proton)\./.test(email)) score += 7;

  return Math.max(0, Math.min(100, score));
}

export async function listLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createLead(input: Omit<LeadInsert, "user_id" | "lead_score"> & { lead_score?: number }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const score =
    input.lead_score ??
    heuristicScore({ job_title: input.job_title, company: input.company, email: input.email });

  const { data, error } = await supabase
    .from("leads")
    .insert({ ...input, user_id: user.id, lead_score: score })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateLead(id: string, patch: LeadUpdate) {
  const { data, error } = await supabase.from("leads").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteLead(id: string) {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
}
