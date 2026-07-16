"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  BookOpenCheck,
  BrainCircuit,
  CalendarRange,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  LoaderCircle,
  ListChecks,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target
} from "lucide-react";

type Stage = "Perfil" | "Diagnóstico" | "Plano";
type Answers = Record<string, string>;
type QuizView = "intro" | "questions" | "profile-insight" | "diagnosis-insight" | "commitment" | "loading" | "result";

type QuizOption = {
  value: string;
  label: string;
  detail?: string;
};

type QuizQuestion = {
  id: string;
  stage: Stage;
  eyebrow: string;
  title: string;
  subtitle: string;
  options: QuizOption[];
};

const questions: QuizQuestion[] = [
  {
    id: "goal",
    stage: "Perfil",
    eyebrow: "Vamos começar pelo seu objetivo",
    title: "Para qual tipo de prova você está estudando?",
    subtitle: "Isso ajuda a entender o formato e o tamanho do conteúdo que precisa ser organizado.",
    options: [
      { value: "concurso", label: "Concurso público" },
      { value: "vestibular", label: "Vestibular ou ENEM" },
      { value: "oab", label: "OAB, residência ou certificação" },
      { value: "faculdade", label: "Faculdade ou prova acadêmica" },
      { value: "outro", label: "Outro objetivo" }
    ]
  },
  {
    id: "deadline",
    stage: "Perfil",
    eyebrow: "Seu prazo muda toda a estratégia",
    title: "Quanto tempo falta para a prova?",
    subtitle: "Não existe resposta certa. Um plano bom precisa respeitar o tempo que realmente existe.",
    options: [
      { value: "urgent", label: "Menos de 30 dias" },
      { value: "short", label: "De 1 a 3 meses" },
      { value: "medium", label: "De 3 a 6 meses" },
      { value: "long", label: "Mais de 6 meses" },
      { value: "none", label: "Ainda não tenho uma data" }
    ]
  },
  {
    id: "time",
    stage: "Perfil",
    eyebrow: "Agora, a sua rotina real",
    title: "Quanto tempo você consegue estudar em um dia comum?",
    subtitle: "Considere trabalho, deslocamento, família e descanso. Planejar com tempo imaginário costuma frustrar.",
    options: [
      { value: "little", label: "Até 1 hora" },
      { value: "some", label: "De 1 a 2 horas" },
      { value: "good", label: "De 2 a 4 horas" },
      { value: "high", label: "Mais de 4 horas" },
      { value: "varies", label: "Varia muito conforme o dia" }
    ]
  },
  {
    id: "planning",
    stage: "Diagnóstico",
    eyebrow: "Vamos olhar para o que acontece hoje",
    title: "Como você organiza o que precisa estudar?",
    subtitle: "Pense no seu método atual, não no que gostaria de fazer.",
    options: [
      { value: "none", label: "Ainda não tenho um plano", detail: "Vou escolhendo as matérias no dia." },
      { value: "generic", label: "Uso um cronograma genérico", detail: "Ele não considera todo o meu conteúdo." },
      { value: "stuck", label: "Tenho um plano, mas não consigo seguir", detail: "A rotina muda e ele fica para trás." },
      { value: "working", label: "Tenho um plano que funciona", detail: "Quero melhorar prioridade e acompanhamento." }
    ]
  },
  {
    id: "blocker",
    stage: "Diagnóstico",
    eyebrow: "O ponto que mais consome energia",
    title: "Qual é sua maior dificuldade neste momento?",
    subtitle: "Escolha a que mais atrapalha sua execução, mesmo que outras também aconteçam.",
    options: [
      { value: "volume", label: "O conteúdo parece grande demais" },
      { value: "split", label: "Não sei dividir matérias e subtópicos" },
      { value: "priority", label: "Não sei o que priorizar" },
      { value: "consistency", label: "Começo bem, mas perco a constância" },
      { value: "review", label: "Não encaixo revisão e questões" }
    ]
  },
  {
    id: "clarity",
    stage: "Diagnóstico",
    eyebrow: "Uma pergunta bem direta",
    title: "Com que frequência você senta para estudar sem saber exatamente por onde começar?",
    subtitle: "Essa dúvida diária parece pequena, mas acumula decisões e rouba tempo de estudo.",
    options: [
      { value: "always", label: "Quase todos os dias" },
      { value: "often", label: "Algumas vezes por semana" },
      { value: "sometimes", label: "De vez em quando" },
      { value: "rarely", label: "Raramente" }
    ]
  },
  {
    id: "consistency",
    stage: "Diagnóstico",
    eyebrow: "Seu plano precisa sobreviver às semanas difíceis",
    title: "O que acontece quando você perde um dia de estudo?",
    subtitle: "A forma como o cronograma reage aos imprevistos influencia sua constância.",
    options: [
      { value: "abandon", label: "Perco o ritmo e acabo abandonando" },
      { value: "pile", label: "O conteúdo acumula e tento compensar" },
      { value: "improvise", label: "Reorganizo tudo por conta própria" },
      { value: "adapt", label: "Ajusto o plano e continuo normalmente" }
    ]
  },
  {
    id: "routine",
    stage: "Plano",
    eyebrow: "Vamos desenhar o formato ideal",
    title: "Em qual rotina um plano funcionaria melhor para você?",
    subtitle: "O melhor calendário é aquele que cabe nos horários disponíveis, não o mais bonito no papel.",
    options: [
      { value: "morning", label: "Principalmente pela manhã" },
      { value: "day", label: "Principalmente à tarde" },
      { value: "night", label: "Principalmente à noite" },
      { value: "mixed", label: "Em períodos diferentes ao longo do dia" },
      { value: "weekend", label: "Pouco durante a semana e mais no fim de semana" }
    ]
  },
  {
    id: "balance",
    stage: "Plano",
    eyebrow: "Cada fase pede um equilíbrio",
    title: "Como você gostaria de combinar teoria, questões e revisão?",
    subtitle: "Sua escolha será usada no diagnóstico; depois, ela pode ser ajustada conforme seu desempenho.",
    options: [
      { value: "theory", label: "Mais teoria no começo" },
      { value: "balanced", label: "Teoria e questões desde o início" },
      { value: "practice", label: "Mais questões e revisão" },
      { value: "unknown", label: "Não sei qual combinação faz sentido" }
    ]
  },
  {
    id: "outcome",
    stage: "Plano",
    eyebrow: "Última pergunta",
    title: "O que mais faria diferença para você nas próximas semanas?",
    subtitle: "Isso define qual parte do seu plano merece mais atenção agora.",
    options: [
      { value: "daily", label: "Saber exatamente o que estudar a cada dia" },
      { value: "coverage", label: "Ter certeza de que todo o conteúdo foi distribuído" },
      { value: "priority", label: "Priorizar matérias e tópicos mais importantes" },
      { value: "progress", label: "Enxergar progresso e manter a constância" }
    ]
  }
];

