import type { CreditBalance, GeneratedPlan } from "./types";

export const demoCredits: CreditBalance = {
  available: 1,
  pending: 0
};

export const demoPlan: GeneratedPlan = {
  title: "PGM Itupeva - Plano de reta inicial",
  examDate: "2026-08-29",
  summary:
    "Plano gerado em modo demonstracao. A versao com IA usa o edital enviado, pesos, data da prova e rotina semanal para montar um cronograma detalhado.",
  subjects: [
    {
      name: "Lingua Portuguesa",
      questions: 6,
      weight: 9,
      topics: ["Interpretacao de texto", "Classes de palavras", "Sintaxe", "Reescrita"]
    },
    {
      name: "Direito Administrativo",
      questions: 8,
      weight: 12,
      topics: ["Atos administrativos", "Licitacoes", "Agentes publicos", "Responsabilidade civil do Estado"]
    },
    {
      name: "Direito Constitucional",
      questions: 8,
      weight: 12,
      topics: ["Direitos fundamentais", "Organizacao do Estado", "Controle de constitucionalidade"]
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
      subject: "Lingua Portuguesa",
      topic: "Questoes de interpretacao de texto",
      kind: "questoes",
      minutes: 120
    }
  ],
  recommendations: [
    "Use IA apenas para gerar ou replanejar o plano; o acompanhamento diario nao precisa gastar tokens.",
    "Venda o MVP por assinatura: assinatura ativa libera planos ilimitados a partir de editais.",
    "Mostre claramente quando a geracao usou IA real para facilitar testes e suporte."
  ]
};
