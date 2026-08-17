import { scoreBreakdown, type Lead } from "@/lib/leads";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type ScorableLead = Pick<Lead, "lead_score" | "job_title" | "company" | "email">;

function tone(score: number) {
  return score >= 80
    ? { text: "text-success", bar: "bg-success", badge: "bg-success/15 text-success" }
    : score >= 55
      ? { text: "text-warning", bar: "bg-warning", badge: "bg-warning/15 text-warning" }
      : {
          text: "text-muted-foreground",
          bar: "bg-muted-foreground/40",
          badge: "bg-muted text-muted-foreground",
        };
}

function Explanation({ lead }: { lead: ScorableLead }) {
  const bd = scoreBreakdown(lead);
  const differs = bd.total !== lead.lead_score;
  return (
    <div className="space-y-2.5">
      <div>
        <div className="text-sm font-semibold">Why this score?</div>
        <p className="text-xs text-muted-foreground">
          Scores run 0–100 and weight buying power first.
        </p>
      </div>
      <ul className="space-y-1.5">
        {bd.factors.map((f) => (
          <li key={f.label} className="flex items-start justify-between gap-3 text-xs">
            <span>
              <span className="font-medium">{f.label}</span>
              <span className="block text-muted-foreground">{f.detail}</span>
            </span>
            <span
              className={cn(
                "flex-none font-semibold tabular-nums",
                f.points > 0 ? "text-success" : "text-muted-foreground",
              )}
            >
              {f.points > 0 ? `+${f.points}` : "0"}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-border/70 pt-2 text-xs font-semibold">
        <span>Heuristic total{bd.capped ? " (capped at 100)" : ""}</span>
        <span className="tabular-nums">{bd.total}</span>
      </div>
      {differs && (
        <p className="text-[11px] text-muted-foreground">
          Stored score is {lead.lead_score} — it was adjusted by AI enrichment or edited manually.
        </p>
      )}
    </div>
  );
}

/** Score with a progress bar (table rows). */
export function ScoreBar({ lead, className }: { lead: ScorableLead; className?: string }) {
  const t = tone(lead.lead_score);
  return (
    <HoverCard openDelay={120}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={`Lead score ${lead.lead_score} of 100. Show score breakdown`}
          className={cn(
            "flex items-center gap-2 rounded-md px-1 py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <span className="block h-1.5 w-14 overflow-hidden rounded-full bg-muted">
            <span
              className={cn("block h-full", t.bar)}
              style={{ width: `${lead.lead_score}%` }}
            />
          </span>
          <span className={cn("text-sm font-semibold tabular-nums", t.text)}>
            {lead.lead_score}
          </span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-72">
        <Explanation lead={lead} />
      </HoverCardContent>
    </HoverCard>
  );
}

/** Compact score badge (pipeline cards, detail sheet). */
export function ScoreBadge({
  lead,
  prefix,
  className,
}: {
  lead: ScorableLead;
  prefix?: string;
  className?: string;
}) {
  const t = tone(lead.lead_score);
  return (
    <HoverCard openDelay={120}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Lead score ${lead.lead_score} of 100. Show score breakdown`}
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Badge variant="secondary" className={cn("text-[10px]", t.badge, className)}>
            {prefix ? `${prefix} ` : ""}
            {lead.lead_score}
          </Badge>
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-72">
        <Explanation lead={lead} />
      </HoverCardContent>
    </HoverCard>
  );
}
