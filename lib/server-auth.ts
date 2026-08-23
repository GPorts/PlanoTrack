import { createAdminSupabaseClient } from "./supabase";
import { trialDaysRemaining, trialPeriodEnd, type AppAccess } from "./access";

const trialProvider = "planotracker";
const trialPlanCode = "trial_7_days";

type TrialRow = {
  id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  raw_payload: Record<string, unknown> | null;
};

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

export async function ensureFreeTrial(userId: string, email?: string | null) {
  const supabase = createAdminSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado.");

  const providerSubscriptionId = `trial:${userId}`;
  const { data: existing, error: selectError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("provider_subscription_id", providerSubscriptionId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      customer_email: email || null,
      provider: trialProvider,
      provider_subscription_id: providerSubscriptionId,
      plan_code: trialPlanCode,
      billing_cycle: "monthly",
      status: "trial_pending",
      raw_payload: { generation_used: false }
    })
    .select("id")
    .single();

  if (!error && data) return data.id as string;

  // A second simultaneous access may have created the same trial first.
  const { data: concurrent, error: concurrentError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("provider_subscription_id", providerSubscriptionId)
    .single();

  if (concurrentError || !concurrent) throw error || concurrentError;
  return concurrent.id as string;
}

export async function getUserAccess(userId: string, email?: string | null): Promise<AppAccess> {
  if (await userHasActiveSubscription(userId)) {
    return { active: true, accessType: "paid", trial: null };
  }

  await ensureFreeTrial(userId, email);
  const trial = await getTrialRow(userId);
  if (!trial) return { active: false, accessType: "none", trial: null };

  const generationAvailable = trial.raw_payload?.generation_used !== true;
  if (trial.status === "trial_pending") {
    return {
      active: true,
      accessType: "trial",
      trial: {
        status: "pending",
        startsAt: null,
        endsAt: null,
        daysRemaining: null,
        generationAvailable
      }
    };
  }

  const endsAt = trial.current_period_end;
  const expired = !endsAt || new Date(endsAt).getTime() <= Date.now() || trial.status === "trial_expired";

  return {
    active: !expired,
    accessType: expired ? "none" : "trial",
    trial: {
      status: expired ? "expired" : "active",
      startsAt: trial.current_period_start,
      endsAt,
      daysRemaining: endsAt ? trialDaysRemaining(endsAt) : 0,
      generationAvailable
    }
  };
}

export async function claimPlanGeneration(userId: string, email?: string | null) {
  const paid = await userHasActiveSubscription(userId);
  if (paid) {
    return {
      allowed: true as const,
      claimedTrialId: null,
      access: { active: true, accessType: "paid", trial: null } satisfies AppAccess
    };
  }

  await ensureFreeTrial(userId, email);
  const currentAccess = await getUserAccess(userId, email);
  const trial = await getTrialRow(userId);

  if (!trial || currentAccess.trial?.status === "expired") {
    return { allowed: false as const, reason: "Seu teste gratuito terminou. Assine um plano para continuar gerando planos com IA." };
  }

  if (trial.status !== "trial_pending" || !currentAccess.trial?.generationAvailable) {
    return { allowed: false as const, reason: "O teste gratuito inclui uma geração completa com IA. Assine para criar planos ilimitados." };
  }

  const startedAt = new Date();
  const endsAt = trialPeriodEnd(startedAt);
  const { data, error } = await createAdminSupabaseClient()!
    .from("subscriptions")
    .update({
      status: "trial_active",
      current_period_start: startedAt.toISOString(),
      current_period_end: endsAt.toISOString(),
      raw_payload: { generation_used: true },
      updated_at: startedAt.toISOString()
    })
    .eq("id", trial.id)
    .eq("status", "trial_pending")
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return { allowed: false as const, reason: "Esta geração já foi iniciada. Aguarde alguns instantes antes de tentar novamente." };
  }

  return {
    allowed: true as const,
    claimedTrialId: trial.id,
    access: {
      active: true,
      accessType: "trial",
      trial: {
        status: "active",
        startsAt: startedAt.toISOString(),
        endsAt: endsAt.toISOString(),
        daysRemaining: 7,
        generationAvailable: false
      }
    } satisfies AppAccess
  };
}

export async function releaseTrialGeneration(trialId: string) {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return;

  await supabase
    .from("subscriptions")
    .update({
      status: "trial_pending",
      current_period_start: null,
      current_period_end: null,
      raw_payload: { generation_used: false },
      updated_at: new Date().toISOString()
    })
    .eq("id", trialId)
    .eq("provider", trialProvider)
    .eq("status", "trial_active");
}

async function getTrialRow(userId: string): Promise<TrialRow | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id,status,current_period_start,current_period_end,raw_payload")
    .eq("user_id", userId)
    .eq("provider", trialProvider)
    .eq("plan_code", trialPlanCode)
    .maybeSingle();

  if (error) throw error;
  return data as TrialRow | null;
}

