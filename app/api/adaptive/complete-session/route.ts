import { NextResponse } from "next/server";
import { z } from "zod";
import { scheduleReview } from "@/lib/adaptive-plan";
import { getUserFromRequest } from "@/lib/server-auth";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type { RecallRating, ReviewState } from "@/lib/types";

const schema = z.object({
  planId: z.string().uuid(),
  scheduleItemId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional(),
  subject: z.string().min(1),
  topicTitle: z.string().default(""),
  kind: z.enum(["teoria", "questoes", "revisao", "simulado"]),
  status: z.enum(["completed", "partial", "postponed", "missed"]),
  actualMinutes: z.number().int().min(0).max(1440),
  questions: z.number().int().min(0),
  correct: z.number().int().min(0),
  difficulty: z.number().int().min(1).max(4).optional(),
  confidence: z.number().int().min(1).max(5).optional(),
  completionPercent: z.number().int().min(0).max(100),
  recallRating: z.enum(["forgot", "hard", "good", "easy"]).optional(),
  notes: z.string().max(5000).default(""),
  studiedAt: z.string().date().optional()
});

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const supabase = createAdminSupabaseClient();
    if (!user || !supabase) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Dados da sessão inválidos." }, { status: 400 });
    const input = parsed.data;
    if (input.correct > input.questions) return NextResponse.json({ error: "Acertos não podem superar o número de questões." }, { status: 400 });

    const { data: plan } = await supabase.from("study_plans").select("id").eq("id", input.planId).eq("user_id", user.id).maybeSingle();
    if (!plan) return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });

    const sessionId = crypto.randomUUID();
    const { error: sessionError } = await supabase.from("study_sessions").insert({
      id: sessionId,
      plan_id: input.planId,
      user_id: user.id,
      schedule_item_id: input.scheduleItemId || null,
      topic_id: input.topicId || null,
      topic_title: input.topicTitle || null,
      subject_name: input.subject,
      kind: input.kind,
      minutes: input.actualMinutes,
      questions: input.questions,
      correct: input.correct,
      difficulty: input.difficulty || null,
      confidence: input.confidence || null,
      completion_percent: input.completionPercent,
      recall_rating: input.recallRating || null,
      notes: input.notes,
      studied_at: input.studiedAt || todayInSaoPaulo()
    });
    if (sessionError) throw sessionError;

    if (input.scheduleItemId) {
      const { error } = await supabase.from("schedule_items").update({
        status: input.status,
        completion_percent: input.completionPercent,
        completed_at: input.status === "completed" ? new Date().toISOString() : null
      }).eq("id", input.scheduleItemId).eq("plan_id", input.planId);
      if (error) throw error;
    }

    let reviewState: ReviewState | undefined;
    if (input.topicId && input.recallRating && input.status !== "missed" && input.status !== "postponed") {
      const { data: stored } = await supabase.from("topic_review_states").select("*").eq("topic_id", input.topicId).maybeSingle();
      const previous: ReviewState | undefined = stored ? {
        topicId: input.topicId,
        dueAt: stored.due_at,
        stability: Number(stored.stability),
        difficulty: Number(stored.difficulty),
        scheduledDays: stored.scheduled_days,
        reps: stored.reps,
        lapses: stored.lapses,
        state: stored.state,
        lastReviewAt: stored.last_review_at || undefined
      } : undefined;
      reviewState = { ...scheduleReview(previous, input.recallRating as RecallRating), topicId: input.topicId };

      const { error: reviewError } = await supabase.from("topic_review_states").upsert({
        user_id: user.id,
        plan_id: input.planId,
        topic_id: input.topicId,
        due_at: reviewState.dueAt,
        stability: reviewState.stability,
        difficulty: reviewState.difficulty,
        scheduled_days: reviewState.scheduledDays,
        reps: reviewState.reps,
        lapses: reviewState.lapses,
        state: reviewState.state,
        last_review_at: reviewState.lastReviewAt,
        updated_at: new Date().toISOString()
      }, { onConflict: "topic_id" });
      if (reviewError) throw reviewError;

      await supabase.from("review_events").insert({
        user_id: user.id,
        plan_id: input.planId,
        topic_id: input.topicId,
        rating: input.recallRating,
        previous_due_at: previous?.dueAt || null,
        next_due_at: reviewState.dueAt
      });
      await supabase.from("topics").update({
        last_studied_at: new Date().toISOString(),
        next_review_at: reviewState.dueAt
      }).eq("id", input.topicId);
    }

    await supabase.from("study_events").insert({
      user_id: user.id,
      plan_id: input.planId,
      event_name: "session_completed",
      metadata: { status: input.status, minutes: input.actualMinutes, questions: input.questions }
    });

    return NextResponse.json({ sessionId, reviewState });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível concluir a sessão." }, { status: 500 });
  }
}

function todayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}
