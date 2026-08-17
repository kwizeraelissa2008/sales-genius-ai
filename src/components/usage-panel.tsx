import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Crown, Gauge } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getUsageSummary } from "@/lib/usage.functions";
import { quotaLabel, quotaPercent, type UsageSummary } from "@/lib/usage";

export function useUsage() {
  return useQuery<UsageSummary>({
    queryKey: ["usage"],
    queryFn: () => getUsageSummary() as Promise<UsageSummary>,
    staleTime: 30_000,
  });
}

export function UsagePanel({ showUpgrade = true }: { showUpgrade?: boolean }) {
  const { data, isLoading } = useUsage();

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Gauge className="h-4 w-4 text-primary" aria-hidden="true" /> Monthly usage
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Allowances reset on the 1st of each month.
          </p>
        </div>
        {data && (
          <Badge variant="secondary" className="capitalize">
            {data.plan} plan
          </Badge>
        )}
      </div>

      {isLoading || !data ? (
        <div className="mt-5 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <Meter
            title="AI email generations"
            quota={data.aiEmails}
            noun="generations"
          />
          <Meter title="Lead enrichments" quota={data.enrichments} noun="enrichments" />
          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            {data.sendsToday.used} of a recommended {data.sendsToday.softLimit} cold emails sent
            today. This one is guidance, not a hard block.
          </div>
          {showUpgrade && data.plan === "free" && (
            <Button asChild size="sm" className="w-full">
              <Link to="/billing">
                <Crown className="mr-2 h-3.5 w-3.5" /> Upgrade for higher limits
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Meter({
  title,
  quota,
  noun,
}: {
  title: string;
  quota: { used: number; limit: number | null };
  noun: string;
}) {
  const pct = quotaPercent(quota);
  const over = quota.limit !== null && quota.used >= quota.limit;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{title}</span>
        <span className={over ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {quotaLabel(quota, noun)}
        </span>
      </div>
      <Progress
        value={quota.limit === null ? 0 : pct}
        className="mt-2 h-1.5"
        aria-label={`${title}: ${quotaLabel(quota, noun)}`}
      />
    </div>
  );
}
