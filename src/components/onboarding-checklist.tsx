import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, Circle, Loader2, Rocket, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { clearDemoLeads, seedDemoLeads } from "@/lib/demo-data.functions";

type Status = {
  profileDone: boolean;
  leadsCount: number;
  emailsCount: number;
  demoCount: number;
};

async function fetchStatus(): Promise<Status> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { profileDone: false, leadsCount: 0, emailsCount: 0, demoCount: 0 };

  const [profile, leads, emails, demo] = await Promise.all([
    supabase.from("company_profiles").select("onboarded").eq("user_id", user.id).maybeSingle(),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("email_templates").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("is_demo", true),
  ]);

  return {
    profileDone: !!profile.data?.onboarded,
    leadsCount: leads.count ?? 0,
    emailsCount: emails.count ?? 0,
    demoCount: demo.count ?? 0,
  };
}

export function OnboardingChecklist() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<"seed" | "clear" | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: fetchStatus,
    staleTime: 15_000,
  });

  const steps = [
    {
      key: "profile",
      title: "Set up your company profile",
      description: "Powers every AI-personalised email.",
      done: !!data?.profileDone,
      to: "/onboarding" as const,
      cta: "Complete profile",
    },
    {
      key: "leads",
      title: "Add or import your first leads",
      description: "Type them in, upload a CSV, or paste a public profile link.",
      done: (data?.leadsCount ?? 0) > 0,
      to: "/leads" as const,
      cta: "Add leads",
    },
    {
      key: "email",
      title: "Generate your first AI email",
      description: "Pick a lead, choose a goal, and compare two tones.",
      done: (data?.emailsCount ?? 0) > 0,
      to: "/ai" as const,
      cta: "Open AI writer",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  async function runSeed() {
    setBusy("seed");
    try {
      const res = await seedDemoLeads();
      toast.success(
        res.inserted > 0
          ? `Loaded ${res.inserted} sample leads across the pipeline.`
          : "Sample data is already loaded.",
      );
      await qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load sample data");
    } finally {
      setBusy(null);
    }
  }

  async function runClear() {
    setBusy("clear");
    try {
      await clearDemoLeads();
      toast.success("Sample leads removed.");
      await qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove sample data");
    } finally {
      setBusy(null);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)]">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-4 h-2 w-full" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    );
  }

  if (allDone && (data?.demoCount ?? 0) === 0) return null;

  return (
    <section
      aria-labelledby="getting-started-heading"
      className="rounded-2xl border border-primary/25 bg-card p-6 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="getting-started-heading"
            className="flex items-center gap-2 text-base font-semibold"
          >
            <Rocket className="h-4 w-4 text-primary" aria-hidden="true" /> Getting started
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {allDone
              ? "You're all set — remove the sample data whenever you're ready."
              : `${doneCount} of ${steps.length} steps done. Takes about 3 minutes.`}
          </p>
        </div>
        {(data?.demoCount ?? 0) > 0 ? (
          <Button variant="outline" size="sm" onClick={runClear} disabled={busy !== null}>
            {busy === "clear" ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-3.5 w-3.5" />
            )}
            Remove sample data
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={runSeed} disabled={busy !== null}>
            {busy === "seed" ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-3.5 w-3.5" />
            )}
            Load sample demo data
          </Button>
        )}
      </div>

      <Progress
        value={(doneCount / steps.length) * 100}
        className="mt-4 h-1.5"
        aria-label={`Onboarding progress: ${doneCount} of ${steps.length} steps complete`}
      />

      <ul className="mt-4 space-y-2">
        {steps.map((s) => (
          <li
            key={s.key}
            className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
          >
            <span
              className={cn(
                "grid h-6 w-6 flex-none place-items-center rounded-full",
                s.done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
              )}
            >
              {s.done ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Circle className="h-3 w-3" aria-hidden="true" />
              )}
              <span className="sr-only">{s.done ? "Completed" : "Not started"}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block text-sm font-medium",
                  s.done && "text-muted-foreground line-through",
                )}
              >
                {s.title}
              </span>
              <span className="block text-xs text-muted-foreground">{s.description}</span>
            </span>
            {!s.done && (
              <Button asChild size="sm" variant="ghost" className="flex-none">
                <Link to={s.to}>{s.cta}</Link>
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
