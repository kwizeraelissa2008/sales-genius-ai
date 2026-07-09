import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing — SalesGenius AI" }] }),
  component: BillingPage,
});

function BillingPage() {
  const { user } = Route.useRouteContext();
  return (
    <AppShell title="Billing" userEmail={user.email}>
      <div className="grid place-items-center rounded-2xl border border-dashed border-border/70 bg-card/40 p-16 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <CreditCard className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">Payments coming in Step 4</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Stripe + Mobile Money checkout, plan management, and payment history. Payouts route to +250738481289.
        </p>
      </div>
    </AppShell>
  );
}
