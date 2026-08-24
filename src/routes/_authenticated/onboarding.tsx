import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Building2, Package, Target, Check, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
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
import {
  getCompanyProfile,
  upsertCompanyProfile,
  INDUSTRIES,
  PRICE_RANGES,
  COMPANY_SIZES,
  TARGET_TITLES,
  REGIONS,
} from "@/lib/company";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — SalesGenius AI" }] }),
  component: OnboardingPage,
});

type FormState = {
  company_name: string;
  industry: string;
  website: string;
  description: string;
  product_name: string;
  product_description: string;
  key_features: string[];
  price_range: string;
  value_proposition: string;
  target_industries: string[];
  company_sizes: string[];
  target_titles: string[];
  pain_points: string;
  regions: string[];
};

const EMPTY: FormState = {
  company_name: "",
  industry: "",
  website: "",
  description: "",
  product_name: "",
  product_description: "",
  key_features: [],
  price_range: "",
  value_proposition: "",
  target_industries: [],
  company_sizes: [],
  target_titles: [],
  pain_points: "",
  regions: [],
};

function OnboardingPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: existing } = useQuery({ queryKey: ["company_profile"], queryFn: getCompanyProfile });

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [featureInput, setFeatureInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        company_name: existing.company_name ?? "",
        industry: existing.industry ?? "",
        website: "",
        description: "",
        product_name: existing.product_name ?? "",
        product_description: existing.product_description ?? "",
        key_features: existing.key_features ?? [],
        price_range: "",
        value_proposition: existing.value_proposition ?? "",
        target_industries: existing.industry ? [existing.industry] : [],
        company_sizes: existing.company_size ? existing.company_size.split(", ") : [],
        target_titles: existing.target_titles ?? [],
        pain_points: existing.pain_points ?? "",
        regions: existing.target_regions ?? [],
      });
    }
  }, [existing]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggle(k: keyof FormState, value: string) {
    setForm((f) => {
      const arr = (f[k] as string[]) ?? [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...f, [k]: next };
    });
  }

  function addFeature() {
    const v = featureInput.trim();
    if (!v || form.key_features.length >= 10) return;
    setForm((f) => ({ ...f, key_features: [...f.key_features, v] }));
    setFeatureInput("");
  }

  async function save(markOnboarded: boolean) {
    if (!form.company_name.trim()) {
      toast.error("Company name is required");
      setStep(1);
      return;
    }
    setSaving(true);
    try {
      await upsertCompanyProfile({
        company_name: form.company_name.trim(),
        industry: form.industry || form.target_industries[0] || null,
        company_size: form.company_sizes.join(", ") || null,
        product_name: form.product_name.trim() || null,
        product_description: [form.product_description.trim(), form.description.trim() && `Company context: ${form.description.trim()}`, form.website.trim() && `Website: ${form.website.trim()}`].filter(Boolean).join("\n\n") || null,
        key_features: form.key_features,
        value_proposition: [form.value_proposition.trim(), form.price_range && `Typical price range: ${form.price_range}`].filter(Boolean).join("\n") || null,
        pain_points: form.pain_points.trim() || null,
        target_titles: form.target_titles,
        target_regions: form.regions,
        onboarded: markOnboarded,
      });
      await qc.invalidateQueries({ queryKey: ["company_profile"] });
      if (markOnboarded) {
        toast.success("Your AI is ready! Let's add your first leads.");
        navigate({ to: "/leads" });
      } else {
        toast.success("Saved");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const canNext =
    step === 1
      ? form.company_name.trim().length > 0
      : step === 2
        ? form.product_name.trim().length > 0 && form.product_description.trim().length >= 20
        : true;

  return (
    <AppShell title="Onboarding" userEmail={user.email}>
      <div className="mx-auto max-w-3xl">
        <Stepper step={step} />

        <div className="mt-8 rounded-2xl border border-border/70 bg-card p-8 shadow-[var(--shadow-card)]">
          {step === 1 && (
            <div className="space-y-5">
              <Header
                icon={Building2}
                title="Tell us about your company"
                subtitle="This helps our AI understand who you are and personalize every email."
              />
              <Field label="Company name *">
                <Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Acme Inc." />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Industry">
                  <Select value={form.industry} onValueChange={(v) => set("industry", v)}>
                    <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Website">
                  <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://acme.com" />
                </Field>
              </div>
              <Field label="Company description">
                <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What does your company do?" />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <Header
                icon={Package}
                title="What do you sell?"
                subtitle="Describe your product so AI can pitch it in your emails."
              />
              <Field label="Product / service name *">
                <Input value={form.product_name} onChange={(e) => set("product_name", e.target.value)} placeholder="SalesGenius Pro" />
              </Field>
              <Field label="Detailed description *" hint="At least 20 characters. Rich detail = better emails.">
                <Textarea rows={5} value={form.product_description} onChange={(e) => set("product_description", e.target.value)} />
              </Field>
              <Field label="Key features" hint={`${form.key_features.length}/10`}>
                <div className="flex gap-2">
                  <Input
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    placeholder="Add a feature and press Enter"
                    disabled={form.key_features.length >= 10}
                  />
                  <Button type="button" variant="outline" onClick={addFeature} disabled={form.key_features.length >= 10}>Add</Button>
                </div>
                {form.key_features.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.key_features.map((f) => (
                      <Badge key={f} variant="secondary" className="cursor-pointer" onClick={() => set("key_features", form.key_features.filter((x) => x !== f))}>
                        {f} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Price range">
                  <Select value={form.price_range} onValueChange={(v) => set("price_range", v)}>
                    <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                    <SelectContent>
                      {PRICE_RANGES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Unique value proposition">
                <Textarea rows={3} value={form.value_proposition} onChange={(e) => set("value_proposition", e.target.value)} placeholder="What makes you different?" />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <Header
                icon={Target}
                title="Who is your ideal customer?"
                subtitle="AI uses this to score every lead and tailor every message."
              />
              <ChipGroup label="Target industries" options={INDUSTRIES} selected={form.target_industries} onToggle={(v) => toggle("target_industries", v)} />
              <ChipGroup label="Company size" options={COMPANY_SIZES} selected={form.company_sizes} onToggle={(v) => toggle("company_sizes", v)} />
              <ChipGroup label="Target job titles" options={TARGET_TITLES} selected={form.target_titles} onToggle={(v) => toggle("target_titles", v)} />
              <Field label="Pain points you solve" hint="List 3–5 problems your product solves.">
                <Textarea rows={4} value={form.pain_points} onChange={(e) => set("pain_points", e.target.value)} />
              </Field>
              <ChipGroup label="Geographic focus" options={REGIONS} selected={form.regions} onToggle={(v) => toggle("regions", v)} />
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
            <Button variant="ghost" onClick={() => (step > 1 ? setStep(step - 1) : navigate({ to: "/dashboard" }))} disabled={saving}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {step > 1 ? "Back" : "Skip for now"}
            </Button>
            {step < 3 ? (
              <Button onClick={() => canNext ? setStep(step + 1) : toast.error("Fill required fields")}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => save(true)} disabled={saving} className="shadow-[var(--shadow-elegant)]">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Finish setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Company", "Product", "Ideal customer"];
  return (
    <div className="flex items-center justify-center gap-2">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={l} className="flex items-center gap-2">
            <div className={cn(
              "grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-colors",
              done ? "bg-success text-success-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}>
              {done ? <Check className="h-4 w-4" /> : n}
            </div>
            <span className={cn("text-sm font-medium", active ? "text-foreground" : "text-muted-foreground")}>{l}</span>
            {i < labels.length - 1 && <div className="mx-2 h-px w-8 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

function Header({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="mb-2 flex items-start gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ChipGroup({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
