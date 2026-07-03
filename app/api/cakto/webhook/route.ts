import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  billingCycleFromPayload,
  getPayloadData,
  normalizedSubscriptionStatus,
  payloadsFromCaktoWebhook,
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

  let payload: CaktoWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  if (!verifyCaktoSignature(rawBody, signature, payload.secret)) {
    return NextResponse.json({ error: "Assinatura invalida." }, { status: 401 });
  }

  const result = await Promise.all(
    payloadsFromCaktoWebhook(payload).map((item) => {
      const data = getPayloadData(item);

      return upsertSubscription({
        userId: data?.metadata?.user_id,
        email: data?.customer?.email,
        providerSubscriptionId: subscriptionIdFromPayload(item),
        providerCustomerId: data?.customer_id,
        planCode: planCodeFromPayload(item),
        billingCycle: billingCycleFromPayload(item),
        status: normalizedSubscriptionStatus(item),
        currentPeriodStart: data?.current_period_start || null,
        currentPeriodEnd: data?.current_period_end || null,
        rawPayload: item
      });
    })
  );

  return NextResponse.json({ ok: true, result });
}
