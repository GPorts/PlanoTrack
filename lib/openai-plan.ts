import OpenAI from "openai";
import { z } from "zod";
import { getEnv, isMockAiEnabled } from "./env";
import { generateRuleBasedPlan } from "./plan-rules";
import type { GeneratedPlan, StudyPlanRequest } from "./types";

const planSchema = z.object({
  title: z.string(),
  examDate: z.string(),
  summary: z.string(),
  subjects: z.array(
    z.object({
      name: z.string(),
      questions: z.number().optional(),
      weight: z.number().optional(),
      topics: z.array(z.string())
    })
  ),
  schedule: z.array(
    z.object({
      date: z.string(),
      weekday: z.string(),
      period: z.enum(["Manha", "Tarde", "Noite"]),
      subject: z.string(),
      topic: z.string(),
      kind: z.enum(["teoria", "questoes", "revisao"]),
      minutes: z.number()
    })
  ),
  recommendations: z.array(z.string())
});

export async function generatePlanWithAi(input: StudyPlanRequest): Promise<GeneratedPlan> {
  if (isMockAiEnabled() || !getEnv("OPENAI_API_KEY")) {
    return generateRuleBasedPlan(input);
  }

  const client = new OpenAI({ apiKey: getEnv("OPENAI_API_KEY") });
  const model = getEnv("OPENAI_MODEL") || "gpt-4o-mini";

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Voce e um planejador de estudos para concursos. Responda apenas JSON valido no formato solicitado. Crie planos realistas, diarios, com teoria, revisao e questoes."
      },
      {
        role: "user",
        content: JSON.stringify({
          instructions: [
            "Extraia disciplinas, subtópicos e pesos do edital quando houver texto.",
            "Use a data da prova e a rotina para distribuir os subtópicos ate a prova.",
            "Priorize disciplinas com maior peso/pontos.",
            "Blocos noturnos devem ser questoes ou revisao sempre que possivel.",
            "Retorne no maximo 45 itens de cronograma nesta primeira resposta para manter o MVP rapido."
          ],
          expectedShape: {
            title: "string",
            examDate: "YYYY-MM-DD",
            summary: "string",
            subjects: [{ name: "string", questions: 0, weight: 0, topics: ["string"] }],
            schedule: [
              {
                date: "YYYY-MM-DD",
                weekday: "string",
                period: "Manha|Tarde|Noite",
                subject: "string",
                topic: "string",
                kind: "teoria|questoes|revisao",
                minutes: 120
              }
            ],
            recommendations: ["string"]
          },
          input
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = planSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    throw new Error("A IA retornou um plano fora do formato esperado.");
  }

  return parsed.data;
}
