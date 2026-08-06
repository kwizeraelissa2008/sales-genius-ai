import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  Trash2,
  Trophy,
  XCircle,
  Save,
  Loader2,
  Linkedin,
  Github,
  Twitter,
  Globe,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/leads";
import { STAGE_LABEL } from "./pipeline-board";

type Links = {
  linkedin?: string;
  github?: string;
  twitter?: string;
  website?: string;
};

export function LeadSheet({
  lead,
  onOpenChange,
  onSave,
  onDelete,
}: {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: Partial<Lead>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<LeadStatus>("new");
  const [dealValue, setDealValue] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (lead) {
      setStatus(lead.status);
      setDealValue(lead.deal_value ? String(lead.deal_value) : "");
      setNotes(lead.notes ?? "");
    }
  }, [lead]);

  if (!lead) return null;
  const links = (lead.social_links ?? {}) as Links;

  async function run(fn: () => Promise<void>, msg: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={!!lead} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {lead.name}
            <Badge variant="secondary">Score {lead.lead_score}</Badge>
          </SheetTitle>
          <SheetDescription>
            {[lead.job_title, lead.company].filter(Boolean).join(" · ") || "No role on file"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          <div className="space-y-1 text-sm">
            {lead.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {lead.email}
              </div>
            )}
            {lead.location && <div className="text-muted-foreground">📍 {lead.location}</div>}
            {lead.last_contacted_at && (
              <div className="text-xs text-success">
                Last contacted {new Date(lead.last_contacted_at).toLocaleDateString()}
              </div>
            )}
          </div>

          {(links.linkedin || links.github || links.twitter || links.website || lead.source_url) && (
            <div className="flex flex-wrap gap-2">
              <LinkChip href={links.linkedin} icon={Linkedin} label="LinkedIn" />
              <LinkChip href={links.github} icon={Github} label="GitHub" />
              <LinkChip href={links.twitter} icon={Twitter} label="X" />
              <LinkChip href={links.website ?? lead.source_url ?? undefined} icon={Globe} label="Website" />
            </div>
          )}

          {lead.bio && (
            <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">{lead.bio}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Stage</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STAGE_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Deal value ($)</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1.5"
              placeholder="Next steps, objections, context..."
            />
          </div>

          <Button
            className="w-full"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const n = Number(dealValue || 0);
                await onSave(lead.id, {
                  status,
                  deal_value: Number.isFinite(n) ? n : 0,
                  notes: notes.trim() || null,
                });
              }, "Deal updated")
            }
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/ai", search: { leadId: lead.id } })}
            >
              <Sparkles className="mr-2 h-4 w-4" /> Write email
            </Button>
            <Button
              variant="outline"
              className="text-success"
              disabled={busy}
              onClick={() => run(() => onSave(lead.id, { status: "won" }), "Marked as won")}
            >
              <Trophy className="mr-2 h-4 w-4" /> Mark won
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => run(() => onSave(lead.id, { status: "lost" }), "Marked as lost")}
            >
              <XCircle className="mr-2 h-4 w-4" /> Mark lost
            </Button>
            <Button
              variant="outline"
              className="text-destructive"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await onDelete(lead.id);
                  onOpenChange(false);
                }, "Lead deleted")
              }
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LinkChip({
  href,
  icon: Icon,
  label,
}: {
  href?: string | null;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-xs transition-colors hover:border-primary/50 hover:text-primary"
    >
      <Icon className="h-3 w-3" /> {label}
    </a>
  );
}
