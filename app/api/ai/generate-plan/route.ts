import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePlanWithAi } from "@/lib/openai-plan";
import { getUserFromRequest, userHasActiveSubscription } from "@/lib/server-auth";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type { AiUsage } from "@/lib/openai-plan";

const weekdaySchema = z.enum([
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo"
]);

const routineSchema = z
  .object({
    examName: z.string().min(1),
    examDate: z.string().min(1),
    hoursByDay: z.record(z.string(), z.number().min(0.5).max(12)).optional(),
    hoursPerDay: z.number().min(0.5).max(12).optional(),
    studyDays: z.array(weekdaySchema).min(1),
    preferredBlocks: z.string().default("")
  })
  .superRefine((routine, context) => {
    const missingHours = routine.studyDays.filter(
      (day) => !Number(routine.hoursByDay?.[day] ?? routine.hoursPerDay)
    );

    if (missingHours.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hoursByDay"],
        message: "Informe as horas disponíveis em todos os dias selecionados."
      });
    }
  });

const requestSchema = z.object({
  mode: z.enum(["ai"]).optional(),
  routine: routineSchema,
  editalText: z.string().optional(),
  editalFile: z
    .object({
      name: z.string().min(1),
      type: z.string(),
      data: z.string().min(1)
    })
    .optional(),
  subjects: z
    .array(
      z.object({
        name: z.string(),
        questions: z.number().optional(),
        weight: z.number().optional(),
        topics: z.array(z.string())
      })
    )
    .optional()
});

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Entre na sua conta para criar um plano." }, { status: 401 });
    }

    if (!(await userHasActiveSubscription(user.id))) {
      return NextResponse.json({ error: "É necessário ter uma assinatura ativa para criar planos com IA." }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";
    const body = contentType.includes("multipart/form-data") ? await formDataToBody(request) : await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos para gerar plano." }, { status: 400 });
    }

    if (isBeforeTomorrow(parsed.data.routine.examDate)) {
      return NextResponse.json({ error: "A data da prova precisa ser amanhã ou uma data futura." }, { status: 400 });
    }

    if (!parsed.data.editalText?.trim() && !parsed.data.editalFile) {
      return NextResponse.json({ error: "Cole o conteúdo do edital ou anexe um arquivo para gerar o plano." }, { status: 400 });
    }

    let usage: AiUsage | undefined;
    const plan = await generatePlanWithAi(parsed.data, (value) => { usage = value; });
    if (usage) {
      const supabase = createAdminSupabaseClient();
      await supabase?.from("ai_usage_events").insert({
        user_id: user.id,
        operation: "generate_plan",
        model: usage.model,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens
      });
    }
    return NextResponse.json({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function formDataToBody(request: Request) {
  const form = await request.formData();
  const file = form.get("editalFile");
  const legacyStudyDays = String(form.get("studyDays") || "")
    .split(",")
    .map((day) => day.trim())
    .filter(Boolean);
  const hoursByDay = parseHoursByDay(form.get("hoursByDay"));
  const studyDays = Object.keys(hoursByDay).length ? Object.keys(hoursByDay) : legacyStudyDays;
  const legacyHoursPerDay = Number(form.get("hoursPerDay") || 0);

  return {
    mode: "ai",
    routine: {
      examName: String(form.get("examName") || ""),
      examDate: String(form.get("examDate") || ""),
      hoursByDay,
      hoursPerDay: legacyHoursPerDay > 0 ? legacyHoursPerDay : undefined,
      studyDays,
      preferredBlocks: String(form.get("preferredBlocks") || "")
    },
    editalText: String(form.get("editalText") || ""),
    editalFile: file instanceof File && file.size > 0 ? await serializeFile(file) : undefined
  };
}

function parseHoursByDay(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return {};

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([day, hours]) => [day, Number(hours)] as const)
        .filter(([, hours]) => Number.isFinite(hours) && hours > 0)
    );
  } catch {
    return {};
  }
}

async function serializeFile(file: File) {
  const maxSize = 8 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error("O arquivo precisa ter até 8 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["pdf", "txt", "md"].includes(extension)) {
    throw new Error("Envie o edital em PDF, TXT ou MD.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return {
    name: file.name,
    type: file.type || "application/pdf",
    data: buffer.toString("base64")
  };
}

function isBeforeTomorrow(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const selected = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Number.isNaN(selected.getTime()) || selected <= today;
}
