import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Calendar, Trash2, Zap, CheckCircle2, Clock, XCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { listLeads, type Lead } from "@/lib/leads";
import {
  listSequenceSteps,
  createSequence,
  deleteStep,
  DEFAULT_CADENCE,
  STEP_STATUS_STYLES,
  type SequenceStep,
  type SequenceStatus,
} from "@/lib/sequences";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sequences")({
  head: () => ({ meta: [{ title: "Follow-ups — SalesGenius AI" }] }),
  component: SequencesPage,
});

const STATUS_ICON: Record<SequenceStatus, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  sent: CheckCircle2,
  skipped: XCircle,
  failed: XCircle,
};

function SequencesPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");

  const { data: leads } = useQuery({ queryKey: ["leads"], queryFn: listLeads });
  const { data: steps, isLoading } = useQuery({
    queryKey: ["sequences"],
    queryFn: () => listSequenceSteps(),
  });

  const leadsById = useMemo(() => {
    const m = new Map<string, Lead>();
    (leads ?? []).forEach((l) => m.set(l.id, l));
    return m;
  }, [leads]);

  const grouped = useMemo(() => {
    const byLead = new Map<string, SequenceStep[]>();
    (steps ?? []).forEach((s) => {
      const arr = byLead.get(s.lead_id) ?? [];
      arr.push(s);
      byLead.set(s.lead_id, arr);
    });
    return Array.from(byLead.entries()).map(([leadId, items]) => ({
      lead: leadsById.get(leadId),
      leadId,
      items: items.sort((a, b) => a.step_number - b.step_number),
    }));
  }, [steps, leadsById]);

  const stats = useMemo(() => {
    const all = steps ?? [];
    return {
      total: all.length,
      pending: all.filter((s) => s.status === "pending").length,
      sent: all.filter((s) => s.status === "sent").length,
      dueToday: all.filter(
        (s) => s.status === "pending" && new Date(s.scheduled_at) <= new Date(Date.now() + 24 * 3600 * 1000),
      ).length,
    };
  }, [steps]);

  async function handleSchedule() {
    if (!selectedLeadId) return;
    const lead = leadsById.get(selectedLeadId);
    if (!lead) return;
    const firstName = lead.name.split(" ")[0] ?? lead.name;
    const now = new Date();
    const rows = DEFAULT_CADENCE.map((c, i) => {
      const when = new Date(now.getTime() + c.offsetDays * 24 * 3600 * 1000);
      return {
        step_number: i + 1,
        scheduled_at: when.toISOString(),
        subject: c.subject.replaceAll("{{firstName}}", firstName).replaceAll("{{company}}", lead.company ?? "your team"),
        body: `[Draft] ${c.angle}\n\nHi ${firstName},\n\n— Use the AI Assistant to personalize this before it sends.`,
      };
    });
    try {
      await createSequence(selectedLeadId, rows);
      toast.success(`Scheduled ${rows.length}-step sequence for ${lead.name}`);
      qc.invalidateQueries({ queryKey: ["sequences"] });
      setScheduleOpen(false);
      setSelectedLeadId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteStep(id);
      qc.invalidateQueries({ queryKey: ["sequences"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const eligibleLeads = (leads ?? []).filter((l) => l.email);

  return (
    <AppShell
      title="Follow-ups"
      userEmail={user.email}
      actions={
        <Button onClick={() => setScheduleOpen(true)} className="shadow-[var(--shadow-elegant)]">
          <Plus className="mr-2 h-4 w-4" /> Schedule sequence
        </Button>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Calendar} label="Total steps" value={stats.total} tone="primary" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} tone="warning" />
        <StatCard icon={Zap} label="Due within 24h" value={stats.dueToday} tone="chart" />
        <StatCard icon={CheckCircle2} label="Sent" value={stats.sent} tone="success" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No sequences scheduled</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule a multi-touch cadence to stay on your leads&apos; radar automatically.
          </p>
          <Button className="mt-4" onClick={() => setScheduleOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Schedule your first sequence
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ lead, leadId, items }) => (
            <div key={leadId} className="rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
                <div>
                  <div className="text-sm font-semibold">{lead?.name ?? "Deleted lead"}</div>
                  <div className="text-xs text-muted-foreground">
                    {lead?.email ?? "—"} {lead?.company ? `· ${lead.company}` : ""}
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/leads">View lead</Link>
                </Button>
              </div>
              <ul className="divide-y divide-border/60">
                {items.map((s) => {
                  const Icon = STATUS_ICON[s.status];
                  const when = new Date(s.scheduled_at);
                  const overdue = s.status === "pending" && when < new Date();
                  return (
                    <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                      <div className={cn("grid h-8 w-8 flex-none place-items-center rounded-lg", STEP_STATUS_STYLES[s.status])}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Step {s.step_number}
                          </span>
                          <Badge variant="secondary" className={cn("capitalize text-[10px]", STEP_STATUS_STYLES[s.status])}>
                            {s.status}
                          </Badge>
                          {overdue && (
                            <Badge variant="secondary" className="text-[10px] bg-warning/15 text-warning">
                              overdue
                            </Badge>
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-sm font-medium">{s.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {when.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule a 4-touch sequence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 text-sm font-medium">Choose a lead</div>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder={eligibleLeads.length ? "Select a lead with email" : "Add a lead with an email first"} />
                </SelectTrigger>
                <SelectContent>
                  {eligibleLeads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                      {l.company ? ` — ${l.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-xs">
              <div className="mb-2 font-medium text-foreground">Cadence preview</div>
              <ul className="space-y-1.5 text-muted-foreground">
                {DEFAULT_CADENCE.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span>
                      Day {c.offsetDays} — <span className="text-foreground">{c.angle}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={!selectedLeadId}>
              <Zap className="mr-2 h-4 w-4" /> Schedule sequence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function StatCard({
  icon: Icon, label, value, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number;
  tone: "primary" | "success" | "warning" | "chart";
}) {
  const cls = { primary: "bg-primary/10 text-primary", success: "bg-success/15 text-success", warning: "bg-warning/15 text-warning", chart: "bg-chart-5/15 text-chart-5" }[tone];
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg", cls)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
