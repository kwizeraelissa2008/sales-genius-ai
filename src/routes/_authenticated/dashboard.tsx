import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  Users,
  Flame,
  Gauge,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Plus,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listLeads, LEAD_STATUSES, STATUS_STYLES, type Lead } from "@/lib/leads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SalesGenius AI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const { data: leads, isLoading } = useQuery({ queryKey: ["leads"], queryFn: listLeads });

  const metrics = computeMetrics(leads ?? []);
  const chartData = LEAD_STATUSES.map((s) => ({
    status: s,
    count: (leads ?? []).filter((l) => l.status === s).length,
  }));
  const chartColors = ["var(--muted-foreground)", "var(--primary)", "var(--warning)", "var(--success)"];

  return (
    <AppShell
      title="Dashboard"
      userEmail={user.email}
      actions={
        <Button asChild size="sm" className="shadow-[var(--shadow-elegant)]">
          <Link to="/leads">
            <Plus className="mr-2 h-4 w-4" /> Add lead
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Leads"
          value={metrics.total}
          icon={Users}
          isLoading={isLoading}
          tone="primary"
        />
        <MetricCard
          label="High Priority"
          value={metrics.highPriority}
          icon={Flame}
          isLoading={isLoading}
          tone="warning"
          hint="Score ≥ 80"
        />
        <MetricCard
          label="Avg Score"
          value={metrics.avgScore}
          icon={Gauge}
          isLoading={isLoading}
          tone="chart"
        />
        <MetricCard
          label="Conversion Rate"
          value={`${metrics.conversion}%`}
          icon={TrendingUp}
          isLoading={isLoading}
          tone="success"
          hint="Closed / total"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Leads by status</h2>
              <p className="text-xs text-muted-foreground">Distribution across your pipeline</p>
            </div>
          </div>
          <div className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="status"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelFormatter={(v) => String(v).charAt(0).toUpperCase() + String(v).slice(1)}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={chartColors[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent activity</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/leads">
                View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (leads ?? []).length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-2.5">
              {(leads ?? []).slice(0, 5).map((l) => (
                <li
                  key={l.id}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {l.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{l.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {l.company ?? l.email ?? "—"}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn("capitalize text-[10px]", STATUS_STYLES[l.status])}
                  >
                    {l.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function computeMetrics(leads: Lead[]) {
  const total = leads.length;
  const highPriority = leads.filter((l) => l.lead_score >= 80).length;
  const avgScore =
    total === 0 ? 0 : Math.round(leads.reduce((s, l) => s + l.lead_score, 0) / total);
  const closed = leads.filter((l) => l.status === "closed").length;
  const conversion = total === 0 ? 0 : Math.round((closed / total) * 1000) / 10;
  return { total, highPriority, avgScore, conversion };
}

function MetricCard({
  label,
  value,
  icon: Icon,
  isLoading,
  tone,
  hint,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
  tone: "primary" | "success" | "warning" | "chart";
  hint?: string;
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    chart: "bg-chart-5/15 text-chart-5",
  }[tone];
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elegant)]">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className={cn("grid h-8 w-8 place-items-center rounded-lg", toneCls)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center py-8 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="mt-3 text-sm font-medium">No leads yet</div>
      <div className="mt-1 text-xs text-muted-foreground">
        Add your first lead to see it here.
      </div>
      <Button asChild size="sm" className="mt-3">
        <Link to="/leads">
          <Plus className="mr-2 h-3.5 w-3.5" /> Add lead
        </Link>
      </Button>
    </div>
  );
}
