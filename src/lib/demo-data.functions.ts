import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEMO_LEADS } from "@/lib/demo-leads";

export const seedDemoLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ inserted: number }> => {
    const { count } = await context.supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("is_demo", true);
    if ((count ?? 0) > 0) return { inserted: 0 };

    const rows = DEMO_LEADS.map((l) => ({
      ...l,
      user_id: context.userId,
      is_demo: true,
    }));
    const { error } = await context.supabase.from("leads").insert(rows);
    if (error) throw new Error(error.message);
    return { inserted: rows.length };
  });

export const clearDemoLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase
      .from("leads")
      .delete()
      .eq("user_id", context.userId)
      .eq("is_demo", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
