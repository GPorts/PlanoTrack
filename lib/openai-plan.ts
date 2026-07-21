import OpenAI from "openai";
import { z } from "zod";
import { getEnv, isMockAiEnabled } from "./env";
import { generateRuleBasedPlan } from "./plan-rules";
import type { GeneratedPlan, StudyPlanRequest } from "./types";

export type AiUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
};

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
  routinePolicy: z.object({
    blocks: z
      .array(
        z.object({
          period: z.enum(["Manha", "Tarde", "Noite"]),
          kind: z.enum(["teoria", "questoes", "revisao"]),
          instruction: z.string()
        })
      )
      .min(1)
      .max(6),
    maxSubjectsPerDay: z.number().int().min(1).max(3),
    avoidConsecutiveSubjectDays: z.boolean(),
    maxStudyDaysPerSubjectPerWeek: z.number().int().min(0).max(7)
  }),
  recommendations: z.array(z.string())
});

export async function generatePlanWithAi(input: StudyPlanRequest, onUsage?: (usage: AiUsage) => void): Promise<GeneratedPlan> {
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
          "Quando houver tabela, preencha questions com o número de questões e weight com o total de pontos da disciplina (número de questões multiplicado pelo peso por questão).",
          "Interprete routine.preferredBlocks como uma instrução livre e obrigatória do usuário, não como uma sugestão.",
          "Converta a rotina em routinePolicy e inclua somente os períodos citados quando eles forem claros.",
          "Em cada bloco, instruction deve preservar a atividade pedida, por exemplo: Ler lei seca, Ler doutrina/caderno ou Resolver questões da matéria do dia.",
          "Se o usuário pedir uma matéria por dia, use maxSubjectsPerDay = 1; todos os blocos daquele dia estudarão essa mesma disciplina.",
          "Se pedir para não repetir a mesma matéria na semana, use maxStudyDaysPerSubjectPerWeek = 1. Use 0 quando não houver limite semanal explícito.",
          "Se pedir para alternar ou intercalar matérias, use avoidConsecutiveSubjectDays = true.",
          "Classifique cada bloco corretamente: resolver questões ou exercícios = questoes; revisar = revisao; leitura, lei seca, doutrina, caderno ou aula = teoria.",
          "Não crie o calendário data por data. O sistema fará a distribuição até a prova usando a política interpretada.",
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
    store: false,
    input: [
      {
        role: "developer",
        content:
          "Você é um planejador de estudos para concursos, vestibulares e provas. Responda apenas JSON válido no formato solicitado. Seja fiel ao edital e trate a rotina escrita pelo usuário como requisito obrigatório. Organize disciplinas, pesos e subtópicos sem inventar conteúdo."
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
          required: ["title", "examDate", "summary", "subjects", "routinePolicy", "recommendations"],
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
            routinePolicy: {
              type: "object",
              additionalProperties: false,
              required: ["blocks", "maxSubjectsPerDay", "avoidConsecutiveSubjectDays", "maxStudyDaysPerSubjectPerWeek"],
              properties: {
                blocks: {
                  type: "array",
                  minItems: 1,
                  maxItems: 6,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["period", "kind", "instruction"],
                    properties: {
                      period: { type: "string", enum: ["Manha", "Tarde", "Noite"] },
                      kind: { type: "string", enum: ["teoria", "questoes", "revisao"] },
                      instruction: { type: "string" }
                    }
                  }
                },
                maxSubjectsPerDay: { type: "integer", minimum: 1, maximum: 3 },
                avoidConsecutiveSubjectDays: { type: "boolean" },
                maxStudyDaysPerSubjectPerWeek: { type: "integer", minimum: 0, maximum: 7 }
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

  onUsage?.({
    model,
    inputTokens: response.usage?.input_tokens || 0,
    outputTokens: response.usage?.output_tokens || 0
  });

  const parsed = extractionSchema.safeParse(JSON.parse(response.output_text || "{}"));

  if (!parsed.success) {
    throw new Error("A IA retornou disciplinas ou regras de rotina fora do formato esperado.");
  }

  const rulePlan = generateRuleBasedPlan(
    {
      ...input,
      subjects: parsed.data.subjects
    },
    parsed.data.routinePolicy
  );

  return {
    ...rulePlan,
    title: parsed.data.title || rulePlan.title,
    summary: parsed.data.summary || rulePlan.summary,
    recommendations: parsed.data.recommendations.length ? parsed.data.recommendations : rulePlan.recommendations,
    source: "openai"
  };
}
