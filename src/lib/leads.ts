import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadStatus = Database["public"]["Enums"]["lead_status"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "replied",
  "interested",
  "meeting",
  "proposal",
  "won",
  "closed",
  "lost",
];

export const PIPELINE_STAGES: LeadStatus[] = [
  "new",
  "contacted",
  "replied",
  "meeting",
  "proposal",
  "won",
  "lost",
];

/** Win probability by stage — used for weighted pipeline value. */
export const STAGE_PROBABILITY: Record<LeadStatus, number> = {
  new: 0.1,
  contacted: 0.2,
  replied: 0.4,
  interested: 0.5,
  meeting: 0.6,
  proposal: 0.8,
  won: 1,
  closed: 1,
  lost: 0,
};

export const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-muted text-muted-foreground",
  contacted: "bg-primary/10 text-primary",
  replied: "bg-primary/15 text-primary",
  interested: "bg-warning/15 text-warning",
  meeting: "bg-warning/15 text-warning",
  proposal: "bg-chart-5/15 text-chart-5",
  won: "bg-success/15 text-success",
  closed: "bg-success/15 text-success",
  lost: "bg-destructive/10 text-destructive",
};

export type ScoreFactor = {
  label: string;
  detail: string;
  points: number;
};

export type ScoreBreakdown = {
  total: number;
  factors: ScoreFactor[];
  capped: boolean;
};

type ScorableLead = {
  job_title?: string | null;
  company?: string | null;
  email?: string | null;
};

/**
 * Explainable scoring: returns every factor that contributed points so the UI
 * can show *why* a lead earned its score.
 */
export function scoreBreakdown(lead: ScorableLead): ScoreBreakdown {
  const factors: ScoreFactor[] = [
    { label: "Base score", detail: "Every lead starts here", points: 40 },
  ];

  const title = (lead.job_title ?? "").toLowerCase();
  if (/(ceo|founder|owner|president)/.test(title))
    factors.push({ label: "Job title seniority", detail: "Founder / owner level", points: 45 });
  else if (/(cto|cfo|coo|cmo|cro|chief)/.test(title))
    factors.push({ label: "Job title seniority", detail: "C-suite executive", points: 40 });
  else if (/(vp|vice president|head of)/.test(title))
    factors.push({ label: "Job title seniority", detail: "VP / Head of", points: 30 });
  else if (/(director|principal)/.test(title))
    factors.push({ label: "Job title seniority", detail: "Director / principal", points: 22 });
  else if (/(manager|lead)/.test(title))
    factors.push({ label: "Job title seniority", detail: "Manager / team lead", points: 12 });
  else if (title)
    factors.push({ label: "Job title seniority", detail: "Individual contributor", points: 5 });
  else factors.push({ label: "Job title seniority", detail: "No job title on file", points: 0 });

  const company = (lead.company ?? "").trim();
  factors.push({
    label: "Company presence",
    detail: company ? `Works at ${company}` : "No company on file",
    points: company.length > 0 ? 8 : 0,
  });

  const email = (lead.email ?? "").toLowerCase();
  const isBusiness = !!email && !/(gmail|yahoo|hotmail|outlook|proton)\./.test(email);
  factors.push({
    label: "Business email domain",
    detail: !email
      ? "No email on file"
      : isBusiness
        ? "Company domain address"
        : "Free consumer mailbox",
    points: isBusiness ? 7 : 0,
  });

  const raw = factors.reduce((sum, f) => sum + f.points, 0);
  return { total: Math.max(0, Math.min(100, raw)), factors, capped: raw > 100 };
}

/** Heuristic lead scoring — used as a fallback when Groq is unavailable. */
export function heuristicScore(lead: ScorableLead): number {
  return scoreBreakdown(lead).total;
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
