import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
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
  status: "new" as LeadStatus,
  notes: "",
  deal_value: "",
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
              status: lead.status,
              notes: lead.notes ?? "",
              deal_value: lead.deal_value ? String(lead.deal_value) : "",
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
      const dealNum = form.deal_value.trim() ? Number(form.deal_value) : 0;
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        company: form.company.trim() || null,
        job_title: form.job_title.trim() || null,
        status: form.status,
        notes: form.notes.trim() || null,
        deal_value: Number.isFinite(dealNum) ? dealNum : 0,
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
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{lead ? "Edit lead" : "Add new lead"}</DialogTitle>
            <DialogDescription>
              {lead ? "Update this lead's details." : "AI will auto-score this lead on save."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-4">
            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-2 gap-3">
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
                <Label htmlFor="lead-deal">Deal value ($)</Label>
                <Input
                  id="lead-deal"
                  type="number"
                  min="0"
                  step="100"
                  value={form.deal_value}
                  onChange={(e) => setForm((f) => ({ ...f, deal_value: e.target.value }))}
                  className="mt-1.5"
                  placeholder="0"
                />
              </div>
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
