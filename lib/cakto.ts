import crypto from "node:crypto";
import { getEnv } from "./env";

export type CaktoWebhookPayload = {
  secret?: string;
  event?: string;
  type?: string;
  data?: CaktoWebhookData | CaktoWebhookData[];
  [key: string]: unknown;
};

export type CaktoWebhookData = {
  id?: string;
  refId?: string;
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
  offer?: {
    id?: string;
    name?: string;
  };
  paidAt?: string;
  createdAt?: string;
  subscription?: {
    id?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    canceledAt?: string | null;
    next_payment_date?: string;
    recurrence_period?: number;
    customer?: {
      email?: string;
      name?: string;
    };
  };
};

export function getCheckoutUrl(userId?: string) {
  const baseUrl = getEnv("CAKTO_CHECKOUT_URL");
  if (!baseUrl) return "/checkout";

  const url = new URL(baseUrl);
  if (userId) url.searchParams.set("user_id", userId);
  url.searchParams.set("source", "planotracker");
  return url.toString();
}

export function billingCycleFromPayload(payload: CaktoWebhookPayload) {
  const data = getPayloadData(payload);
  const metadataCycle = data?.metadata?.billing_cycle;
  const productText = `${data?.product?.name || ""} ${data?.offer?.name || ""} ${data?.metadata?.plan || ""}`.toLowerCase();

  if (metadataCycle === "annual" || productText.includes("anual")) return "annual";
  if (metadataCycle === "quarterly" || productText.includes("trimestral")) return "quarterly";
  return "monthly";
}

export function planCodeFromPayload(payload: CaktoWebhookPayload) {
  const data = getPayloadData(payload);
  return data?.metadata?.plan_code || data?.metadata?.plan || billingCycleFromPayload(payload);
}

export function subscriptionIdFromPayload(payload: CaktoWebhookPayload) {
  const data = getPayloadData(payload);
  return data?.subscription_id || data?.subscription?.id || data?.id || data?.refId;
}

export function normalizedSubscriptionStatus(payload: CaktoWebhookPayload) {
  const event = String(payload.event || payload.type || "").toLowerCase();
  const data = getPayloadData(payload);
  const status = String(data?.subscription?.status || data?.status || "").toLowerCase();

  if (event.includes("cancel") || status.includes("cancel")) return "canceled";
  if (event.includes("refund") || status.includes("refund")) return "refunded";
  if (event.includes("refused") || status.includes("refused")) return "refused";
  if (event.includes("approved") || event.includes("renewed") || status === "paid" || status === "approved") return "active";
  return status || "pending";
}

export function customerEmailFromPayload(payload: CaktoWebhookPayload) {
  const data = getPayloadData(payload);
  return data?.customer?.email || data?.subscription?.customer?.email;
}

export function currentPeriodStartFromPayload(payload: CaktoWebhookPayload) {
  const data = getPayloadData(payload);
  return data?.current_period_start || data?.subscription?.createdAt || data?.paidAt || data?.createdAt || null;
}

export function currentPeriodEndFromPayload(payload: CaktoWebhookPayload) {
  const data = getPayloadData(payload);
  return data?.current_period_end || data?.subscription?.next_payment_date || null;
}

export function payloadsFromCaktoWebhook(payload: CaktoWebhookPayload) {
  if (Array.isArray(payload.data)) {
    return payload.data.map((item) => ({ ...payload, data: item }));
  }

  return [payload];
}

export function verifyCaktoSignature(rawBody: string, signature: string | null, payloadSecret?: string) {
  const secret = getEnv("CAKTO_WEBHOOK_SECRET");
  if (!secret) return true;

  if (payloadSecret && safeCompare(secret, payloadSecret)) return true;

  if (!signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeCompare(expected, signature);
}

export function getPayloadData(payload: CaktoWebhookPayload) {
  return Array.isArray(payload.data) ? payload.data[0] : payload.data;
}

function safeCompare(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

