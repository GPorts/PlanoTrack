import { NextResponse } from "next/server";
import { calculateTopicMastery } from "@/lib/adaptive-plan";
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

  const [{ data: subjects }, { data: sessions }, { data: reviews }] = await Promise.all([
    supabase.from("subjects").select("name,topics(id,title,next_review_at)").eq("plan_id", planId),
    supabase.from("study_sessions").select("id,studied_at,subject_name,topic_title,topic_id,minutes,questions,correct,difficulty,confidence,completion_percent").eq("plan_id", planId),
    supabase.from("topic_review_states").select("topic_id,due_at").eq("plan_id", planId)
  ]);
  const dueByTopic = new Map((reviews || []).map((item) => [String(item.topic_id), String(item.due_at)]));
  const mappedSessions = (sessions || []).map((item) => ({
    id: item.id,
    date: item.studied_at,
    subject: item.subject_name || "Geral",
    topic: item.topic_title || undefined,
    topicId: item.topic_id || undefined,
    minutes: item.minutes,
    questions: item.questions,
    correct: item.correct,
    difficulty: item.difficulty || undefined,
    confidence: item.confidence || undefined,
    completionPercent: item.completion_percent
  }));
  const mastery = (subjects || []).flatMap((subject) => (subject.topics || []).map((topic: { id: string; title: string; next_review_at: string | null }) => ({
    ...calculateTopicMastery(subject.name, topic.title, mappedSessions, dueByTopic.get(topic.id) || topic.next_review_at || undefined),
    topicId: topic.id
  })));
  return NextResponse.json({ mastery });
}
