import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { auth } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { user } = await auth.me();
      return { user: { id: user.id, email: user.email, user_metadata: { full_name: user.fullName } } };
    } catch {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
