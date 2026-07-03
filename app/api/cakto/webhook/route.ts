import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  billingCycleFromPayload,
  currentPeriodEndFromPayload,
  currentPeriodStartFromPayload,
  customerEmailFromPayload,
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

  try {
    const result = await Promise.all(
      payloadsFromCaktoWebhook(payload).map((item) => {
        const data = getPayloadData(item);

        return upsertSubscription({
          userId: data?.metadata?.user_id,
          email: customerEmailFromPayload(item),
          providerSubscriptionId: subscriptionIdFromPayload(item),
          providerCustomerId: data?.customer_id,
          planCode: planCodeFromPayload(item),
          billingCycle: billingCycleFromPayload(item),
          status: normalizedSubscriptionStatus(item),
          currentPeriodStart: currentPeriodStartFromPayload(item),
          currentPeriodEnd: currentPeriodEndFromPayload(item),
          rawPayload: item
        });
      })
    );

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("Erro ao processar webhook da Cakto", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao processar webhook."
      },
      { status: 500 }
    );
  }
}
