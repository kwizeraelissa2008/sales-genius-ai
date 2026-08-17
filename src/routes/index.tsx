import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Target,
  Mail,
  BarChart3,
  Check,
  ArrowRight,
  Zap,
  ShieldCheck,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-elegant)]">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">SalesGenius AI</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="shadow-[var(--shadow-elegant)]">
            <Link to="/auth" search={{ mode: "signup" as const }}>
              Get started <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5 rounded-full border border-border/60 bg-card/60 py-1 pl-2 pr-3 text-xs backdrop-blur">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-primary/15 text-primary">
              <Zap className="h-2.5 w-2.5" />
            </span>
            AI-powered sales intelligence
          </Badge>
          <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl">
            Close <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">3x more deals</span> with AI
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Score every lead in seconds, generate personalized outreach that actually converts, and let your pipeline run itself.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-7 text-base shadow-[var(--shadow-elegant)]">
              <Link to="/auth" search={{ mode: "signup" as const }}>
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-7 text-base">
              <a href="#features">See how it works</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required · Free forever plan</p>
        </div>

        {/* Preview card */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="relative rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-elegant)]">
            <div className="flex items-center gap-1.5 border-b border-border/70 px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <div className="ml-3 text-xs text-muted-foreground">salesgenius.ai / dashboard</div>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4">
              {[
                { label: "Total Leads", value: "1,284", trend: "+12%" },
                { label: "High Priority", value: "94", trend: "+8%" },
                { label: "Avg Score", value: "72", trend: "+4pt" },
                { label: "Conversion", value: "23.4%", trend: "+3.1%" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-2xl font-semibold">{m.value}</div>
                    <div className="text-xs font-medium text-success">{m.trend}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: Brain,
    title: "AI lead scoring",
    desc: "Every lead gets a 0-100 score with a reasoned strategy — powered by Llama 3 on Groq for millisecond latency.",
  },
  {
    icon: Mail,
    title: "Personalized emails",
    desc: "Generate outreach that references role, company, and context. Send in one click.",
  },
  {
    icon: BarChart3,
    title: "Pipeline analytics",
    desc: "See conversion, velocity, and lead health in one live dashboard.",
  },
  {
    icon: Target,
    title: "Smart segmentation",
    desc: "Filter, sort, and act on leads by score, status, or intent signals.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-grade security",
    desc: "Row-level isolation, encrypted secrets, and audit trails on every action.",
  },
  {
    icon: Zap,
    title: "Global payments",
    desc: "Accept cards worldwide and Mobile Money across Africa in one flow.",
  },
];

function Features() {
  return (
    <section id="features" className="border-t border-border/60 bg-card/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-sm font-medium text-primary">Everything you need</div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            The AI sales stack, unified
          </h2>
          <p className="mt-4 text-muted-foreground">
            Stop stitching tools together. SalesGenius handles scoring, outreach, and revenue in one place.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border/70 bg-card p-6 transition-all hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "For solo founders getting started.",
    features: ["50 leads / month", "AI scoring (mock fallback)", "1 email template", "Basic analytics"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    desc: "For sales teams closing real deals.",
    features: [
      "Unlimited leads",
      "Groq AI email generation",
      "CSV import + export",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start Pro",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$199",
    period: "/month",
    desc: "For revenue orgs scaling fast.",
    features: [
      "Everything in Pro",
      "Team seats & roles",
      "Custom AI strategies",
      "API access",
      "Dedicated success manager",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-sm font-medium text-primary">Pricing</div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade when you're ready. Cancel anytime.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={
                "relative flex flex-col rounded-2xl border p-8 " +
                (p.highlighted
                  ? "border-primary/50 bg-card shadow-[var(--shadow-elegant)] ring-1 ring-primary/30"
                  : "border-border/70 bg-card")
              }
            >
              {p.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[image:var(--gradient-primary)] text-primary-foreground">
                  Most popular
                </Badge>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={p.highlighted ? "default" : "outline"}
                className={"mt-8 " + (p.highlighted ? "shadow-[var(--shadow-elegant)]" : "")}
              >
                <Link to="/auth" search={{ mode: "signup" as const }}>{p.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="border-t border-border/60 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-12 text-center shadow-[var(--shadow-elegant)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: "var(--gradient-hero)" }}
          />
          <div className="relative">
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Ready to close 3x more?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join thousands of sales professionals using AI to hit quota faster.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-7 text-base shadow-[var(--shadow-elegant)]">
                <Link to="/auth" search={{ mode: "signup" as const }}>
                  Start free — no card required <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-[image:var(--gradient-primary)]">
            <Sparkles className="h-3 w-3 text-primary-foreground" />
          </div>
          <span>© {new Date().getFullYear()} SalesGenius AI</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
