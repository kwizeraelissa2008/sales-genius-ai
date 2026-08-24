import { api, type Lead, type LeadStatus } from "@/lib/api";
export type { Lead, LeadStatus } from "@/lib/api";
export type LeadInsert = Omit<Partial<Lead>, "id" | "created_at" | "lead_score"> & { name: string; lead_score?: number };
export type LeadUpdate = Partial<LeadInsert>;
export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "replied", "interested", "meeting", "proposal", "won", "lost"];
export const STATUS_STYLES: Record<LeadStatus, string> = { new:"bg-muted text-muted-foreground", contacted:"bg-primary/10 text-primary", replied:"bg-primary/15 text-primary", interested:"bg-warning/15 text-warning", meeting:"bg-warning/15 text-warning", proposal:"bg-chart-5/15 text-chart-5", won:"bg-success/15 text-success", lost:"bg-destructive/10 text-destructive" };
export function heuristicScore(lead: { job_title?: string | null; company?: string | null; email?: string | null }) { let score=40; const t=(lead.job_title ?? "").toLowerCase(); if (/(ceo|founder|owner|president)/.test(t)) score+=45; else if (/(chief|cto|cfo|coo|cmo|cro)/.test(t)) score+=40; else if (/(vp|vice president|head of)/.test(t)) score+=30; else if (/(director|principal)/.test(t)) score+=22; else if (/(manager|lead)/.test(t)) score+=12; if(lead.company)score+=8;if(lead.email&&!/(gmail|yahoo|hotmail|outlook|proton)\./.test(lead.email))score+=7;return Math.min(score,100); }
export function scoreBreakdown(lead: { job_title?: string | null; company?: string | null; email?: string | null }) { return { total: heuristicScore(lead), factors: [{ label:"Lead profile", detail:"Score considers seniority and available contact details.", points:heuristicScore(lead) }], capped:false }; }
export const listLeads = async () => (await api<{ leads: Lead[] }>("/api/leads")).leads;
export const createLead = async (input: LeadInsert) => (await api<{ lead: Lead }>("/api/leads", { method:"POST", body:JSON.stringify(input) })).lead;
export const updateLead = async (id: string, input: LeadUpdate) => (await api<{ lead: Lead }>(`/api/leads/${id}`, { method:"PATCH", body:JSON.stringify(input) })).lead;
export const deleteLead = async (id: string) => api(`/api/leads/${id}`, { method:"DELETE" });
