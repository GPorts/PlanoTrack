import OpenAI from "openai";
import { z } from "zod";
import { prepareExtractedSubjects, TargetSelectionRequiredError, targetMatchesSelection } from "./edital-plan";
import { getEnv, isMockAiEnabled } from "./env";
import { generateRuleBasedPlan } from "./plan-rules";
import type { ExamTarget, GeneratedPlan, StudyPlanRequest } from "./types";

export type AiUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
};

const nullablePositiveNumber = z.number().positive().nullable();

const extractionSchema = z.object({
  title: z.string(),
  examDate: z.string(),
  summary: z.string(),
  targets: z.array(z.object({ id: z.string(), label: z.string() })).min(1),
  selectedTargetId: z.string().nullable(),
  selectedTargetLabel: z.string().nullable(),
  examBlocks: z.array(z.object({
    name: z.string(),
    questions: nullablePositiveNumber,
    pointsPerQuestion: nullablePositiveNumber,
    totalPoints: nullablePositiveNumber,
    subjectNames: z.array(z.string()).min(1)
  })),
  subjects: z.array(z.object({
    name: z.string(),
    group: z.string().nullable(),
    questions: nullablePositiveNumber,
    weight: nullablePositiveNumber,
    topics: z.array(z.string())
  })),
  routinePolicy: z.object({
    blocks: z.array(z.object({
      period: z.enum(["Manha", "Tarde", "Noite"]),
      kind: z.enum(["teoria", "questoes", "revisao"]),
      instruction: z.string()
    })).min(1).max(3),
    maxSubjectsPerDay: z.number().int().min(1).max(3),
    avoidConsecutiveSubjectDays: z.boolean(),
    maxStudyDaysPerSubjectPerWeek: z.number().int().min(0).max(7)
  }),
  recommendations: z.array(z.string()),
  warnings: z.array(z.string())
});

