import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listLeads,
  updateLead,
  PIPELINE_STAGES,
  STAGE_PROBABILITY,
  type Lead,
  type LeadStatus,
} from "@/lib/leads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline — SalesGenius AI" }] }),
  component: PipelinePage,
});

const STAGE_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  replied: "Replied",
  interested: "Interested",
  meeting: "Meeting",
  proposal: "Proposal",
  won: "Won",
  closed: "Closed",
  lost: "Lost",
};

const STAGE_TONE: Record<LeadStatus, string> = {
  new: "bg-muted-foreground/60",
  contacted: "bg-primary/70",
  replied: "bg-primary",
  interested: "bg-warning/70",
  meeting: "bg-warning",
  proposal: "bg-chart-5",
  won: "bg-success",
  closed: "bg-success/70",
  lost: "bg-destructive",
};

function formatMoney(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `$${n.toFixed(0)}`;
}

function PipelinePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: leads, isLoading } = useQuery({ queryKey: ["leads"], queryFn: listLeads });
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const byStage = useMemo(() => {
    const map = new Map<LeadStatus, Lead[]>();
    PIPELINE_STAGES.forEach((s) => map.set(s, []));
    (leads ?? []).forEach((l) => {
      const arr = map.get(l.status as LeadStatus) ?? map.get("new")!;
      arr.push(l);
    });
    return map;
  }, [leads]);

  const totals = useMemo(() => {
    const pipelineValue = (leads ?? [])
      .filter((l) => l.status !== "lost" && l.status !== "closed")
      .reduce((s, l) => s + Number(l.deal_value ?? 0), 0);
    const weighted = (leads ?? []).reduce(
      (s, l) => s + Number(l.deal_value ?? 0) * (STAGE_PROBABILITY[l.status as LeadStatus] ?? 0),
      0,
    );
    const won = (leads ?? [])
      .filter((l) => l.status === "won" || l.status === "closed")
      .reduce((s, l) => s + Number(l.deal_value ?? 0), 0);
    return { pipelineValue, weighted, won };
  }, [leads]);

  const activeLead = activeId ? (leads ?? []).find((l) => l.id === activeId) ?? null : null;

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const leadId = String(e.active.id);
    const target = e.over?.id ? String(e.over.id) : null;
    if (!target || !PIPELINE_STAGES.includes(target as LeadStatus)) return;
    const lead = (leads ?? []).find((l) => l.id === leadId);
    if (!lead || lead.status === target) return;

    qc.setQueryData<Lead[]>(["leads"], (prev) =>
      (prev ?? []).map((l) => (l.id === leadId ? { ...l, status: target as LeadStatus } : l)),
    );
    try {
      await updateLead(leadId, { status: target as LeadStatus });
      toast.success(`Moved to ${STAGE_LABEL[target as LeadStatus]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move");
      qc.invalidateQueries({ queryKey: ["leads"] });
    }
  }

  return (
    <AppShell title="Pipeline" userEmail={user.email}>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TotalCard label="Total pipeline" value={formatMoney(totals.pipelineValue)} icon={DollarSign} tone="primary" />
        <TotalCard label="Weighted forecast" value={formatMoney(totals.weighted)} icon={TrendingUp} tone="chart" />
        <TotalCard label="Closed won" value={formatMoney(totals.won)} icon={DollarSign} tone="success" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-7">
          {PIPELINE_STAGES.map((s) => (
            <Skeleton key={s} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-7">
            {PIPELINE_STAGES.map((stage) => {
              const items = byStage.get(stage) ?? [];
              const total = items.reduce((s, l) => s + Number(l.deal_value ?? 0), 0);
              return (
                <Column
                  key={stage}
                  stage={stage}
                  items={items}
                  total={total}
                  isDraggingOver={activeId !== null}
                />
              );
            })}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeLead ? <Card lead={activeLead} overlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </AppShell>
  );
}

function Column({
  stage,
  items,
  total,
  isDraggingOver,
}: {
  stage: LeadStatus;
  items: Lead[];
  total: number;
  isDraggingOver: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[400px] flex-col rounded-xl border bg-card/40 p-3 transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border/70",
        isDraggingOver && !isOver && "border-dashed",
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", STAGE_TONE[stage])} />
          <span className="text-xs font-semibold uppercase tracking-wide">{STAGE_LABEL[stage]}</span>
          <span className="text-xs text-muted-foreground">{items.length}</span>
        </div>
        {total > 0 && (
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {formatMoney(total)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-border/50 py-8 text-xs text-muted-foreground">
            Drop leads here
          </div>
        ) : (
          items.map((l) => <DraggableCard key={l.id} lead={l} />)
        )}
      </div>
    </div>
  );
}

function DraggableCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab touch-none active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
    >
      <Card lead={lead} />
    </div>
  );
}

function Card({ lead, overlay = false }: { lead: Lead; overlay?: boolean }) {
  const scoreCls =
    lead.lead_score >= 80
      ? "bg-success/15 text-success"
      : lead.lead_score >= 55
        ? "bg-warning/15 text-warning"
        : "bg-muted text-muted-foreground";
  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card p-3 shadow-[var(--shadow-card)]",
        overlay && "rotate-1 shadow-[var(--shadow-elegant)] ring-1 ring-primary/30",
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 flex-none text-muted-foreground/60" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{lead.name}</div>
          {lead.company && (
            <div className="mt-0.5 truncate text-xs text-muted-foreground">{lead.company}</div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <Badge variant="secondary" className={cn("text-[10px]", scoreCls)}>
              {lead.lead_score}
            </Badge>
            {Number(lead.deal_value ?? 0) > 0 && (
              <span className="text-xs font-semibold tabular-nums">
                {formatMoney(Number(lead.deal_value))}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TotalCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "chart";
}) {
  const cls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    chart: "bg-chart-5/15 text-chart-5",
  }[tone];
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg", cls)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}
