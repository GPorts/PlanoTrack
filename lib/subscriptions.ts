import { createAdminSupabaseClient } from "./supabase";

export type BillingCycle = "monthly" | "quarterly" | "annual";

export async function upsertSubscription(params: {
  userId?: string;
  email?: string;
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  planCode: string;
  billingCycle: BillingCycle;
  status: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  rawPayload: unknown;
}) {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return {
      ok: true,
      mode: "mock",
      message: "Supabase nao configurado. Assinatura aceita apenas em modo demonstracao."
    };
  }

  const payload = {
    user_id: params.userId || null,
    customer_email: params.email || null,
    provider: "cakto",
    provider_subscription_id: params.providerSubscriptionId || null,
    provider_customer_id: params.providerCustomerId || null,
    plan_code: params.planCode,
    billing_cycle: params.billingCycle,
    status: params.status,
    current_period_start: params.currentPeriodStart || null,
    current_period_end: params.currentPeriodEnd || null,
    raw_payload: params.rawPayload,
    updated_at: new Date().toISOString()
  };

  if (params.providerSubscriptionId) {
    const { data: existing, error: selectError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("provider_subscription_id", params.providerSubscriptionId)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing?.id) {
      const { error } = await supabase.from("subscriptions").update(payload).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("subscriptions").insert(payload);
      if (error) throw error;
    }
  } else {
    const { error } = await supabase.from("subscriptions").insert(payload);
    if (error) throw error;
  }

  return {
    ok: true,
    mode: "supabase"
  };
}
