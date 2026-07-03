import type { CreditBalance, GeneratedPlan } from "./types";

export const demoCredits: CreditBalance = {
  available: 1,
  pending: 0
};

export const demoPlan: GeneratedPlan = {
  title: "PGM Itupeva - Plano de reta inicial",
  examDate: "2026-08-29",
  summary:
    "Plano gerado em modo demonstração. A versão com IA usa o edital enviado, pesos, data da prova e rotina semanal para montar um cronograma detalhado.",
  subjects: [
    {
      name: "Língua Portuguesa",
      questions: 6,
      weight: 9,
      topics: ["Interpretação de texto", "Classes de palavras", "Sintaxe", "Reescrita"]
    },
    {
      name: "Direito Administrativo",
      questions: 8,
      weight: 12,
      topics: ["Atos administrativos", "Licitações", "Agentes públicos", "Responsabilidade civil do Estado"]
    },
    {
      name: "Direito Constitucional",
      questions: 8,
      weight: 12,
      topics: ["Direitos fundamentais", "Organização do Estado", "Controle de constitucionalidade"]
    }
  ],
  schedule: [
    {
      date: "2026-06-29",
      weekday: "Segunda-feira",
      period: "Manha",
      subject: "Direito Administrativo",
      topic: "Atos administrativos",
      kind: "teoria",
      minutes: 120
    },
    {
      date: "2026-06-29",
      weekday: "Segunda-feira",
      period: "Tarde",
      subject: "Direito Constitucional",
      topic: "Direitos fundamentais",
      kind: "teoria",
      minutes: 120
    },
    {
      date: "2026-06-29",
      weekday: "Segunda-feira",
      period: "Noite",
      subject: "Língua Portuguesa",
      topic: "Questões de interpretação de texto",
      kind: "questoes",
      minutes: 120
    }
  ],
  recommendations: [
    "Use IA apenas para gerar ou replanejar o plano; o acompanhamento diário não precisa gastar tokens.",
    "Venda o MVP por assinatura: assinatura ativa libera planos ilimitados a partir de editais.",
    "Mostre claramente quando a geração usou IA real para facilitar testes e suporte."
  ]
};