const stages: Stage[] = ["Perfil", "Diagnóstico", "Plano"];
const annualCheckout = "https://pay.cakto.com.br/377yac9";

export default function QuizPage() {
  const [view, setView] = useState<QuizView>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [salesHref, setSalesHref] = useState("/");
  const [annualHref, setAnnualHref] = useState(annualCheckout);

  const question = questions[currentIndex];
  const result = useMemo(() => buildResult(answers), [answers]);
  const currentStage = view === "profile-insight" ? "Perfil" : view === "diagnosis-insight" ? "Diagnóstico" : view === "commitment" || view === "loading" ? "Plano" : question.stage;
  const progress = view === "profile-insight" ? 30 : view === "diagnosis-insight" ? 70 : view === "commitment" ? 94 : view === "loading" ? 98 : ((currentIndex + 1) / questions.length) * 90;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("utm_source")) params.set("utm_source", "quiz");
    if (!params.has("utm_medium")) params.set("utm_medium", "diagnostico");
    params.set("utm_content", "resultado_quiz");
    setSalesHref(`/?${params.toString()}`);

    const checkout = new URL(annualCheckout);
    params.forEach((value, key) => checkout.searchParams.set(key, value));
    setAnnualHref(checkout.toString());
  }, []);

  useEffect(() => {
    if (view !== "loading") return;

    setLoadingStep(0);
    const timers = [
      window.setTimeout(() => setLoadingStep(1), 650),
      window.setTimeout(() => setLoadingStep(2), 1300),
      window.setTimeout(() => setLoadingStep(3), 1950),
      window.setTimeout(() => setView("result"), 2800)
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [view]);

  function selectAnswer(value: string) {
    if (isTransitioning) return;
    setAnswers((current) => ({ ...current, [question.id]: value }));
    setIsTransitioning(true);

    window.setTimeout(() => {
      if (currentIndex === 2) {
        setView("profile-insight");
      } else if (currentIndex === 6) {
        setView("diagnosis-insight");
      } else if (currentIndex === questions.length - 1) {
        setView("commitment");
      } else {
        setCurrentIndex((index) => index + 1);
      }
      setIsTransitioning(false);
    }, 280);
  }

  function continueFromInsight() {
    if (view === "profile-insight") {
      setCurrentIndex(3);
      setView("questions");
    } else {
      setCurrentIndex(7);
      setView("questions");
    }
  }

  function completeCommitment(value: string) {
    setAnswers((current) => ({ ...current, support: value }));
    setView("loading");
  }

  function goBack() {
    if (view === "profile-insight") {
      setCurrentIndex(2);
      setView("questions");
      return;
    }
    if (view === "diagnosis-insight") {
      setCurrentIndex(6);
      setView("questions");
      return;
    }
    if (view === "commitment") {
      setCurrentIndex(9);
      setView("questions");
      return;
    }
    if (currentIndex === 0) {
      setView("intro");
      return;
    }
    setCurrentIndex((index) => index - 1);
  }

  return (
    <main className="quiz-page">
      <header className="quiz-header">
        <Link className="quiz-brand" href="/">
          <img src="/plano-tracker.png" alt="" aria-hidden="true" />
          <strong>PlanoTracker</strong>
        </Link>
        {view !== "intro" && view !== "result" ? <span>{Math.round(progress)}% concluído</span> : <span>Diagnóstico de estudos</span>}
      </header>

      {view === "intro" ? <QuizIntro onStart={() => setView("questions")} /> : null}
      {view === "result" ? <QuizResult answers={answers} result={result} salesHref={salesHref} annualHref={annualHref} /> : null}

      {view === "questions" ? (
        <section className="quiz-workspace">
          <QuizProgress currentStage={currentStage} progress={progress} />

          <div className={`quiz-question-shell ${isTransitioning ? "is-transitioning" : ""}`}>
            <button className="quiz-back" type="button" onClick={goBack}>
              <ArrowLeft size={18} /> Voltar
            </button>
            <div className="quiz-question-copy">
              <p className="quiz-eyebrow">{question.eyebrow}</p>
              <h1>{question.title}</h1>
              <p>{question.subtitle}</p>
            </div>

            <div className="quiz-options" role="radiogroup" aria-label={question.title}>
              {question.options.map((option) => {
                const selected = answers[question.id] === option.value;
                return (
                  <button
                    className={`quiz-option ${selected ? "selected" : ""}`}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    key={option.value}
                    disabled={isTransitioning}
                    onClick={() => selectAnswer(option.value)}
                  >
                    <span className="quiz-option-check">{selected ? <Check size={17} /> : null}</span>
                    <span>
                      <strong>{option.label}</strong>
                      {option.detail ? <small>{option.detail}</small> : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="quiz-auto-hint">Selecione uma resposta para continuar automaticamente.</p>
          </div>
        </section>
      ) : null}

      {view === "profile-insight" ? (
        <QuizCheckpoint currentStage="Perfil" progress={progress} onBack={goBack}>
          <ProfileInsight answers={answers} onContinue={continueFromInsight} />
        </QuizCheckpoint>
      ) : null}

      {view === "diagnosis-insight" ? (
        <QuizCheckpoint currentStage="Diagnóstico" progress={progress} onBack={goBack}>
          <DiagnosisInsight answers={answers} onContinue={continueFromInsight} />
        </QuizCheckpoint>
      ) : null}

      {view === "commitment" ? (
        <QuizCheckpoint currentStage="Plano" progress={progress} onBack={goBack}>
          <CommitmentStep answers={answers} onChoose={completeCommitment} />
        </QuizCheckpoint>
      ) : null}

      {view === "loading" ? <AnalysisLoading answers={answers} activeStep={loadingStep} /> : null}
    </main>
  );
}

function QuizIntro({ onStart }: { onStart: () => void }) {
  return (
    <section className="quiz-intro">
      <div className="quiz-intro-copy">
        <p className="quiz-kicker"><Sparkles size={17} /> Diagnóstico personalizado</p>
        <h1>O que está impedindo seu plano de estudos de funcionar?</h1>
        <p className="quiz-intro-lead">
          Responda algumas perguntas sobre sua prova, sua rotina e seu método atual. No final, você recebe uma leitura objetiva do seu principal gargalo e dos próximos passos mais úteis.
        </p>
        <div className="quiz-trust-row">
          <span><Clock3 size={18} /> Cerca de 2 minutos</span>
          <span><ShieldCheck size={18} /> Sem cadastro</span>
          <span><Target size={18} /> Resultado baseado nas respostas</span>
        </div>
        <button className="quiz-start" type="button" onClick={onStart}>
          Começar diagnóstico <ArrowRight size={20} />
        </button>
        <small>Não é uma avaliação psicológica nem uma promessa de aprovação.</small>
      </div>

      <div className="quiz-intro-visual" aria-label="Etapas do diagnóstico">
        <div className="quiz-visual-header">
          <img src="/plano-tracker.png" alt="" aria-hidden="true" />
          <div><span>Seu diagnóstico</span><strong>Plano de estudo viável</strong></div>
        </div>
        <div className="quiz-visual-step active"><span>01</span><div><strong>Perfil</strong><small>Objetivo, prazo e tempo disponível</small></div><Check size={18} /></div>
        <div className="quiz-visual-step"><span>02</span><div><strong>Diagnóstico</strong><small>Gargalos de clareza e constância</small></div><BrainCircuit size={18} /></div>
        <div className="quiz-visual-step"><span>03</span><div><strong>Plano</strong><small>Rotina e método mais adequados</small></div><CalendarClock size={18} /></div>
        <div className="quiz-visual-note"><ListChecks size={20} /><span>Um plano útil transforma conteúdo em próximas ações claras.</span></div>
      </div>
    </section>
  );
}

function QuizProgress({ currentStage, progress }: { currentStage: Stage; progress: number }) {
  return (
    <div className="quiz-progress-area">
      <div className="quiz-stages">
        {stages.map((stage, index) => {
          const activeIndex = stages.indexOf(currentStage);
          return <span className={index === activeIndex ? "active" : index < activeIndex ? "done" : ""} key={stage}>{index + 1}. {stage}</span>;
        })}
      </div>
      <div className="quiz-progress-track"><div style={{ width: `${progress}%` }} /></div>
    </div>
  );
}

function QuizCheckpoint({
  currentStage,
  progress,
  onBack,
  children
}: {
  currentStage: Stage;
  progress: number;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="quiz-workspace quiz-checkpoint-workspace">
      <QuizProgress currentStage={currentStage} progress={progress} />
      <div className="quiz-checkpoint-shell">
        <button className="quiz-back" type="button" onClick={onBack}><ArrowLeft size={18} /> Voltar</button>
        {children}
      </div>
    </section>
  );
}

function ProfileInsight({ answers, onContinue }: { answers: Answers; onContinue: () => void }) {
  return (
    <div className="quiz-insight-content">
      <div className="quiz-insight-icon"><Route size={28} /></div>
      <p className="quiz-eyebrow">Seu perfil começou a tomar forma</p>
      <h1>Seu cronograma precisa respeitar o prazo sem inventar horas que você não tem.</h1>
      <p className="quiz-insight-lead">
        Para {goalLabel(answers.goal).toLowerCase()}, com {timeContextLabel(answers.time)}, a distribuição do conteúdo deve ser {deadlinePlanLabel(answers.deadline)}, sempre deixando margem para a rotina real.
      </p>

      <div className="quiz-insight-summary">
        <div><Target size={19} /><span>Objetivo</span><strong>{goalLabel(answers.goal)}</strong></div>
        <div><Clock3 size={19} /><span>Disponibilidade</span><strong>{timeLabel(answers.time)}</strong></div>
        <div><CalendarRange size={19} /><span>Ritmo necessário</span><strong>{deadlineRhythmLabel(answers.deadline)}</strong></div>
      </div>

      {answers.goal === "concurso" ? <CompetitionEvidence /> : <LearningEvidence />}

      <button className="quiz-continue" type="button" onClick={onContinue}>Continuar para o diagnóstico <ArrowRight size={19} /></button>
    </div>
  );
}

function DiagnosisInsight({ answers, onContinue }: { answers: Answers; onContinue: () => void }) {
  const load = decisionLoad(answers);

  return (
    <div className="quiz-insight-content">
      <div className="quiz-insight-icon diagnostic"><BrainCircuit size={28} /></div>
      <p className="quiz-eyebrow">Leitura parcial das suas respostas</p>
      <h1>Seu principal ponto de atrito: {blockerLabel(answers.blocker).toLowerCase()}.</h1>
      <p className="quiz-insight-lead">{blockerInsight(answers.blocker)} {consistencyInsight(answers.consistency)}</p>

      <div className="quiz-decision-meter">
        <div><span>Carga de decisões antes de estudar</span><strong>{load.label}</strong></div>
        <div className="quiz-decision-track"><span style={{ width: `${load.width}%` }} /></div>
        <small>Indicador deste diagnóstico, calculado a partir das suas respostas sobre planejamento, clareza e imprevistos.</small>
      </div>

      <div className="quiz-answer-signals">
        <span><CheckCircle2 size={17} /> Método atual: {planningLabel(answers.planning)}</span>
        <span><CheckCircle2 size={17} /> Clareza diária: {clarityLabel(answers.clarity)}</span>
        <span><CheckCircle2 size={17} /> Reação a imprevistos: {consistencyLabel(answers.consistency)}</span>
      </div>

      <button className="quiz-continue" type="button" onClick={onContinue}>Montar o formato do meu plano <ArrowRight size={19} /></button>
    </div>
  );
}

function CommitmentStep({ answers, onChoose }: { answers: Answers; onChoose: (value: string) => void }) {
  return (
    <div className="quiz-insight-content commitment-content">
      <div className="quiz-insight-icon plan"><CalendarClock size={28} /></div>
      <p className="quiz-eyebrow">Seu plano possível já tem forma</p>
      <h1>Ele precisa caber na sua rotina e continuar útil quando a semana mudar.</h1>

      <div className="quiz-plan-preview">
        <div><span>Quando</span><strong>{routineLabel(answers.routine)}</strong></div>
        <div><span>Como</span><strong>{balanceLabel(answers.balance)}</strong></div>
        <div><span>Para quê</span><strong>{outcomeLabel(answers.outcome)}</strong></div>
      </div>

      <div className="quiz-commitment-question">
        <h2>Para você realmente usar esse plano, o que ele mais precisa oferecer?</h2>
        <p>Escolha o tipo de apoio que combina melhor com seu jeito de estudar.</p>
      </div>
      <div className="quiz-options">
        <button className="quiz-option" type="button" onClick={() => onChoose("direction")}>
          <span className="quiz-option-check"><Route size={15} /></span>
          <span><strong>Uma sequência pronta para seguir</strong><small>Quero reduzir decisões e começar com clareza.</small></span>
        </button>
        <button className="quiz-option" type="button" onClick={() => onChoose("flexibility")}>
          <span className="quiz-option-check"><SlidersHorizontal size={15} /></span>
          <span><strong>Flexibilidade para ajustar sem recomeçar</strong><small>Minha rotina muda e o calendário precisa acompanhar.</small></span>
        </button>
        <button className="quiz-option" type="button" onClick={() => onChoose("both")}>
          <span className="quiz-option-check"><Check size={15} /></span>
          <span><strong>Direção pronta e liberdade para editar</strong><small>Quero uma base organizada que continue sendo minha.</small></span>
        </button>
      </div>
    </div>
  );
}

function AnalysisLoading({ answers, activeStep }: { answers: Answers; activeStep: number }) {
  const steps = [
    { label: "Cruzando objetivo e prazo", value: `${goalLabel(answers.goal)} · ${deadlineRhythmLabel(answers.deadline)}` },
    { label: "Identificando o principal gargalo", value: blockerLabel(answers.blocker) },
    { label: "Ajustando ao tempo disponível", value: timeLabel(answers.time) },
    { label: "Montando sua recomendação", value: `${routineLabel(answers.routine)} · ${balanceLabel(answers.balance)}` }
  ];

  return (
    <section className="quiz-analysis" aria-live="polite">
      <div className="quiz-analysis-card">
        <div className="quiz-analysis-loader"><LoaderCircle size={34} /></div>
        <p className="quiz-eyebrow">Analisando suas respostas</p>
        <h1>Montando seu diagnóstico personalizado.</h1>
        <p>Organizando o que você contou sobre prova, rotina e método atual.</p>
        <div className="quiz-analysis-steps">
          {steps.map((step, index) => (
            <div className={index < activeStep ? "done" : index === activeStep ? "active" : ""} key={step.label}>
              <span>{index < activeStep ? <Check size={17} /> : index + 1}</span>
              <div><strong>{step.label}</strong><small>{step.value}</small></div>
            </div>
          ))}
        </div>
        <small>Nenhuma resposta é enviada ou salva.</small>
      </div>
    </section>
  );
}

function CompetitionEvidence() {
  return (
    <aside className="quiz-evidence-inline">
      <FileText size={22} />
      <div>
        <strong>A concorrência é concreta.</strong>
        <p>O primeiro CPNU registrou 2,1 milhões de inscritos para 6.640 vagas. Organização não garante aprovação, mas ajuda a executar o que está sob seu controle.</p>
        <a href="https://www.gov.br/gestao/pt-br/assuntos/noticias/2024/agosto/com-cerca-de-1-milhao-de-participantes-concurso-nacional-unificado-se-torna-a-maior-selecao-publica-da-historia-do-pais/" target="_blank" rel="noreferrer">Fonte: Ministério da Gestão <ExternalLink size={14} /></a>
      </div>
    </aside>
  );
}

function LearningEvidence() {
  return (
    <aside className="quiz-evidence-inline learning-evidence">
      <BookOpenCheck size={22} />
      <div>
        <strong>Distribuir o estudo faz diferença.</strong>
        <p>Uma meta-análise de 2025, com mais de 3 mil participantes, encontrou efeito moderado a favor da prática distribuída em comparação com o estudo concentrado.</p>
        <a href="https://pubmed.ncbi.nlm.nih.gov/40564553/" target="_blank" rel="noreferrer">Consultar estudo no PubMed <ExternalLink size={14} /></a>
      </div>
    </aside>
  );
}

function QuizResult({
  answers,
  result,
  salesHref,
  annualHref
}: {
  answers: Answers;
  result: ReturnType<typeof buildResult>;
  salesHref: string;
  annualHref: string;
}) {
  const load = decisionLoad(answers);

  return (
    <section className="quiz-result">
      <div className="quiz-result-main">
        <p className="quiz-kicker"><Check size={17} /> Diagnóstico concluído</p>
        <h1>{result.title}</h1>
        <p className="quiz-result-lead">{result.summary}</p>

        <div className="quiz-profile-strip">
          <div><span>Objetivo</span><strong>{goalLabel(answers.goal)}</strong></div>
          <div><span>Tempo disponível</span><strong>{timeLabel(answers.time)}</strong></div>
          <div><span>Principal desafio</span><strong>{blockerLabel(answers.blocker)}</strong></div>
        </div>

        <div className="quiz-result-diagnosis">
          <div>
            <span>Carga de decisões antes de estudar</span>
            <strong>{load.label}</strong>
          </div>
          <div className="quiz-decision-track"><span style={{ width: `${load.width}%` }} /></div>
          <p>{supportInsight(answers.support)}</p>
        </div>

        <div className="quiz-recommendations">
          <h2>Seu plano deveria começar por aqui</h2>
          {result.recommendations.map((recommendation, index) => (
            <div key={recommendation}><span>{index + 1}</span><p>{recommendation}</p></div>
          ))}
        </div>

        <aside className="quiz-science-card">
          <BookOpenCheck size={24} />
          <div>
            <strong>Por que distribuir o estudo ao longo do tempo?</strong>
            <p>Uma meta-análise de 2025, com mais de 3 mil participantes, encontrou efeito moderado a favor da prática distribuída em comparação com o estudo concentrado.</p>
            <a href="https://pubmed.ncbi.nlm.nih.gov/40564553/" target="_blank" rel="noreferrer">Consultar estudo no PubMed <ExternalLink size={14} /></a>
          </div>
        </aside>
      </div>

      <aside className="quiz-result-offer">
        <img src="/plano-tracker.png" alt="" aria-hidden="true" />
        <p className="quiz-eyebrow">Seu próximo passo</p>
        <h2>Transforme esse diagnóstico em um calendário executável.</h2>
        <p>O PlanoTracker lê seu edital, distribui matérias e subtópicos até a prova e deixa o plano editável quando a rotina mudar.</p>
        <ul>
          <li><Check size={17} /> Plano criado a partir do seu conteúdo</li>
          <li><Check size={17} /> Rotina, pesos e prazos configuráveis</li>
          <li><Check size={17} /> Calendário e metas editáveis</li>
          <li><Check size={17} /> Acompanhamento de sessões e questões</li>
        </ul>
        <div className="quiz-annual-deal">
          <span><BadgePercent size={17} /> 30% de economia no plano anual</span>
          <div className="quiz-price-before">De R$ 358,80 por ano</div>
          <div className="quiz-price-now"><strong>R$ 249,90</strong><small>/ano</small></div>
          <p>Equivale a R$ 20,82/mês. Você economiza R$ 108,90 no ano.</p>
        </div>

        <a className="quiz-start" href={annualHref}>Quero meu plano anual <ArrowRight size={19} /></a>
        <Link className="quiz-all-plans" href={salesHref}>Ver recursos e outros planos</Link>
        <small>Pagamento processado pela Cakto. Sem promessa de aprovação ou resultado garantido.</small>
      </aside>
    </section>
  );
}

function buildResult(answers: Answers) {
  const score =
    ({ none: 3, generic: 2, stuck: 2, working: 0 }[answers.planning] || 0) +
    ({ always: 3, often: 2, sometimes: 1, rarely: 0 }[answers.clarity] || 0) +
    ({ abandon: 3, pile: 2, improvise: 1, adapt: 0 }[answers.consistency] || 0) +
    (answers.deadline === "urgent" ? 1 : 0);

  const title = score >= 7
    ? "Seu maior gargalo é transformar conteúdo em execução diária."
    : score >= 4
      ? "Seu plano existe, mas ainda não protege sua constância."
      : "Sua base está boa; o próximo ganho vem de priorização e acompanhamento.";

  const summary = score >= 7
    ? `Pelas suas respostas, o problema não parece ser falta de vontade. ${blockerInsight(answers.blocker)} Sem uma sequência clara, cada sessão começa com novas decisões e o cronograma perde força.`
    : score >= 4
      ? `Você já possui alguma estrutura, mas ela não se adapta bem ao que acontece na semana. ${blockerInsight(answers.blocker)} O próximo passo é reduzir improvisos e tornar o plano fácil de reajustar.`
      : `Você demonstra clareza maior do que a média sobre como estudar. ${blockerInsight(answers.blocker)} Agora vale concentrar energia em prioridades, revisões e sinais objetivos de progresso.`;

  return {
    title,
    summary,
    recommendations: [
      answers.blocker === "priority"
        ? "Organizar matérias por peso, incidência e domínio atual antes de preencher o calendário."
        : "Quebrar o conteúdo em subtópicos pequenos o suficiente para virar ações de estudo claras.",
      `Distribuir os blocos considerando ${timeContextLabel(answers.time)} e preservar espaço para imprevistos.`,
      answers.balance === "unknown"
        ? "Começar com teoria e questões em conjunto, acompanhando os acertos para ajustar a proporção."
        : balanceRecommendation(answers.balance),
      answers.consistency === "adapt"
        ? "Manter a rotina atual e usar o progresso por matéria para decidir os próximos ajustes."
        : "Replanejar os blocos não realizados sem transformar um dia perdido em uma semana perdida."
    ]
  };
}

function blockerInsight(value?: string) {
  return {
    volume: "O volume do conteúdo está dificultando enxergar avanços concretos.",
    split: "A divisão entre matérias e subtópicos está consumindo energia antes mesmo do estudo.",
    priority: "A falta de prioridade torna matérias diferentes igualmente urgentes.",
    consistency: "O plano atual depende de semanas perfeitas para funcionar.",
    review: "Revisões e questões ainda entram como tarefa extra, não como parte do plano."
  }[value || ""] || "Seu método pode ficar mais claro e adaptável.";
}

function balanceRecommendation(value?: string) {
  return {
    theory: "Reservar mais teoria no início, sem deixar de incluir questões curtas para validar a compreensão.",
    balanced: "Alternar teoria e questões desde o início, usando os erros para orientar revisões.",
    practice: "Priorizar questões e revisões, voltando à teoria nos pontos em que os erros se repetirem."
  }[value || ""] || "Equilibrar teoria, questões e revisão conforme o desempenho.";
}

function goalLabel(value?: string) {
  return {
    concurso: "Concurso público",
    vestibular: "Vestibular ou ENEM",
    oab: "OAB, residência ou certificação",
    faculdade: "Prova acadêmica",
    outro: "Outro objetivo"
  }[value || ""] || "Estudo personalizado";
}

function timeLabel(value?: string) {
  return {
    little: "Até 1 hora por dia",
    some: "De 1 a 2 horas por dia",
    good: "De 2 a 4 horas por dia",
    high: "Mais de 4 horas por dia",
    varies: "Horários variáveis"
  }[value || ""] || "Rotina a definir";
}

function timeContextLabel(value?: string) {
  return {
    little: "uma disponibilidade de até 1 hora por dia",
    some: "uma disponibilidade entre 1 e 2 horas por dia",
    good: "uma disponibilidade entre 2 e 4 horas por dia",
    high: "uma disponibilidade superior a 4 horas por dia",
    varies: "uma rotina com horários muito variáveis"
  }[value || ""] || "uma disponibilidade ainda a definir";
}

function blockerLabel(value?: string) {
  return {
    volume: "Volume de conteúdo",
    split: "Divisão dos subtópicos",
    priority: "Definição de prioridades",
    consistency: "Manter a constância",
    review: "Encaixar revisão e questões"
  }[value || ""] || "Organização do estudo";
}

function deadlinePlanLabel(value?: string) {
  return {
    urgent: "enxuta, prioritária e revisada com frequência",
    short: "objetiva e orientada pelos tópicos mais importantes",
    medium: "progressiva, com ciclos de revisão e questões",
    long: "sustentável, com avanço gradual e revisões espaçadas",
    none: "flexível, com metas periódicas em vez de uma corrida contra a data"
  }[value || ""] || "compatível com seu prazo";
}

function deadlineRhythmLabel(value?: string) {
  return {
    urgent: "Prioridade máxima",
    short: "Ritmo concentrado",
    medium: "Ritmo progressivo",
    long: "Ritmo sustentável",
    none: "Metas por ciclo"
  }[value || ""] || "Ritmo personalizado";
}

function decisionLoad(answers: Answers) {
  const score =
    ({ none: 3, generic: 2, stuck: 2, working: 0 }[answers.planning] || 0) +
    ({ always: 3, often: 2, sometimes: 1, rarely: 0 }[answers.clarity] || 0) +
    ({ abandon: 3, pile: 2, improvise: 1, adapt: 0 }[answers.consistency] || 0);

  if (score >= 7) return { label: "Alta", width: 88 };
  if (score >= 4) return { label: "Moderada", width: 62 };
  return { label: "Controlada", width: 34 };
}

function consistencyInsight(value?: string) {
  return {
    abandon: "Quando um dia falha, o cronograma deixa de orientar e aumenta a sensação de atraso.",
    pile: "Tentar compensar tudo de uma vez cria uma dívida de estudo difícil de sustentar.",
    improvise: "Você consegue reagir, mas ainda gasta tempo remontando a semana manualmente.",
    adapt: "Você já lida bem com imprevistos; vale preservar essa flexibilidade no plano."
  }[value || ""] || "Um plano adaptável reduz o peso dos imprevistos.";
}

function planningLabel(value?: string) {
  return {
    none: "sem plano definido",
    generic: "cronograma genérico",
    stuck: "plano difícil de manter",
    working: "estrutura funcional"
  }[value || ""] || "a definir";
}

function clarityLabel(value?: string) {
  return {
    always: "muito baixa",
    often: "baixa",
    sometimes: "razoável",
    rarely: "alta"
  }[value || ""] || "a definir";
}

function consistencyLabel(value?: string) {
  return {
    abandon: "o ritmo se perde",
    pile: "as tarefas acumulam",
    improvise: "há reorganização manual",
    adapt: "o plano é ajustado"
  }[value || ""] || "a definir";
}

function routineLabel(value?: string) {
  return {
    morning: "Blocos pela manhã",
    day: "Blocos à tarde",
    night: "Blocos à noite",
    mixed: "Horários distribuídos",
    weekend: "Foco no fim de semana"
  }[value || ""] || "Rotina personalizada";
}

function balanceLabel(value?: string) {
  return {
    theory: "Base teórica primeiro",
    balanced: "Teoria e questões juntas",
    practice: "Questões e revisão em foco",
    unknown: "Equilíbrio guiado pelo desempenho"
  }[value || ""] || "Método adaptável";
}

function outcomeLabel(value?: string) {
  return {
    daily: "Clareza diária",
    coverage: "Cobertura do conteúdo",
    priority: "Prioridades bem definidas",
    progress: "Progresso visível"
  }[value || ""] || "Execução consistente";
}

function supportInsight(value?: string) {
  return {
    direction: "Você tende a avançar melhor quando a próxima ação já está definida e há menos decisões para tomar antes de começar.",
    flexibility: "Seu plano precisa aceitar mudanças de rotina sem apagar o progresso nem exigir que você recomece do zero.",
    both: "A combinação mais adequada para você é uma sequência pronta, mas totalmente editável quando a vida real pedir ajustes."
  }[value || ""] || "Seu plano precisa unir clareza e adaptação à rotina real.";
}
