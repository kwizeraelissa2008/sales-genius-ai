import { DollarSign, TrendingUp, Trophy, Percent } from "lucide-react";
import { STAGE_PROBABILITY, type Lead, type LeadStatus } from "@/lib/leads";
import { cn } from "@/lib/utils";

export function formatMoney(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `$${n.toFixed(0)}`;
}

export function PipelineMetrics({ leads }: { leads: Lead[] }) {
  const open = leads.filter((l) => !["won", "closed", "lost"].includes(l.status));
  const pipelineValue = open.reduce((s, l) => s + Number(l.deal_value ?? 0), 0);
  const weighted = open.reduce(
    (s, l) => s + Number(l.deal_value ?? 0) * (STAGE_PROBABILITY[l.status as LeadStatus] ?? 0),
    0,
  );
  const won = leads
    .filter((l) => l.status === "won" || l.status === "closed")
    .reduce((s, l) => s + Number(l.deal_value ?? 0), 0);
  const decided = leads.filter((l) => ["won", "closed", "lost"].includes(l.status)).length;
  const winRate = decided
    ? Math.round(
        (leads.filter((l) => l.status === "won" || l.status === "closed").length / decided) * 100,
      )
    : 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Open pipeline" value={formatMoney(pipelineValue)} sub={`${open.length} deals`} icon={DollarSign} tone="primary" />
      <Stat label="Weighted forecast" value={formatMoney(weighted)} sub="probability adjusted" icon={TrendingUp} tone="chart" />
      <Stat label="Closed won" value={formatMoney(won)} sub="all time" icon={Trophy} tone="success" />
      <Stat label="Win rate" value={`${winRate}%`} sub={`${decided} decided`} icon={Percent} tone="warning" />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "chart" | "warning";
}) {
  const cls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    chart: "bg-chart-5/15 text-chart-5",
    warning: "bg-warning/15 text-warning",
  }[tone];
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid h-7 w-7 place-items-center rounded-md", cls)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-1.5 text-xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}
