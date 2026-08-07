import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UsageSummary } from "@/lib/usage";

/** Gentle, non-blocking deliverability guidance shown near the send action. */
export function DeliverabilityNotice({
  usage,
  className,
}: {
  usage?: UsageSummary | null;
  className?: string;
}) {
  const sends = usage?.sendsToday;
  const near = sends ? sends.used >= sends.softLimit * 0.8 : false;
  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground",
        near && "border-warning/50 bg-warning/10",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 font-medium text-foreground">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Domain safety
      </div>
      <p className="mt-1">
        {sends
          ? `${sends.used} of a recommended ${sends.softLimit} cold emails sent today.`
          : `We recommend keeping cold sends under ${50} per day per domain.`}{" "}
        Warm a new domain up gradually, personalise every email, and always include an easy
        opt-out — mailbox providers reward low complaint rates.
      </p>
    </div>
  );
}
