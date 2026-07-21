import { NextResponse } from "next/server";
import { z } from "zod";
import { buildRebalancePreview } from "@/lib/adaptive-plan";
import { getUserFromRequest } from "@/lib/server-auth";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type { ScheduleItem } from "@/lib/types";

const schema = z.object({ planId: z.string().uuid(), apply: z.boolean().default(false), reason: z.string().max(500).default("Recuperação de sessões atrasadas") });

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const supabase = createAdminSupabaseClient();
    if (!user || !supabase) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 });

    const { data: plan } = await supabase.from("study_plans").select("id,exam_date").eq("id", parsed.data.planId).eq("user_id", user.id).maybeSingle();
    if (!plan) return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });
    const { data: rows, error } = await supabase.from("schedule_items").select("*").eq("plan_id", plan.id).order("date");
    if (error) throw error;
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
    const preview = buildRebalancePreview(schedule, plan.exam_date);

    if (parsed.data.apply && preview.moves.length) {
      const { data: adjustment, error: adjustmentError } = await supabase.from("plan_adjustments").insert({
        user_id: user.id,
        plan_id: plan.id,
        reason: parsed.data.reason,
        before_schedule: schedule,
        after_schedule: preview.schedule,
        applied: true,
        applied_at: new Date().toISOString()
      }).select("id").single();
      if (adjustmentError) throw adjustmentError;

      for (const move of preview.moves) {
        const { error: moveError } = await supabase.from("schedule_items").update({ date: move.toDate, status: "planned" }).eq("id", move.itemId).eq("plan_id", plan.id);
        if (moveError) throw moveError;
      }
      await supabase.from("study_events").insert({
        user_id: user.id,
        plan_id: plan.id,
        event_name: "plan_rebalanced",
        metadata: { adjustmentId: adjustment.id, moved: preview.moves.length }
      });
    }

    return NextResponse.json({ preview });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível reorganizar o plano." }, { status: 500 });
  }
}

function weekdayFromIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"][new Date(year, month - 1, day).getDay()];
}
