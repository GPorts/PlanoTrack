import crypto from "node:crypto";
import { getEnv } from "./env";

export type CaktoWebhookPayload = {
  event?: string;
  type?: string;
  data?: {
    id?: string;
    status?: string;
    subscription_id?: string;
    customer_id?: string;
    current_period_start?: string;
    current_period_end?: string;
    customer?: {
      email?: string;
      name?: string;
    };
    metadata?: Record<string, string>;
    product?: {
      id?: string;
      name?: string;
    };
  };
  [key: string]: unknown;
};

export function getCheckoutUrl(userId?: string) {
  const baseUrl = getEnv("CAKTO_CHECKOUT_URL");
  if (!baseUrl) return "/checkout";

  const url = new URL(baseUrl);
  if (userId) url.searchParams.set("user_id", userId);
  url.searchParams.set("source", "planotrack");
  return url.toString();
}

export function billingCycleFromPayload(payload: CaktoWebhookPayload) {
  const metadataCycle = payload.data?.metadata?.billing_cycle;
  const productText = `${payload.data?.product?.name || ""} ${payload.data?.metadata?.plan || ""}`.toLowerCase();

  if (metadataCycle === "annual" || productText.includes("anual")) return "annual";
  if (metadataCycle === "quarterly" || productText.includes("trimestral")) return "quarterly";
  return "monthly";
}

export function planCodeFromPayload(payload: CaktoWebhookPayload) {
  return payload.data?.metadata?.plan_code || payload.data?.metadata?.plan || billingCycleFromPayload(payload);
}

export function subscriptionIdFromPayload(payload: CaktoWebhookPayload) {
  return payload.data?.subscription_id || payload.data?.id;
}

export function normalizedSubscriptionStatus(payload: CaktoWebhookPayload) {
  const event = String(payload.event || payload.type || "").toLowerCase();
  const status = String(payload.data?.status || "").toLowerCase();

  if (event.includes("cancel") || status.includes("cancel")) return "canceled";
  if (event.includes("refund") || status.includes("refund")) return "refunded";
  if (event.includes("refused") || status.includes("refused")) return "refused";
  if (event.includes("approved") || event.includes("renewed") || status === "paid" || status === "approved") return "active";
  return status || "pending";
}

export function verifyCaktoSignature(rawBody: string, signature: string | null) {
  const secret = getEnv("CAKTO_WEBHOOK_SECRET");
  if (!secret) return true;
  if (!signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
