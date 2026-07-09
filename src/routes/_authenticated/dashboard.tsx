import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SalesGenius AI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useRouteContext();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-primary)]">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">SalesGenius AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:inline">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl border border-border/70 bg-card p-10 shadow-[var(--shadow-card)]">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome to SalesGenius AI 👋</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Your workspace is ready. Leads, AI email generation, analytics, and billing are coming online next.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            {["Total Leads", "High Priority", "Avg Score", "Conversion"].map((k) => (
              <div key={k} className="rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="text-xs text-muted-foreground">{k}</div>
                <div className="mt-2 text-2xl font-semibold">—</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
