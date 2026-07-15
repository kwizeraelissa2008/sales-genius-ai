import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SequenceStep = Database["public"]["Tables"]["email_sequences"]["Row"];
export type SequenceStatus = Database["public"]["Enums"]["sequence_step_status"];

export const STEP_STATUS_STYLES: Record<SequenceStatus, string> = {
  pending: "bg-primary/10 text-primary",
  sent: "bg-success/15 text-success",
  skipped: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
};

/** Default 4-touch outbound cadence (days from now). */
export const DEFAULT_CADENCE = [
  { offsetDays: 0, subject: "Quick intro — {{firstName}}", angle: "initial outreach — hook + one-line value prop" },
  { offsetDays: 3, subject: "Following up, {{firstName}}", angle: "gentle follow-up referencing the first email" },
  { offsetDays: 7, subject: "Different angle for {{company}}", angle: "case study or ROI-focused angle" },
  { offsetDays: 14, subject: "Last note", angle: "polite break-up email leaving the door open" },
] as const;

export async function listSequenceSteps(leadId?: string): Promise<SequenceStep[]> {
  let q = supabase.from("email_sequences").select("*").order("scheduled_at", { ascending: true });
  if (leadId) q = q.eq("lead_id", leadId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createSequence(
  leadId: string,
  steps: { step_number: number; scheduled_at: string; subject: string; body: string }[],
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const rows = steps.map((s) => ({ ...s, lead_id: leadId, user_id: user.id }));
  const { data, error } = await supabase.from("email_sequences").insert(rows).select("*");
  if (error) throw error;
  return data ?? [];
}

export async function updateStep(id: string, patch: Partial<SequenceStep>) {
  const { data, error } = await supabase.from("email_sequences").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteStep(id: string) {
  const { error } = await supabase.from("email_sequences").delete().eq("id", id);
  if (error) throw error;
}
