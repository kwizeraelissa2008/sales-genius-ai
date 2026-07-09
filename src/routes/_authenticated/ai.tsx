import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Bot } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/ai")({
  validateSearch: z.object({ leadId: z.string().optional() }),
  head: () => ({ meta: [{ title: "AI Assistant — SalesGenius AI" }] }),
  component: AIPage,
});

function AIPage() {
  const { user } = Route.useRouteContext();
  return (
    <AppShell title="AI Assistant" userEmail={user.email}>
      <ComingSoon
        icon={Bot}
        title="AI email generation coming next"
        body="Powered by Groq (Llama 3 70B) with heuristic fallback. Wiring up in Step 3."
      />
    </AppShell>
  );
}

function ComingSoon({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border/70 bg-card/40 p-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
