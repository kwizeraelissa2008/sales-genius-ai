import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Bot,
  CreditCard,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/ai", label: "AI Assistant", icon: Bot },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({
  children,
  title,
  actions,
  userEmail,
}: {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
  userEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-none border-r border-border/60 bg-sidebar md:flex md:flex-col">
        <SidebarInner />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 border-r border-border/60 bg-sidebar p-0">
          <SidebarInner onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {actions}
            {userEmail && (
              <span className="hidden text-xs text-muted-foreground md:inline">{userEmail}</span>
            )}
            <SignOutButton />
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border/60 px-5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-elegant)]">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold tracking-tight">SalesGenius AI</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/60 p-4 text-xs text-muted-foreground">
        <div className="rounded-lg bg-primary/5 p-3">
          <div className="font-medium text-foreground">Free plan</div>
          <div className="mt-0.5">Upgrade to unlock Groq AI.</div>
          <Button asChild size="sm" className="mt-2 w-full" variant="default">
            <Link to="/billing">Upgrade</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function SignOutButton() {
  const navigate = useNavigate();
  async function onSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/", replace: true });
  }
  return (
    <Button variant="ghost" size="sm" onClick={onSignOut}>
      <LogOut className="mr-2 h-4 w-4" /> Sign out
    </Button>
  );
}
