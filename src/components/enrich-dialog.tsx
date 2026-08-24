import { useState } from "react";
import { Loader2, Link2, Sparkles, Github, Linkedin, Globe, Twitter, Check } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { createLead } from "@/lib/leads";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

type Row = EnrichedPerson & { include: boolean };
type EnrichedPerson = {
  name: string | null; email: string | null; job_title: string | null; company: string | null;
  location?: string | null; description?: string | null; notes: string | null; source_url: string;
  social_links: Record<string, string | undefined>; suggested_goals: string[]; confidence: string;
  mode: string; lead_score?: number; score_reasons?: string[]; warning?: string;
};

const EXAMPLES = [
  "https://www.linkedin.com/in/jane-doe",
  "https://github.com/torvalds",
  "https://acme.com/about",
];

export function EnrichDialog({ open, onOpenChange, onImported }: Props) {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);

  function reset() {
    setRaw("");
    setRows([]);
  }

  async function onScrape() {
    const urls = raw
      .split(/[\s,]+/)
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 5);
    if (urls.length === 0) {
      toast.error("Paste at least one link");
      return;
    }
    setLoading(true);
    try {
      const { results: res } = await api<{ results: EnrichedPerson[] }>("/api/enrich", {
        method: "POST",
        body: JSON.stringify({ urls }),
      });
      setRows(res.map((r) => ({ ...r, include: true })));
      const warned = res.filter((r) => r.warning).length;
      toast.success(
        `Analyzed ${res.length} link${res.length > 1 ? "s" : ""}${warned ? ` · ${warned} partially blocked` : ""}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read those links");
    } finally {
      setLoading(false);
    }
  }

  function patch(i: number, p: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
  }

  async function onImport() {
    const picked = rows.filter((r) => r.include && (r.name ?? "").trim());
    if (picked.length === 0) {
      toast.error("Nothing to import — a name is required");
      return;
    }
    setImporting(true);
    try {
      for (const p of picked) {
        await createLead({
          name: (p.name ?? "").trim(),
          email: p.email?.trim() || null,
          company: p.company?.trim() || null,
          job_title: p.job_title?.trim() || null,
          description: p.description?.trim() || null,
          notes: p.notes?.trim() || null,
          status: "new",
          lead_score: p.lead_score,
          score_reasons: p.score_reasons,
        });
      }
      toast.success(`Imported ${picked.length} lead${picked.length > 1 ? "s" : ""}`);
      onImported();
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Enrich from links
          </DialogTitle>
          <DialogDescription>
            Paste any public profile or page — LinkedIn, GitHub, X, a company site, a personal
            portfolio. AI reads it and extracts contact intelligence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="enrich-urls">Links (up to 5, one per line)</Label>
          <Textarea
            id="enrich-urls"
            rows={3}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={EXAMPLES.join("\n")}
            className="font-mono text-xs"
          />
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setRaw((r) => (r ? `${r}\n${ex}` : ex))}
                className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <Link2 className="mr-1 inline h-3 w-3" />
                {ex.replace(/^https?:\/\/(www\.)?/, "")}
              </button>
            ))}
          </div>
          <Button onClick={onScrape} disabled={loading || !raw.trim()} className="w-full">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {loading ? "Reading links..." : "Analyze links"}
          </Button>
        </div>

        {rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div
                key={`${r.source_url}-${i}`}
                className={cn(
                  "rounded-xl border p-3 transition-colors",
                  r.include ? "border-primary/40 bg-primary/[0.03]" : "border-border/70",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={r.include}
                      onCheckedChange={(v) => patch(i, { include: Boolean(v) })}
                    />
                    <span className="truncate text-xs text-muted-foreground">
                      {r.source_url.replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                  </div>
                  <div className="flex flex-none items-center gap-1">
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {r.confidence} confidence
                    </Badge>
                    {r.mode === "ejolabs" && (
                      <Badge variant="secondary" className="bg-success/15 text-[10px] text-success">
                        AI
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Input
                    value={r.name ?? ""}
                    onChange={(e) => patch(i, { name: e.target.value })}
                    placeholder="Name *"
                  />
                  <Input
                    value={r.email ?? ""}
                    onChange={(e) => patch(i, { email: e.target.value })}
                    placeholder="Email"
                  />
                  <Input
                    value={r.job_title ?? ""}
                    onChange={(e) => patch(i, { job_title: e.target.value })}
                    placeholder="Job title"
                  />
                  <Input
                    value={r.company ?? ""}
                    onChange={(e) => patch(i, { company: e.target.value })}
                    placeholder="Company"
                  />
                </div>

                <div className="mt-2 grid gap-2">
                  <Textarea
                    value={r.description ?? ""}
                    onChange={(e) => patch(i, { description: e.target.value })}
                    rows={2}
                    placeholder="Professional description"
                    className="text-xs"
                  />
                  <Textarea
                    value={r.notes ?? ""}
                    onChange={(e) => patch(i, { notes: e.target.value })}
                    rows={3}
                    placeholder="Research notes and outreach angles"
                    className="text-xs"
                  />
                </div>

                {typeof r.lead_score === "number" && (
                  <div className="mt-2 rounded-lg bg-primary/[0.05] p-2 text-xs">
                    <span className="font-semibold text-primary">Lead score: {r.lead_score}/100</span>
                    {r.score_reasons?.length ? <ul className="mt-1.5 space-y-1 text-muted-foreground">{r.score_reasons.map((reason) => <li key={reason}>• {reason}</li>)}</ul> : null}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {r.location && <span className="text-muted-foreground">📍 {r.location}</span>}
                  <SocialChip href={r.social_links.linkedin} icon={Linkedin} label="LinkedIn" />
                  <SocialChip href={r.social_links.github} icon={Github} label="GitHub" />
                  <SocialChip href={r.social_links.twitter} icon={Twitter} label="X" />
                  <SocialChip href={r.social_links.website} icon={Globe} label="Website" />
                </div>

                {r.suggested_goals.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.suggested_goals.slice(0, 3).map((g) => (
                      <span
                        key={g}
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {r.warning && (
                  <p className="mt-2 text-[11px] text-warning">⚠ {r.warning}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onImport} disabled={importing || rows.length === 0}>
            {importing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Import {rows.filter((r) => r.include).length || ""} lead
            {rows.filter((r) => r.include).length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SocialChip({
  href,
  icon: Icon,
  label,
}: {
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5 text-[11px] transition-colors hover:border-primary/50 hover:text-primary"
    >
      <Icon className="h-3 w-3" /> {label}
    </a>
  );
}
