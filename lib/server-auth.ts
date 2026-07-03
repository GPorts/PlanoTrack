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

  await supabase.from("profiles").upsert({
    id: userId,
    email
  });

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
    .select("id")
    .eq("user_id", userId)
    .in("status", ["active", "paid", "trialing"])
    .or(`current_period_end.is.null,current_period_end.gt.${new Date().toISOString()}`)
    .limit(1);

  if (error) throw error;
  return Boolean(data?.length);
}

