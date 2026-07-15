import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DollarSign, TrendingUp, Target, Percent, Activity, Trophy } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { listLeads, PIPELINE_STAGES, STAGE_PROBABILITY, type Lead, type LeadStatus } from "@/lib/leads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — SalesGenius AI" }] }),
  component: AnalyticsPage,
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

function money(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `$${n.toFixed(0)}`;
}

function AnalyticsPage() {
  const { user } = Route.useRouteContext();
  const { data: leads, isLoading } = useQuery({ queryKey: ["leads"], queryFn: listLeads });

  const kpis = useMemo(() => computeKpis(leads ?? []), [leads]);
  const funnel = useMemo(() => computeFunnel(leads ?? []), [leads]);
  const trend = useMemo(() => computeTrend(leads ?? []), [leads]);
  const sources = useMemo(() => computeSources(leads ?? []), [leads]);

  return (
    <AppShell title="Analytics" userEmail={user.email}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Revenue won" value={money(kpis.wonValue)} icon={Trophy} tone="success" hint={`${kpis.wonCount} deals`} isLoading={isLoading} />
        <Kpi label="Pipeline value" value={money(kpis.pipelineValue)} icon={DollarSign} tone="primary" hint={`${kpis.openCount} open`} isLoading={isLoading} />
        <Kpi label="Weighted forecast" value={money(kpis.weighted)} icon={TrendingUp} tone="chart" hint="Probability × value" isLoading={isLoading} />
        <Kpi label="Win rate" value={`${kpis.winRate}%`} icon={Percent} tone="warning" hint={`${kpis.wonCount}/${kpis.decidedCount} decided`} isLoading={isLoading} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Revenue trend" subtitle="Cumulative closed-won by week">
          <div className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : trend.length === 0 ? (
              <Empty label="No revenue yet — close your first deal to see the trend." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => money(Number(v))} width={60} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => money(Number(v))}
                  />
                  <Area type="monotone" dataKey="cumulative" stroke="var(--primary)" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card title="Lead sources" subtitle="Where deals come from">
          <div className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : sources.length === 0 ? (
              <Empty label="Add leads to see source mix." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Pie data={sources} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {sources.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {sources.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {sources.map((s, i) => (
                <li key={s.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-muted-foreground">{s.name}</span>
                  </span>
                  <span className="tabular-nums font-medium">{s.value}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Conversion funnel" subtitle="How leads flow through your pipeline">
          <div className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={70} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                    contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {funnel.map((_, i) => (
                      <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card title="ROI summary" subtitle="Your return on outbound">
          <div className="space-y-4">
            <RoiRow icon={Target} label="Avg deal size" value={money(kpis.avgDeal)} />
            <RoiRow icon={Activity} label="Leads in play" value={String(kpis.openCount)} />
            <RoiRow icon={TrendingUp} label="Projected close" value={money(kpis.projectedClose)} hint="Weighted + won" />
            <RoiRow icon={Trophy} label="Best stage" value={kpis.bestStage} hint={`${kpis.bestStageCount} leads`} />
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="text-xs font-medium text-muted-foreground">Estimated ROI</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-primary">
                {kpis.roi > 0 ? `${kpis.roi}x` : "—"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                vs. $99/mo SalesGenius plan
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

const PIE_COLORS = ["var(--primary)", "var(--chart-5)", "var(--warning)", "var(--success)", "var(--muted-foreground)"];
const FUNNEL_COLORS = [
  "var(--muted-foreground)",
  "var(--primary)",
  "var(--primary)",
  "var(--warning)",
  "var(--warning)",
  "var(--chart-5)",
  "var(--success)",
];

function computeKpis(leads: Lead[]) {
  const wonLeads = leads.filter((l) => l.status === "won" || l.status === "closed");
  const lostLeads = leads.filter((l) => l.status === "lost");
  const openLeads = leads.filter((l) => l.status !== "lost" && l.status !== "closed" && l.status !== "won");
  const wonValue = wonLeads.reduce((s, l) => s + Number(l.deal_value ?? 0), 0);
  const pipelineValue = openLeads.reduce((s, l) => s + Number(l.deal_value ?? 0), 0);
  const weighted = openLeads.reduce(
    (s, l) => s + Number(l.deal_value ?? 0) * (STAGE_PROBABILITY[l.status as LeadStatus] ?? 0),
    0,
  );
  const decidedCount = wonLeads.length + lostLeads.length;
  const winRate = decidedCount === 0 ? 0 : Math.round((wonLeads.length / decidedCount) * 100);
  const avgDeal = wonLeads.length === 0 ? 0 : wonValue / wonLeads.length;

  const byStage = new Map<LeadStatus, number>();
  openLeads.forEach((l) => byStage.set(l.status, (byStage.get(l.status) ?? 0) + 1));
  let bestStage: LeadStatus = "new";
  let bestStageCount = 0;
  byStage.forEach((c, s) => {
    if (c > bestStageCount) { bestStage = s; bestStageCount = c; }
  });

  const projectedClose = wonValue + weighted;
  const roi = Math.round((projectedClose / 99) * 10) / 10;

  return {
    wonValue,
    wonCount: wonLeads.length,
    pipelineValue,
    openCount: openLeads.length,
    weighted: Math.round(weighted),
    winRate,
    decidedCount,
    avgDeal,
    bestStage: STAGE_LABEL[bestStage],
    bestStageCount,
    projectedClose,
    roi,
  };
}

function computeFunnel(leads: Lead[]) {
  return PIPELINE_STAGES.map((s) => ({
    stage: s,
    label: STAGE_LABEL[s],
    count: leads.filter((l) => l.status === s).length,
  }));
}

function computeTrend(leads: Lead[]) {
  const won = leads
    .filter((l) => l.status === "won" || l.status === "closed")
    .map((l) => ({ date: new Date(l.updated_at), value: Number(l.deal_value ?? 0) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  if (won.length === 0) return [];
  const buckets = new Map<string, number>();
  won.forEach(({ date, value }) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + value);
  });
  let cum = 0;
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => {
      cum += v;
      const d = new Date(k);
      return {
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        weekly: v,
        cumulative: cum,
      };
    });
}

function computeSources(leads: Lead[]) {
  if (leads.length === 0) return [];
  const buckets = new Map<string, number>();
  leads.forEach((l) => {
    const email = (l.email ?? "").toLowerCase();
    let src = "Direct";
    if (/(gmail|yahoo|hotmail|outlook|proton)\./.test(email)) src = "Personal email";
    else if (email.includes("@")) src = "Business email";
    else if (l.company) src = "Company entry";
    buckets.set(src, (buckets.get(src) ?? 0) + 1);
  });
  return Array.from(buckets.entries()).map(([name, value]) => ({ name, value }));
}

function Kpi({
  label, value, icon: Icon, tone, hint, isLoading,
}: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "warning" | "chart"; hint?: string; isLoading?: boolean;
}) {
  const cls = { primary: "bg-primary/10 text-primary", success: "bg-success/15 text-success", warning: "bg-warning/15 text-warning", chart: "bg-chart-5/15 text-chart-5" }[tone];
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg", cls)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3">
        {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-3xl font-semibold tabular-nums tracking-tight">{value}</div>}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Card({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)]", className)}>
      <div className="mb-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function RoiRow({ icon: Icon, label, value, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        {hint && <div className="text-[10px] text-muted-foreground/70">{hint}</div>}
      </div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="grid h-full place-items-center text-center text-xs text-muted-foreground">
      {label}
    </div>
  );
}
