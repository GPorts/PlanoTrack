import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  billingCycleFromPayload,
  normalizedSubscriptionStatus,
  planCodeFromPayload,
  subscriptionIdFromPayload,
  verifyCaktoSignature,
  type CaktoWebhookPayload
} from "@/lib/cakto";
import { upsertSubscription } from "@/lib/subscriptions";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const headerStore = await headers();
  const signature =
    headerStore.get("x-cakto-signature") ||
    headerStore.get("x-webhook-signature") ||
    headerStore.get("x-signature");

  if (!verifyCaktoSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Assinatura invalida." }, { status: 401 });
  }

  let payload: CaktoWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const result = await upsertSubscription({
    userId: payload.data?.metadata?.user_id,
    email: payload.data?.customer?.email,
    providerSubscriptionId: subscriptionIdFromPayload(payload),
    providerCustomerId: payload.data?.customer_id,
    planCode: planCodeFromPayload(payload),
    billingCycle: billingCycleFromPayload(payload),
    status: normalizedSubscriptionStatus(payload),
    currentPeriodStart: payload.data?.current_period_start || null,
    currentPeriodEnd: payload.data?.current_period_end || null,
    rawPayload: payload
  });

  return NextResponse.json({ ok: true, result });
}
