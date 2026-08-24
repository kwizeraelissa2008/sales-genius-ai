import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createLead,
  updateLead,
  LEAD_STATUSES,
  type Lead,
  type LeadStatus,
} from "@/lib/leads";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSaved: () => void;
}

const empty = {
  name: "",
  email: "",
  company: "",
  job_title: "",
  description: "",
  status: "new" as LeadStatus,
  notes: "",
};

export function LeadDialog({ open, onOpenChange, lead, onSaved }: Props) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        lead
          ? {
              name: lead.name,
              email: lead.email ?? "",
              company: lead.company ?? "",
              job_title: lead.job_title ?? "",
              description: lead.description ?? "",
              status: lead.status,
              notes: lead.notes ?? "",
            }
          : empty,
      );
    }
  }, [open, lead]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        company: form.company.trim() || null,
        job_title: form.job_title.trim() || null,
        description: form.description.trim() || null,
        status: form.status,
        notes: form.notes.trim() || null,
      };
      if (lead) {
        await updateLead(lead.id, payload);
        toast.success("Lead updated");
      } else {
        await createLead(payload);
        toast.success("Lead added");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{lead ? "Edit lead" : "Add new lead"}</DialogTitle>
            <DialogDescription>
              {lead ? "Update this lead's details." : "AI will auto-score this lead on save."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="lead-name">Name *</Label>
                <Input
                  id="lead-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1.5"
                  required
                  placeholder="Alex Rivera"
                />
              </div>
              <div>
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1.5"
                  placeholder="alex@company.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="lead-company">Company</Label>
                <Input
                  id="lead-company"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="mt-1.5"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <Label htmlFor="lead-title">Job title</Label>
                <Input
                  id="lead-title"
                  value={form.job_title}
                  onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
                  className="mt-1.5"
                  placeholder="VP of Sales"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="lead-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as LeadStatus }))}
              >
                <SelectTrigger id="lead-status" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lead-description">Lead description</Label>
              <Textarea
                id="lead-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1.5"
                placeholder="Professional background, responsibilities, or useful context about this person."
              />
            </div>
            <div>
              <Label htmlFor="lead-notes">Notes</Label>
              <Textarea
                id="lead-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="mt-1.5"
                placeholder="Met at SaaStr, interested in Pro plan..."
              />
            </div>
            {lead && (
              <section className="rounded-xl border border-primary/15 bg-primary/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-medium"><Sparkles className="h-4 w-4 text-primary" /> Why this lead is scored {lead.lead_score}/100</div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Lead score</span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {(lead.score_reasons?.length ? lead.score_reasons : ["Score is based on role seniority and the contact information available."]).map((reason) => (
                    <li key={reason} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary" />{reason}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">Update the title, company, or email and save to refresh this score.</p>
              </section>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {lead ? "Save changes" : "Add lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
