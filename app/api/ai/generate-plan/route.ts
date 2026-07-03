import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePlanWithAi } from "@/lib/openai-plan";

const requestSchema = z.object({
  mode: z.enum(["ai"]).optional(),
  routine: z.object({
    examName: z.string().min(1),
    examDate: z.string().min(1),
    hoursPerDay: z.number().min(1).max(12),
    studyDays: z.array(z.string()),
    preferredBlocks: z.string().default("")
  }),
  editalText: z.string().optional(),
  editalFile: z
    .object({
      name: z.string(),
      type: z.string(),
      data: z.string()
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
    const contentType = request.headers.get("content-type") || "";
    const body = contentType.includes("multipart/form-data") ? await formDataToBody(request) : await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos para gerar plano." }, { status: 400 });
    }

    const plan = await generatePlanWithAi(parsed.data);
    return NextResponse.json({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function formDataToBody(request: Request) {
  const form = await request.formData();
  const file = form.get("editalFile");
  const studyDays = String(form.get("studyDays") || "")
    .split(",")
    .map((day) => day.trim())
    .filter(Boolean);

  return {
    mode: "ai",
    routine: {
      examName: String(form.get("examName") || ""),
      examDate: String(form.get("examDate") || ""),
      hoursPerDay: Number(form.get("hoursPerDay") || 6),
      studyDays,
      preferredBlocks: String(form.get("preferredBlocks") || "")
    },
    editalText: String(form.get("editalText") || ""),
    editalFile: file instanceof File && file.size > 0 ? await serializeFile(file) : undefined
  };
}

async function serializeFile(file: File) {
  const maxSize = 8 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error("O arquivo precisa ter até 8 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return {
    name: file.name,
    type: file.type || "application/pdf",
    data: buffer.toString("base64")
  };
}
