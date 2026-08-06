import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { PipelineMetrics } from "@/components/pipeline/pipeline-metrics";
import { LeadSheet } from "@/components/pipeline/lead-sheet";
import { listLeads, updateLead, deleteLead, type Lead, type LeadStatus } from "@/lib/leads";

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({
    meta: [
      { title: "Sales Pipeline — SalesGenius AI" },
      {
        name: "description",
        content:
          "Drag deals across stages, track weighted forecast, and act on every lead from one board.",
      },
    ],
  }),
  component: PipelinePage,
});

function PipelinePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: leads, isLoading } = useQuery({ queryKey: ["leads"], queryFn: listLeads });
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = leads ?? [];
    if (!q) return all;
    return all.filter((l) =>
      [l.name, l.company, l.email, l.job_title]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [leads, query]);

  const openLead = openId ? (leads ?? []).find((l) => l.id === openId) ?? null : null;

  async function patch(id: string, patchData: Partial<Lead>) {
    await updateLead(id, patchData);
    await qc.invalidateQueries({ queryKey: ["leads"] });
  }

  async function move(id: string, stage: LeadStatus) {
    const current = (leads ?? []).find((l) => l.id === id);
    if (!current || current.status === stage) return;
    try {
      await patch(id, { status: stage });
      toast.success(`${current.name} moved to ${stage}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not move lead");
    }
  }

  return (
    <AppShell title="Pipeline" userEmail={user.email}>
      <div className="space-y-4">
        <PipelineMetrics leads={leads ?? []} />

        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search deals..."
              className="pl-8"
            />
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Drag cards between stages · click a card for details
          </p>
        </div>

        {isLoading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[300px] w-[240px] flex-none rounded-xl" />
            ))}
          </div>
        ) : (
          <PipelineBoard leads={filtered} onMove={move} onOpen={(l) => setOpenId(l.id)} />
        )}
      </div>

      <LeadSheet
        lead={openLead}
        onOpenChange={(open) => !open && setOpenId(null)}
        onSave={patch}
        onDelete={async (id) => {
          await deleteLead(id);
          await qc.invalidateQueries({ queryKey: ["leads"] });
        }}
      />
    </AppShell>
  );
}
