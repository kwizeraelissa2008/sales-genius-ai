import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — SalesGenius AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  return (
    <AppShell title="Settings" userEmail={user.email}>
      <div className="rounded-2xl border border-border/70 bg-card p-8 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Account settings</h2>
            <p className="text-sm text-muted-foreground">Full profile editor coming soon.</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
          <div className="rounded-lg border border-border/60 p-4">
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="mt-1 font-medium">{user.email}</dd>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <dt className="text-xs text-muted-foreground">User ID</dt>
            <dd className="mt-1 truncate font-mono text-xs">{user.id}</dd>
          </div>
        </dl>
      </div>
    </AppShell>
  );
}
