import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { Bot, Sparkles, Copy, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listLeads } from "@/lib/leads";
import { generateEmail } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/ai")({
  validateSearch: z.object({ leadId: z.string().optional() }),
  head: () => ({ meta: [{ title: "AI Assistant — SalesGenius AI" }] }),
  component: AIPage,
});

function AIPage() {
  const { user } = Route.useRouteContext();
  const { leadId } = Route.useSearch();
  const navigate = useNavigate();
  const generate = useServerFn(generateEmail);

  const { data: leads } = useQuery({ queryKey: ["leads"], queryFn: listLeads });
  const [selectedId, setSelectedId] = useState<string>(leadId ?? "");
  const [goal, setGoal] = useState(
    "book a 15-minute intro call to explore how our AI sales platform can help their pipeline",
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ subject: string; body: string; mode: string } | null>(
    null,
  );

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

  async function onGenerate() {
    if (!lead) {
      toast.error("Pick a lead first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await generate({
        data: {
          leadName: lead.name,
          leadCompany: lead.company,
          leadTitle: lead.job_title,
          leadEmail: lead.email,
          leadScore: lead.lead_score,
          goal,
          senderName: user.email?.split("@")[0] ?? null,
          senderCompany: null,
        },
      });
      setResult(res);
      toast.success(
        res.mode === "groq" ? "Generated with Groq AI" : "Generated with smart fallback",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
    <AppShell title="AI Assistant" userEmail={user.email}>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Generate personalized email</h2>
              <p className="text-xs text-muted-foreground">Powered by Groq · Llama 3.3 70B</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Lead</Label>
              <Select
                value={selectedId}
                onValueChange={(v) => {
                  setSelectedId(v);
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
                  Add a lead first from the Leads page.
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
                {lead.company && (
                  <div className="text-muted-foreground">{lead.company}</div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Goal / context</Label>
              <Textarea
                rows={4}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What do you want from this email?"
              />
            </div>

            <Button
              className="w-full shadow-[var(--shadow-elegant)]"
              onClick={onGenerate}
              disabled={loading || !lead}
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
          {!result && !loading && (
            <div className="grid h-full min-h-[400px] place-items-center text-center">
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Your email will appear here</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Pick a lead, describe your goal, and let AI craft a personalized outreach in
                  seconds.
                </p>
              </div>
            </div>
          )}
          {loading && (
            <div className="grid h-full min-h-[400px] place-items-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Crafting your email...</p>
              </div>
            </div>
          )}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge
                  variant="secondary"
                  className={
                    result.mode === "groq"
                      ? "bg-success/15 text-success"
                      : "bg-warning/15 text-warning"
                  }
                >
                  {result.mode === "groq" ? "Groq AI" : "Smart fallback"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copy(`Subject: ${result.subject}\n\n${result.body}`)}
                >
                  <Copy className="mr-2 h-4 w-4" /> Copy all
                </Button>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <div className="mt-1 rounded-lg border border-border/60 bg-muted/30 p-3 font-medium">
                  {result.subject}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Body</Label>
                <Textarea
                  rows={14}
                  value={result.body}
                  onChange={(e) => setResult({ ...result, body: e.target.value })}
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
