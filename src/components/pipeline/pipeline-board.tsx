import { useState } from "react";
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
import { GripVertical, Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PIPELINE_STAGES, type Lead, type LeadStatus } from "@/lib/leads";
import { cn } from "@/lib/utils";
import { formatMoney } from "./pipeline-metrics";

export const STAGE_LABEL: Record<LeadStatus, string> = {
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

export function PipelineBoard({
  leads,
  onMove,
  onOpen,
}: {
  leads: Lead[];
  onMove: (leadId: string, stage: LeadStatus) => void;
  onOpen: (lead: Lead) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const byStage = new Map<LeadStatus, Lead[]>();
  PIPELINE_STAGES.forEach((s) => byStage.set(s, []));
  leads.forEach((l) => (byStage.get(l.status as LeadStatus) ?? byStage.get("new")!).push(l));

  const activeLead = activeId ? leads.find((l) => l.id === activeId) ?? null : null;

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const target = e.over?.id ? String(e.over.id) : null;
    if (!target || !PIPELINE_STAGES.includes(target as LeadStatus)) return;
    onMove(String(e.active.id), target as LeadStatus);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-3">
        {PIPELINE_STAGES.map((stage) => {
          const items = byStage.get(stage) ?? [];
          return (
            <Column
              key={stage}
              stage={stage}
              items={items}
              total={items.reduce((s, l) => s + Number(l.deal_value ?? 0), 0)}
              dragging={activeId !== null}
              onOpen={onOpen}
            />
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeLead ? <LeadCard lead={activeLead} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  stage,
  items,
  total,
  dragging,
  onOpen,
}: {
  stage: LeadStatus;
  items: Lead[];
  total: number;
  dragging: boolean;
  onOpen: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[240px] flex-none flex-col rounded-xl border bg-card/40 p-2.5 transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border/70",
        dragging && !isOver && "border-dashed",
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", STAGE_TONE[stage])} />
          <span className="text-[11px] font-semibold uppercase tracking-wide">
            {STAGE_LABEL[stage]}
          </span>
          <span className="text-[11px] text-muted-foreground">{items.length}</span>
        </div>
        {total > 0 && (
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
            {formatMoney(total)}
          </span>
        )}
      </div>
      <div className="flex max-h-[52vh] flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-border/50 py-6 text-[11px] text-muted-foreground">
            Drop leads here
          </div>
        ) : (
          items.map((l) => <DraggableCard key={l.id} lead={l} onOpen={onOpen} />)
        )}
      </div>
    </div>
  );
}

function DraggableCard({ lead, onOpen }: { lead: Lead; onOpen: (lead: Lead) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(lead)}
      className={cn("cursor-grab touch-none active:cursor-grabbing", isDragging && "opacity-30")}
    >
      <LeadCard lead={lead} />
    </div>
  );
}

export function LeadCard({ lead, overlay = false }: { lead: Lead; overlay?: boolean }) {
  const scoreCls =
    lead.lead_score >= 80
      ? "bg-success/15 text-success"
      : lead.lead_score >= 55
        ? "bg-warning/15 text-warning"
        : "bg-muted text-muted-foreground";
  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card p-2.5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elegant)]",
        overlay && "rotate-1 ring-1 ring-primary/30",
      )}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 flex-none text-muted-foreground/60" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{lead.name}</div>
          {lead.company && (
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{lead.company}</div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <Badge variant="secondary" className={cn("text-[10px]", scoreCls)}>
              {lead.lead_score}
            </Badge>
            <div className="flex items-center gap-1.5">
              {lead.last_contacted_at && <Mail className="h-3 w-3 text-success" />}
              {Number(lead.deal_value ?? 0) > 0 && (
                <span className="text-[11px] font-semibold tabular-nums">
                  {formatMoney(Number(lead.deal_value))}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
