import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Sparkles,
  Copy,
  Loader2,
  Zap,
  Send,
  RefreshCw,
  Wand2,
  MailWarning,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listLeads } from "@/lib/leads";
import { generateEmail, type EmailVariant } from "@/lib/ai.functions";
import { DeliverabilityNotice } from "@/components/deliverability-notice";
import { useUsage } from "@/components/usage-panel";
import { suggestGoals, sendLeadEmail, getMailerStatus } from "@/lib/enrich.functions";
import { GOAL_PRESETS } from "@/lib/goals";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ai")({
  validateSearch: z.object({ leadId: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "AI Outreach Assistant — SalesGenius AI" },
      {
        name: "description",
        content:
          "Generate and send personalized outreach emails with AI-suggested goals for every lead.",
      },
    ],
  }),
  component: AIPage,
});

function AIPage() {
  const { user } = Route.useRouteContext();
  const { leadId } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const generate = useServerFn(generateEmail);
  const getGoals = useServerFn(suggestGoals);
  const send = useServerFn(sendLeadEmail);
  const mailerStatus = useServerFn(getMailerStatus);

  const { data: leads } = useQuery({ queryKey: ["leads"], queryFn: listLeads });
  const { data: usage } = useUsage();
  const { data: mailer } = useQuery({
    queryKey: ["mailer-status"],
    queryFn: () => mailerStatus({}),
  });
  const [selectedId, setSelectedId] = useState<string>(leadId ?? "");
  const [goal, setGoal] = useState(GOAL_PRESETS[0].goals[0]);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<string | null>(null);
  const [variants, setVariants] = useState<EmailVariant[]>([]);
  const [tone, setTone] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);


  useEffect(() => {
    if (leadId) setSelectedId(leadId);
  }, [leadId]);

  useEffect(() => {
    if (!selectedId && leads && leads.length > 0) setSelectedId(leads[0].id);
  }, [leads, selectedId]);

  const lead = useMemo(
    () => (leads ?? []).find((l) => l.id === selectedId) ?? null,
    [leads, selectedId],
  );

  const aiGoals = useMutation({
    mutationFn: async () => {
      if (!lead) throw new Error("Pick a lead first");
      return getGoals({
        data: {
          leadName: lead.name,
          leadTitle: lead.job_title,
          leadCompany: lead.company,
          leadBio: lead.bio,
          leadStatus: lead.status,
        },
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not suggest goals"),
  });

  async function onGenerate() {
    if (!lead) return toast.error("Pick a lead first");
    const trimmedGoal = goal.trim();
    if (!trimmedGoal) return toast.error("Pick or describe a goal for this email");
    setLoading(true);
    setVariants([]);
    setSubject("");
    setBody("");
    try {
      const res = await generate({
        data: {
          leadName: lead.name,
          leadCompany: lead.company,
          leadTitle: lead.job_title,
          leadEmail: lead.email,
          leadScore: lead.lead_score,
          goal: trimmedGoal,
          senderName: user.email?.split("@")[0] ?? null,
          senderCompany: null,
        },
      });
      setVariants(res.variants);
      const primary = res.variants[0];
      setTone(primary.tone);
      setSubject(primary.subject);
      setBody(primary.body);
      setMode(res.mode);
      qc.invalidateQueries({ queryKey: ["usage"] });
      toast.success(res.mode === "groq" ? "Generated with AI" : "Generated with smart fallback");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  const sending = useMutation({
    mutationFn: async () => {
      if (!lead) throw new Error("Pick a lead first");
      if (!lead.email) throw new Error(`${lead.name} has no email address yet`);
      return send({
        data: {
          leadId: lead.id,
          to: lead.email,
          subject,
          body,
          fromName: user.email?.split("@")[0] ?? "Sales",
        },
      });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      setConfirmOpen(false);
      if (res.delivered) {
        toast.success(`Email sent to ${lead?.email} · lead marked as contacted`);
      } else {
        toast.error(res.reason ?? "Sending is not configured yet", {
          description: "Your draft was saved so nothing is lost.",
        });
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Send failed"),
  });


  const suggested = aiGoals.data ?? [];

  return (
    <AppShell title="AI Assistant" userEmail={user.email}>
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Generate personalized email</h2>
              <p className="text-xs text-muted-foreground">
                Context-aware · uses your company profile
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Lead</Label>
              <Select
                value={selectedId}
                onValueChange={(v) => {
                  setSelectedId(v);
                  aiGoals.reset();
                  navigate({ to: "/ai", search: { leadId: v }, replace: true });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lead..." />
                </SelectTrigger>
                <SelectContent>
                  {(leads ?? []).map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                      {l.company ? ` · ${l.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!leads || leads.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  Add or enrich a lead first from the Leads page.
                </p>
              )}
            </div>

            {lead && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{lead.name}</span>
                  <Badge variant="secondary">Score {lead.lead_score}</Badge>
                </div>
                {lead.job_title && (
                  <div className="mt-1 text-muted-foreground">{lead.job_title}</div>
                )}
                {lead.company && <div className="text-muted-foreground">{lead.company}</div>}
                <div className="mt-1 text-muted-foreground">
                  {lead.email ?? "No email on file — add one to send"}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Goal / context</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => aiGoals.mutate()}
                  disabled={!lead || aiGoals.isPending}
                >
                  {aiGoals.isPending ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="mr-1 h-3 w-3" />
                  )}
                  Suggest for this lead
                </Button>
              </div>

              {suggested.length > 0 && (
                <div className="space-y-1.5 rounded-lg border border-primary/30 bg-primary/[0.03] p-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-medium text-primary">
                      Tailored suggestions
                    </span>
                    <button
                      type="button"
                      onClick={() => aiGoals.mutate()}
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="inline h-3 w-3" /> new
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {suggested.map((g) => (
                      <GoalChip key={g} goal={g} active={goal === g} onPick={setGoal} />
                    ))}
                  </div>
                </div>
              )}

              <Select value="" onValueChange={setGoal}>
                <SelectTrigger aria-label="Browse goal presets">
                  <SelectValue placeholder="Browse goal presets..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {GOAL_PRESETS.map((group) => (
                    <SelectGroup key={group.group}>
                      <SelectLabel>{group.group}</SelectLabel>
                      {group.goals.map((g) => (
                        <SelectItem key={g} value={g} className="text-xs">
                          {g}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                rows={2}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Or write your own goal for this email..."
              />
            </div>

            <Button
              className="w-full shadow-[var(--shadow-elegant)]"
              onClick={onGenerate}
              disabled={loading || !lead || !goal.trim()}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Generate email
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)]">
          {!subject && !loading && (
            <div className="grid h-full min-h-[260px] place-items-center text-center">
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Your email will appear here</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Pick a lead, choose a goal, and send it in one click.
                </p>
              </div>
            </div>
          )}
          {loading && (
            <div className="grid h-full min-h-[260px] place-items-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Crafting your email...</p>
              </div>
            </div>
          )}
          {subject && (
            <div className="space-y-4">
              {variants.length > 1 && (
                <div
                  role="group"
                  aria-label="Choose an email tone"
                  className="flex flex-wrap gap-2"
                >
                  {variants.map((v) => (
                    <button
                      key={v.tone}
                      type="button"
                      aria-pressed={tone === v.tone}
                      onClick={() => {
                        setTone(v.tone);
                        setSubject(v.subject);
                        setBody(v.body);
                      }}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        tone === v.tone
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/70 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge
                  variant="secondary"
                  className={
                    mode === "groq" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                  }
                >
                  {mode === "groq" ? "AI generated" : "Smart fallback"}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
                      toast.success("Copied to clipboard");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
                  <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        disabled={sending.isPending || !lead?.email || !subject.trim() || !body.trim()}
                        className="shadow-[var(--shadow-elegant)]"
                      >
                        {sending.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Send email
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Send this email now?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="space-y-2 text-sm">
                            <p>
                              We&apos;ll deliver it straight from the app — no need to open Gmail or
                              any other mail app.
                            </p>
                            <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-xs">
                              <p>
                                <span className="text-muted-foreground">From:</span> {user.email}
                              </p>
                              <p>
                                <span className="text-muted-foreground">To:</span> {lead?.email}
                              </p>
                              <p className="line-clamp-2">
                                <span className="text-muted-foreground">Subject:</span> {subject}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Replies land in your inbox and the lead moves to “Contacted”.
                            </p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={sending.isPending}>Cancel</AlertDialogCancel>
                        <Button
                          onClick={() => sending.mutate()}
                          disabled={sending.isPending}
                          className="shadow-[var(--shadow-elegant)]"
                        >
                          {sending.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Confirm &amp; send
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <Textarea
                  rows={2}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 font-medium"
                />
              </div>
              {mailer && !mailer.connected && (
                <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <MailWarning className="h-3.5 w-3.5" aria-hidden="true" />
                    No email provider is connected yet
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Connect a sending domain to deliver emails automatically. Until then, Send saves
                    the draft and opens your own mail app.
                  </p>
                </div>
              )}
              <DeliverabilityNotice usage={usage} />
              <div>
                <Label className="text-xs text-muted-foreground">Body</Label>
                <Textarea
                  rows={10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function GoalChip({
  goal,
  active,
  onPick,
}: {
  goal: string;
  active: boolean;
  onPick: (g: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(goal)}
      className={cn(
        "rounded-full border px-2.5 py-1 text-left text-[11px] leading-tight transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {goal}
    </button>
  );
}
