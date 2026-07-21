import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { getUserFromRequest, userHasActiveSubscription } from "@/lib/server-auth";
import { createAdminSupabaseClient } from "@/lib/supabase";

const outputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  flashcards: z.array(z.object({ front: z.string(), back: z.string(), sourceExcerpt: z.string() })),
  quiz: z.array(z.object({ question: z.string(), options: z.array(z.string()).length(4), correctIndex: z.number().int().min(0).max(3), explanation: z.string(), sourceExcerpt: z.string() }))
});

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Entre novamente para gerar o material." }, { status: 401 });
    if (!(await userHasActiveSubscription(user.id))) return NextResponse.json({ error: "É necessário ter uma assinatura ativa." }, { status: 403 });

    const form = await request.formData();
    const planId = String(form.get("planId") || "");
    const subject = String(form.get("subject") || "Geral").slice(0, 200);
    const topic = String(form.get("topic") || "").slice(0, 300);
    const materialText = String(form.get("materialText") || "").trim();
    const file = form.get("materialFile");
    if (!z.string().uuid().safeParse(planId).success) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    if (!materialText && (!(file instanceof File) || !file.size)) return NextResponse.json({ error: "Cole um material ou anexe um arquivo." }, { status: 400 });

    const supabase = createAdminSupabaseClient();
    const { data: plan } = await supabase!.from("study_plans").select("id").eq("id", planId).eq("user_id", user.id).maybeSingle();
    if (!plan) return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });

    const content: OpenAI.Responses.ResponseInputMessageContentList = [{
      type: "input_text",
      text: `Disciplina: ${subject}\nSubtópico: ${topic || "não informado"}\nMaterial fornecido:\n${materialText.slice(0, 80_000)}`
    }];
    let sourceName = "Texto colado";
    if (file instanceof File && file.size) {
      if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "O arquivo precisa ter até 8 MB." }, { status: 400 });
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!extension || !["pdf", "txt", "md"].includes(extension)) return NextResponse.json({ error: "Envie PDF, TXT ou MD." }, { status: 400 });
      sourceName = file.name;
      const data = Buffer.from(await file.arrayBuffer()).toString("base64");
      content.push({ type: "input_file", filename: file.name, file_data: `data:${file.type || "application/octet-stream"};base64,${data}` });
    }

    const model = getEnv("OPENAI_MODEL") || "gpt-4.1-mini";
    const client = new OpenAI({ apiKey: getEnv("OPENAI_API_KEY") });
    const response = await client.responses.create({
      model,
      store: false,
      input: [
        { role: "developer", content: "Crie material de recuperação ativa exclusivamente a partir da fonte enviada. Não use conhecimento externo e não invente fatos. Cada item deve trazer um trecho curto da fonte que o sustenta. Responda apenas no JSON solicitado." },
        { role: "user", content }
      ],
      text: { format: { type: "json_schema", name: "source_grounded_study_pack", strict: true, schema: {
        type: "object", additionalProperties: false, required: ["title", "summary", "flashcards", "quiz"], properties: {
          title: { type: "string" }, summary: { type: "string" },
          flashcards: { type: "array", minItems: 4, maxItems: 12, items: { type: "object", additionalProperties: false, required: ["front", "back", "sourceExcerpt"], properties: { front: { type: "string" }, back: { type: "string" }, sourceExcerpt: { type: "string" } } } },
          quiz: { type: "array", minItems: 3, maxItems: 8, items: { type: "object", additionalProperties: false, required: ["question", "options", "correctIndex", "explanation", "sourceExcerpt"], properties: { question: { type: "string" }, options: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } }, correctIndex: { type: "integer", minimum: 0, maximum: 3 }, explanation: { type: "string" }, sourceExcerpt: { type: "string" } } } }
        }
      } } }
    });
    const parsed = outputSchema.safeParse(JSON.parse(response.output_text || "{}"));
    if (!parsed.success) throw new Error("A IA não conseguiu estruturar o material com segurança.");

    const { data: saved } = await supabase!.from("study_material_packs").insert({ user_id: user.id, plan_id: planId, subject_name: subject, topic_title: topic || null, source_name: sourceName, generated_content: parsed.data }).select("id").single();
    await supabase!.from("ai_usage_events").insert({ user_id: user.id, plan_id: planId, operation: "study_materials", model, input_tokens: response.usage?.input_tokens || 0, output_tokens: response.usage?.output_tokens || 0 });
    return NextResponse.json({ pack: { id: saved?.id || crypto.randomUUID(), sourceName, subject, topic, ...parsed.data } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível gerar o material." }, { status: 500 });
  }
}
