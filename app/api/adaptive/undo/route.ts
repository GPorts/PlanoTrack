import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/server-auth";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type { ScheduleItem } from "@/lib/types";

const schema = z.object({ planId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const supabase = createAdminSupabaseClient();
    if (!user || !supabase) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });

    const { data: plan } = await supabase.from("study_plans").select("id").eq("id", parsed.data.planId).eq("user_id", user.id).maybeSingle();
    if (!plan) return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });

    const { data: adjustment, error: adjustmentError } = await supabase
      .from("plan_adjustments")
      .select("id,before_schedule")
      .eq("plan_id", plan.id)
      .eq("applied", true)
      .is("reverted_at", null)
      .order("applied_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (adjustmentError) throw adjustmentError;
    if (!adjustment) return NextResponse.json({ error: "Não há reorganização para desfazer." }, { status: 404 });

    const before = Array.isArray(adjustment.before_schedule) ? adjustment.before_schedule as ScheduleItem[] : [];
    const { data: currentRows, error: currentError } = await supabase.from("schedule_items").select("id,status").eq("plan_id", plan.id);
    if (currentError) throw currentError;
    const currentStatus = new Map((currentRows || []).map((item) => [String(item.id), String(item.status)]));

    for (const item of before) {
      if (!item.id || currentStatus.get(item.id) === "completed") continue;
      const { error } = await supabase.from("schedule_items").update({
        date: item.date,
        period: item.period,
        status: item.status || "planned",
        completion_percent: item.completionPercent || 0
      }).eq("id", item.id).eq("plan_id", plan.id);
      if (error) throw error;
    }

    await supabase.from("plan_adjustments").update({ reverted_at: new Date().toISOString() }).eq("id", adjustment.id);
    await supabase.from("study_events").insert({ user_id: user.id, plan_id: plan.id, event_name: "plan_rebalance_undone", metadata: { adjustmentId: adjustment.id } });

    const { data: rows, error: rowsError } = await supabase.from("schedule_items").select("*").eq("plan_id", plan.id).order("date");
    if (rowsError) throw rowsError;
    const schedule: ScheduleItem[] = (rows || []).map((item) => ({
      id: item.id,
      topicId: item.topic_id || undefined,
      date: item.date,
      weekday: weekdayFromIso(item.date),
      period: item.period,
      kind: item.kind,
      minutes: item.minutes,
      subject: item.subject_name,
      topic: item.topic_title,
      status: item.status,
      completionPercent: item.completion_percent,
      completedAt: item.completed_at || undefined
    }));
    return NextResponse.json({ schedule });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível desfazer a reorganização." }, { status: 500 });
  }
}

function weekdayFromIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"][new Date(year, month - 1, day).getDay()];
}