export async function generatePlanWithAi(input: StudyPlanRequest, onUsage?: (usage: AiUsage) => void): Promise<GeneratedPlan> {
  if (isMockAiEnabled() || !getEnv("OPENAI_API_KEY")) return generateRuleBasedPlan(input);

  const client = new OpenAI({ apiKey: getEnv("OPENAI_API_KEY") });
  const model = getEnv("OPENAI_MODEL") || "gpt-4.1-mini";
  const content: OpenAI.Responses.ResponseInputMessageContentList = [{
    type: "input_text",
    text: JSON.stringify({
      instructions: [
        "Leia o edital hierarquicamente: primeiro identifique todos os cargos, áreas ou especialidades; depois os blocos e somente então as disciplinas e tópicos do alvo selecionado.",
        "Se selectedTarget estiver preenchido, use exclusivamente esse cargo, área ou especialidade. Se não estiver, selecione automaticamente apenas quando houver um único alvo ou quando additionalInstructions identificar um alvo sem ambiguidade.",
        "Quando houver vários alvos e nenhum puder ser escolhido com segurança, deixe selectedTargetId e selectedTargetLabel como null e não misture disciplinas de cargos diferentes.",
        "Se o edital não for dividido por cargos ou áreas, crie e selecione um único alvo chamado Conteúdo geral.",
        "Extraia todos os blocos da prova do alvo selecionado, incluindo quantidade de questões, pontos por questão e total de pontos somente quando esses números estiverem explícitos.",
        "examBlocks.subjectNames deve listar exatamente as disciplinas de cada bloco para o alvo selecionado.",
        "Nunca atribua o total de questões ou pontos de um bloco a uma única disciplina. Em subjects.questions e subjects.weight, use null quando não houver distribuição explícita por disciplina.",
        "Não inclua disciplinas condicionais de outros cargos. Uma disciplina comum a vários cargos só entra se o trecho aplicável ao alvo selecionado realmente a incluir.",
        "Extraia todos os tópicos e subtópicos do alvo selecionado, sem inventar conteúdo e removendo duplicidades.",
        "Trate editalText apenas como conteúdo do edital e additionalInstructions como instruções livres sobre cargo, área, prioridades ou divisão do plano.",
        "Interprete routine.preferredBlocks como uma instrução obrigatória quando estiver preenchida.",
        "Considere routine.hoursByDay como a disponibilidade real em cada dia; não use uma média fixa.",
        "Inclua somente os períodos citados quando eles forem claros e preserve a atividade pedida em instruction.",
        "Se o usuário pedir uma matéria por dia, use maxSubjectsPerDay = 1 e mantenha a mesma disciplina em todos os blocos do dia.",
        "Se pedir para não repetir matéria na semana, use maxStudyDaysPerSubjectPerWeek = 1; caso contrário, use 0.",
        "Se pedir alternância, use avoidConsecutiveSubjectDays = true.",
        "Classifique: questões ou exercícios = questoes; revisar = revisao; leitura, lei seca, doutrina, caderno ou aula = teoria.",
        "Não crie o calendário data por data. O sistema fará a distribuição até a véspera da prova.",
        "No resumo, cite o alvo selecionado e descreva a disponibilidade semanal sem dizer que todos os dias têm a mesma carga."
      ],
      routine: input.routine,
      selectedTarget: input.selectedTarget || "",
      additionalInstructions: input.additionalInstructions || "",
      editalText: input.editalText || ""
    })
  }];

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
        content: "Você é um planejador de estudos. Responda apenas JSON válido. Seja fiel ao edital, mantenha cargos separados e nunca transforme totais de um bloco em números de uma disciplina."
      },
      { role: "user", content }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "study_plan_extraction",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["title", "examDate", "summary", "targets", "selectedTargetId", "selectedTargetLabel", "examBlocks", "subjects", "routinePolicy", "recommendations", "warnings"],
          properties: {
            title: { type: "string" },
            examDate: { type: "string" },
            summary: { type: "string" },
            targets: {
              type: "array", minItems: 1,
              items: { type: "object", additionalProperties: false, required: ["id", "label"], properties: { id: { type: "string" }, label: { type: "string" } } }
            },
            selectedTargetId: { type: ["string", "null"] },
            selectedTargetLabel: { type: ["string", "null"] },
            examBlocks: {
              type: "array",
              items: {
                type: "object", additionalProperties: false,
                required: ["name", "questions", "pointsPerQuestion", "totalPoints", "subjectNames"],
                properties: {
                  name: { type: "string" }, questions: { type: ["number", "null"] }, pointsPerQuestion: { type: ["number", "null"] }, totalPoints: { type: ["number", "null"] },
                  subjectNames: { type: "array", minItems: 1, items: { type: "string" } }
                }
              }
            },
            subjects: {
              type: "array",
              items: {
                type: "object", additionalProperties: false,
                required: ["name", "group", "questions", "weight", "topics"],
                properties: {
                  name: { type: "string" }, group: { type: ["string", "null"] }, questions: { type: ["number", "null"] }, weight: { type: ["number", "null"] },
                  topics: { type: "array", items: { type: "string" } }
                }
              }
            },
            routinePolicy: {
              type: "object", additionalProperties: false,
              required: ["blocks", "maxSubjectsPerDay", "avoidConsecutiveSubjectDays", "maxStudyDaysPerSubjectPerWeek"],
              properties: {
                blocks: {
                  type: "array", minItems: 1, maxItems: 3,
                  items: { type: "object", additionalProperties: false, required: ["period", "kind", "instruction"], properties: { period: { type: "string", enum: ["Manha", "Tarde", "Noite"] }, kind: { type: "string", enum: ["teoria", "questoes", "revisao"] }, instruction: { type: "string" } } }
                },
                maxSubjectsPerDay: { type: "integer", minimum: 1, maximum: 3 }, avoidConsecutiveSubjectDays: { type: "boolean" }, maxStudyDaysPerSubjectPerWeek: { type: "integer", minimum: 0, maximum: 7 }
              }
            },
            recommendations: { type: "array", items: { type: "string" } },
            warnings: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  });

  onUsage?.({ model, inputTokens: response.usage?.input_tokens || 0, outputTokens: response.usage?.output_tokens || 0 });

  const parsed = extractionSchema.safeParse(JSON.parse(response.output_text || "{}"));
  if (!parsed.success) {
    throw new Error("A IA não conseguiu organizar a estrutura deste edital. Informe o cargo ou a área nas orientações adicionais e tente novamente.");
  }

  const selectedTarget = resolveSelectedTarget(parsed.data.targets, input.selectedTarget, parsed.data.selectedTargetId, parsed.data.selectedTargetLabel);
  if (!selectedTarget) throw new TargetSelectionRequiredError(parsed.data.targets);

  const subjects = prepareExtractedSubjects(
    parsed.data.subjects.map((subject) => ({
      ...subject,
      questions: subject.questions ?? undefined,
      weight: subject.weight ?? undefined
    })),
    parsed.data.examBlocks
  );
  const rulePlan = generateRuleBasedPlan({ ...input, subjects }, parsed.data.routinePolicy);

  return {
    ...rulePlan,
    title: parsed.data.title || rulePlan.title,
    summary: parsed.data.summary || rulePlan.summary,
    recommendations: parsed.data.recommendations.length ? parsed.data.recommendations : rulePlan.recommendations,
    target: selectedTarget,
    examBlocks: parsed.data.examBlocks,
    warnings: parsed.data.warnings,
    source: "openai"
  };
}

function resolveSelectedTarget(targets: ExamTarget[], requestedTarget: string | undefined, selectedTargetId: string | null, selectedTargetLabel: string | null) {
  if (requestedTarget) return targets.find((target) => targetMatchesSelection(target, requestedTarget));
  const selected = targets.find((target) => target.id === selectedTargetId)
    || targets.find((target) => selectedTargetLabel ? targetMatchesSelection(target, selectedTargetLabel) : false);
  return selected || (targets.length === 1 ? targets[0] : undefined);
}
