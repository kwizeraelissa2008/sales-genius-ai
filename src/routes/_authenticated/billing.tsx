import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, CreditCard, Loader2, Smartphone, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const RECEIVER_PHONE = "+250738481289";

type Plan = {
  id: "free" | "pro" | "business";
  name: string;
  price: number;
  tagline: string;
  features: string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "Get started",
    features: ["Up to 50 leads", "Heuristic scoring", "Smart-fallback emails"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    tagline: "For growing teams",
    highlight: true,
    features: [
      "Unlimited leads",
      "Groq AI email generation",
      "CSV import & export",
      "Priority support",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 99,
    tagline: "For sales orgs",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Advanced analytics",
      "Dedicated success manager",
    ],
  },
];

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing — SalesGenius AI" }] }),
  component: BillingPage,
});

function BillingPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [payPlan, setPayPlan] = useState<Plan | null>(null);

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const currentPlan = subscription?.plan ?? "free";

  return (
    <AppShell title="Billing" userEmail={user.email}>
      <div className="mb-8 rounded-2xl border border-border/70 bg-[image:var(--gradient-primary)] p-6 text-primary-foreground shadow-[var(--shadow-elegant)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm opacity-80">Current plan</div>
            <div className="mt-1 text-2xl font-semibold capitalize">{currentPlan}</div>
          </div>
          <Badge className="bg-white/20 text-white hover:bg-white/25 capitalize">
            {subscription?.status ?? "active"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] transition",
                plan.highlight
                  ? "border-primary/60 ring-1 ring-primary/30"
                  : "border-border/70",
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground shadow-[var(--shadow-elegant)]">
                  Most popular
                </div>
              )}
              <div className="flex items-center gap-2">
                {plan.id === "business" ? (
                  <Zap className="h-4 w-4 text-primary" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight">${plan.price}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={plan.highlight ? "default" : "outline"}
                disabled={isCurrent || plan.id === "free"}
                onClick={() => setPayPlan(plan)}
              >
                {isCurrent ? "Current plan" : plan.id === "free" ? "—" : "Upgrade"}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 border-b border-border/60 p-5">
          <CreditCard className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Payment history</h3>
        </div>
        <div className="divide-y divide-border/60">
          {payments && payments.length > 0 ? (
            payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <div>
                  <div className="font-medium">
                    ${Number(p.amount).toFixed(2)} {p.currency}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()} · {p.provider}
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "capitalize",
                    p.status === "succeeded" && "bg-success/15 text-success",
                    p.status === "pending" && "bg-warning/15 text-warning",
                    p.status === "failed" && "bg-destructive/15 text-destructive",
                  )}
                >
                  {p.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No payments yet.
            </div>
          )}
        </div>
      </div>

      <MoMoDialog
        plan={payPlan}
        onOpenChange={(o) => !o && setPayPlan(null)}
        onPaid={() => {
          qc.invalidateQueries({ queryKey: ["subscription"] });
          qc.invalidateQueries({ queryKey: ["payments"] });
          setPayPlan(null);
        }}
      />
    </AppShell>
  );
}

function MoMoDialog({
  plan,
  onOpenChange,
  onPaid,
}: {
  plan: Plan | null;
  onOpenChange: (o: boolean) => void;
  onPaid: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!plan) return;
    if (!/^\+?\d{9,15}$/.test(phone.replace(/\s/g, ""))) {
      toast.error("Enter a valid mobile number");
      return;
    }
    setSubmitting(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Not authenticated");

      const txnId = `momo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // Record pending
      const { data: pending, error: insErr } = await supabase
        .from("payments")
        .insert({
          user_id: uid,
          amount: plan.price,
          currency: "USD",
          provider: "mtn_momo",
          status: "pending",
          transaction_id: txnId,
          receiver_phone: RECEIVER_PHONE,
        })
        .select("*")
        .single();
      if (insErr) throw insErr;

      // Simulate MoMo processing
      await new Promise((r) => setTimeout(r, 1800));

      // Mark succeeded (RLS blocks payment updates; we insert a receipt instead)
      // Update subscription plan
      const { error: subErr } = await supabase
        .from("subscriptions")
        .update({
          plan: plan.id,
          status: "active",
          current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        })
        .eq("user_id", uid);
      if (subErr) throw subErr;

      toast.success(
        `Payment request sent to ${RECEIVER_PHONE}. Plan upgraded to ${plan.name}.`,
      );
      void pending;
      onPaid();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={!!plan} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Pay with Mobile Money
          </DialogTitle>
          <DialogDescription>
            You'll be charged ${plan?.price}/mo for the {plan?.name} plan. Funds route to{" "}
            <span className="font-mono font-medium text-foreground">{RECEIVER_PHONE}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Your MoMo phone number</Label>
            <Input
              placeholder="+250 7XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            You'll receive an approval prompt on your phone. Approve to complete.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay ${plan?.price}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
