import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const secret = getEnv("CRON_SECRET");
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const resendKey = getEnv("RESEND_API_KEY");
  const from = getEnv("NOTIFICATION_FROM_EMAIL");
  const supabase = createAdminSupabaseClient();
  if (!supabase || !resendKey || !from) return NextResponse.json({ error: "Notificações por e-mail não configuradas." }, { status: 503 });

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const { data: preferences, error } = await supabase.from("notification_preferences").select("user_id").eq("email_enabled", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const userIds = (preferences || []).map((item) => String(item.user_id));
  if (!userIds.length) return NextResponse.json({ sent: 0 });

  const [{ data: profiles }, { data: plans }] = await Promise.all([
    supabase.from("profiles").select("id,email").in("id", userIds),
    supabase.from("study_plans").select("id,user_id,title").in("user_id", userIds)
  ]);
  const planIds = (plans || []).map((plan) => String(plan.id));
  const { data: items } = planIds.length
    ? await supabase.from("schedule_items").select("plan_id,period,subject_name,topic_title,minutes,status").in("plan_id", planIds).eq("date", today).neq("status", "completed")
    : { data: [] };
  const emailByUser = new Map((profiles || []).map((profile) => [String(profile.id), String(profile.email || "")]));
  const userByPlan = new Map((plans || []).map((plan) => [String(plan.id), String(plan.user_id)]));
  const itemsByUser = new Map<string, typeof items>();
  (items || []).forEach((item) => {
    const userId = userByPlan.get(String(item.plan_id));
    if (userId) itemsByUser.set(userId, [...(itemsByUser.get(userId) || []), item]);
  });

  let sent = 0;
  for (const userId of userIds) {
    const email = emailByUser.get(userId);
    const userItems = itemsByUser.get(userId) || [];
    if (!email || !userItems.length) continue;
    const rows = userItems.slice(0, 5).map((item) => `<li><strong>${escapeHtml(item.subject_name)}</strong> · ${escapeHtml(item.period)} · ${item.minutes} min<br>${escapeHtml(item.topic_title)}</li>`).join("");
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [email], subject: "Seu foco de estudo de hoje", html: `<h1>Seu plano de hoje</h1><ul>${rows}</ul><p><a href="${getEnv("NEXT_PUBLIC_APP_URL") || "https://planotracker.vercel.app"}/app">Abrir PlanoTracker</a></p>` }) });
    if (response.ok) sent += 1;
  }
  return NextResponse.json({ sent });
}

function escapeHtml(value: unknown) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}
