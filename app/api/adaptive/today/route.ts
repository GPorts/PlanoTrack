import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/server-auth";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  const supabase = createAdminSupabaseClient();
  if (!user || !supabase) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  const planId = new URL(request.url).searchParams.get("planId");
  if (!planId) return NextResponse.json({ error: "Informe o plano." }, { status: 400 });
  const { data: plan } = await supabase.from("study_plans").select("id").eq("id", planId).eq("user_id", user.id).maybeSingle();
  if (!plan) return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const { data, error } = await supabase.from("schedule_items").select("*").eq("plan_id", planId).lte("date", today).neq("status", "completed").order("date");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}
