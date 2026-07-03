import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePlanWithAi } from "@/lib/openai-plan";

const requestSchema = z.object({
  mode: z.enum(["manual", "ai"]),
  routine: z.object({
    examName: z.string().min(1),
    examDate: z.string().min(1),
    hoursPerDay: z.number().min(1).max(12),
    studyDays: z.array(z.string()),
    preferredBlocks: z.string().default("")
  }),
  editalText: z.string().optional(),
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
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para gerar plano." }, { status: 400 });
    }

    // TODO: when auth is enabled, require public.has_active_subscription(user.id) before mode === "ai".
    const plan = await generatePlanWithAi(parsed.data);
    return NextResponse.json({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
