import { createAdminSupabaseClient } from "./supabase";

export async function getUserFromRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const supabase = createAdminSupabaseClient();

  if (!token || !supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return data.user;
}

export async function linkSubscriptionToUser(userId: string, email: string) {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return 0;

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email
  });
  if (profileError) throw profileError;

  const { data, error } = await supabase
    .from("subscriptions")
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .is("user_id", null)
    .ilike("customer_email", email)
    .select("id");

  if (error) throw error;
  return data?.length || 0;
}

export async function userHasActiveSubscription(userId: string) {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id,status,current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "paid", "trialing", "canceled"]);

  if (error) throw error;
  const now = Date.now();
  return Boolean(
    data?.some((subscription) => {
      const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end).getTime() : null;
      if (subscription.status === "canceled") return Boolean(periodEnd && periodEnd > now);
      return periodEnd === null || periodEnd > now;
    })
  );
}

