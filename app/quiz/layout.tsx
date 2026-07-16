import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnóstico de estudos | PlanoTracker",
  description: "Descubra o principal gargalo do seu plano de estudos e receba próximos passos personalizados para sua rotina."
};

export default function QuizLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
