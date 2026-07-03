import OpenAI from "openai";
import { z } from "zod";
import { getEnv, isMockAiEnabled } from "./env";
import { generateRuleBasedPlan } from "./plan-rules";
import type { GeneratedPlan, StudyPlanRequest } from "./types";

const extractionSchema = z.object({
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
  recommendations: z.array(z.string())
});

export async function generatePlanWithAi(input: StudyPlanRequest): Promise<GeneratedPlan> {
  if (isMockAiEnabled() || !getEnv("OPENAI_API_KEY")) {
    return generateRuleBasedPlan(input);
  }

  const client = new OpenAI({ apiKey: getEnv("OPENAI_API_KEY") });
  const model = getEnv("OPENAI_MODEL") || "gpt-4.1-mini";
  const content: OpenAI.Responses.ResponseInputMessageContentList = [
    {
      type: "input_text",
      text: JSON.stringify({
        instructions: [
          "Extraia do edital as disciplinas principais.",
          "Para cada disciplina, extraia todos os tópicos e subtópicos cobrados.",
          "Quando houver tabela de número de questões, peso ou pontos, preencha questions e weight como o total de pontos da disciplina.",
          "Não crie cronograma. O sistema vai distribuir os estudos até a data da prova.",
          "Não invente tópicos se o edital estiver anexado ou colado; normalize nomes e remova duplicidades."
        ],
        routine: input.routine,
        editalText: input.editalText || ""
      })
    }
  ];

  if (input.editalFile) {
    content.push({
      type: "input_file",
      filename: input.editalFile.name,
      file_data: `data:${input.editalFile.type || "application/octet-stream"};base64,${input.editalFile.data}`
    });
  }

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "developer",
        content:
          "Você é um planejador de estudos para concursos, vestibulares e provas. Responda apenas JSON válido no formato solicitado. Seja fiel ao edital e organize disciplinas, pesos e subtópicos."
      },
      {
        role: "user",
        content
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "study_plan_extraction",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["title", "examDate", "summary", "subjects", "recommendations"],
          properties: {
            title: { type: "string" },
            examDate: { type: "string" },
            summary: { type: "string" },
            subjects: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "questions", "weight", "topics"],
                properties: {
                  name: { type: "string" },
                  questions: { type: "number" },
                  weight: { type: "number" },
                  topics: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      }
    }
  });

  const parsed = extractionSchema.safeParse(JSON.parse(response.output_text || "{}"));

  if (!parsed.success) {
    throw new Error("A IA retornou disciplinas fora do formato esperado.");
  }

  const rulePlan = generateRuleBasedPlan({
    ...input,
    subjects: parsed.data.subjects
  });

  return {
    ...rulePlan,
    title: parsed.data.title || rulePlan.title,
    summary: parsed.data.summary || rulePlan.summary,
    recommendations: parsed.data.recommendations.length ? parsed.data.recommendations : rulePlan.recommendations,
    source: "openai"
  };
}
