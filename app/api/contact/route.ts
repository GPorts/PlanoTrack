import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(200).optional()
});

const rateLimitWindow = 10 * 60 * 1000;
const rateLimitMaximum = 5;
const requestsByIp = new Map<string, number[]>();

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Muitas mensagens enviadas. Aguarde alguns minutos e tente novamente." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler a mensagem." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Preencha nome, e-mail válido e uma mensagem com pelo menos 10 caracteres." }, { status: 400 });
  }

  // Bots costumam preencher campos invisíveis. A resposta neutra evita novas tentativas.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const resendKey = getEnv("RESEND_API_KEY");
  const from = getEnv("NOTIFICATION_FROM_EMAIL");
  const destination = getEnv("NOTIFICATION_REPLY_TO_EMAIL") || "contato.planotracker@gmail.com";
  if (!resendKey || !from) {
    return NextResponse.json({ error: "O canal de contato está temporariamente indisponível." }, { status: 503 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [destination],
      reply_to: parsed.data.email,
      subject: `Novo contato pelo site - ${parsed.data.name.replace(/[\r\n]+/g, " ")}`,
      html: contactEmailHtml(parsed.data)
    })
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Não foi possível enviar agora. Tente novamente em alguns instantes." }, { status: 502 });
  }

  registerRequest(ip);
  return NextResponse.json({ ok: true });
}

function isRateLimited(ip: string) {
  const cutoff = Date.now() - rateLimitWindow;
  const recent = (requestsByIp.get(ip) || []).filter((timestamp) => timestamp > cutoff);
  requestsByIp.set(ip, recent);
  return recent.length >= rateLimitMaximum;
}

function registerRequest(ip: string) {
  requestsByIp.set(ip, [...(requestsByIp.get(ip) || []), Date.now()]);
}

function contactEmailHtml(data: { name: string; email: string; message: string }) {
  return `
    <div style="font-family:Arial,sans-serif;color:#0b1f3a;line-height:1.6;max-width:640px">
      <h1 style="font-size:24px">Novo contato pelo PlanoTracker</h1>
      <p><strong>Nome:</strong> ${escapeHtml(data.name)}</p>
      <p><strong>E-mail:</strong> ${escapeHtml(data.email)}</p>
      <p><strong>Mensagem:</strong></p>
      <div style="white-space:pre-wrap;border-left:4px solid #087c68;padding:12px 16px;background:#f3f6f1">${escapeHtml(data.message)}</div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character] || character);
}
