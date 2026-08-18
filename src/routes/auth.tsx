import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const authSearchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — SalesGenius AI" },
      { name: "description", content: "Sign in or create your SalesGenius AI account." },
      { property: "og:title", content: "Sign in — SalesGenius AI" },
      {
        property: "og:description",
        content: "Sign in or create your SalesGenius AI account.",
      },
    ],
  }),
  component: AuthPage,
});

const GMAIL_RE = /^[^\s@]+@gmail\.com$/i;

/** Password field with a show/hide (view mode) toggle. */
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative mt-1.5">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        required
        {...(minLength ? { minLength } : {})}
        {...(autoComplete ? { autoComplete } : {})}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
        {...(placeholder ? { placeholder } : {})}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(mode ?? "signin");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="relative min-h-screen bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
        <Link
          to="/"
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="mb-6 flex items-center gap-2">
          <img
            src="/app-icon.png"
            alt="SalesGenius AI logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg shadow-[var(--shadow-elegant)]"
          />
          <span className="text-lg font-semibold tracking-tight">SalesGenius AI</span>
        </div>

        <div className="w-full rounded-2xl border border-border/70 bg-card p-8 shadow-[var(--shadow-elegant)]">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6">
              <SignInForm />
              <Divider />
              <GoogleButton label="Continue with Google" />
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <SignUpForm />
              <Divider />
              <GoogleButton label="Sign up with Google" />
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border/70" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-3 text-muted-foreground">or</span>
      </div>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard", replace: true });
  }

  async function onForgot() {
    if (!GMAIL_RE.test(email.trim())) {
      toast.error("Enter your Gmail address above first, then tap “Forgot password”.");
      return;
    }
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Reset link sent — check your Gmail inbox.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="signin-email">Gmail address</Label>
        <Input
          id="signin-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5"
          placeholder="you@gmail.com"
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="signin-password">Password</Label>
          <button
            type="button"
            onClick={onForgot}
            disabled={resetting}
            className="text-xs font-medium text-primary hover:underline disabled:opacity-60"
          >
            {resetting ? "Sending…" : "Forgot password?"}
          </button>
        </div>
        <PasswordInput
          id="signin-password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== password;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!GMAIL_RE.test(email.trim())) {
      toast.error("Please sign up with a Gmail address (…@gmail.com) so password recovery works.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, company_name: companyName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — welcome to SalesGenius!");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="signup-name">Full name</Label>
          <Input
            id="signup-name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1.5"
            placeholder="Alex Rivera"
          />
        </div>
        <div>
          <Label htmlFor="signup-company">Company</Label>
          <Input
            id="signup-company"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1.5"
            placeholder="Acme Inc."
          />
        </div>
      </div>
      <div>
        <Label htmlFor="signup-email">Gmail address</Label>
        <Input
          id="signup-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5"
          placeholder="you@gmail.com"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Gmail only — we send your password reset code there, and your outreach replies come back to
          it.
        </p>
      </div>
      <div>
        <Label htmlFor="signup-password">Password</Label>
        <PasswordInput
          id="signup-password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={6}
          placeholder="At least 6 characters"
        />
      </div>
      <div>
        <Label htmlFor="signup-confirm">Confirm password</Label>
        <PasswordInput
          id="signup-confirm"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          minLength={6}
          placeholder="Re-enter your password"
        />
        {mismatch && <p className="mt-1 text-xs text-destructive">Passwords do not match.</p>}
      </div>
      <Button
        type="submit"
        className="w-full shadow-[var(--shadow-elegant)]"
        disabled={loading || mismatch}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create account
      </Button>
    </form>
  );
}

function GoogleButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  async function onClick() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error(result.error.message ?? "Could not sign in with Google.");
      return;
    }
    if (result.redirected) return;
    window.location.href = "/dashboard";
  }
  return (
    <Button type="button" variant="outline" className="w-full" disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon className="mr-2 h-4 w-4" />
      )}
      {'Check your email to confirm'}
    </Button>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
