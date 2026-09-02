import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChartSpline,
  Clock3,
  ExternalLink,
  Gauge,
  GraduationCap,
  Layers3,
  ListChecks,
  ListRestart,
  LockKeyhole,
  Mail,
  MessageCircleQuestion,
  Newspaper,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Upload
} from "lucide-react";
import { ContactForm } from "./contact-form";

const checkoutLinks = {
  monthly: "https://pay.cakto.com.br/eyeihqu_955621",
  quarterly: "https://pay.cakto.com.br/gmnhfte",
  annual: "https://pay.cakto.com.br/377yac9"
};

const features = [
  {
    icon: <Upload size={22} />,
    number: "01",
    title: "O edital vira uma rota",
    text: "Envie o PDF ou cole o conteúdo. A IA separa disciplinas e subtópicos e transforma o edital em uma sequência executável até a prova."
  },
  {
    icon: <CalendarDays size={22} />,
    number: "02",
    title: "Cada dia respeita sua disponibilidade",
    text: "Defina quantas horas cabem em cada dia e descreva como prefere estudar. O calendário distribui a carga sem presumir uma rotina padrão."
  },
  {
    icon: <Clock3 size={22} />,
    number: "03",
    title: "A sessão sai do papel",
    text: "Inicie o cronômetro, pause quando precisar e registre tempo real, questões, acertos, dificuldade, confiança e observações."
  },
  {
    icon: <Gauge size={22} />,
    number: "04",
    title: "O painel mostra o risco da rota",
    text: "Compare conteúdo restante, horas disponíveis, aderência e dias até a prova. Saiba se o plano está confortável, apertado ou inviável."
  },
  {
    icon: <ListRestart size={22} />,
    number: "05",
    title: "Atrasos não exigem começar do zero",
    text: "O Modo Recuperação redistribui sessões pendentes nos próximos dias disponíveis e mostra uma prévia antes de aplicar qualquer mudança."
  },
  {
    icon: <Brain size={22} />,
    number: "06",
    title: "Revisões entram na hora certa",
    text: "Seu feedback depois das sessões alimenta uma fila de revisões espaçadas e um mapa de risco por subtópico."
  },
  {
    icon: <ChartSpline size={22} />,
    number: "07",
    title: "Erros e simulados viram informação",
    text: "Registre erros por tipo e resultados de simulados para acompanhar domínio, desempenho por matéria e preparação atual."
  },
  {
    icon: <Layers3 size={22} />,
    number: "08",
    title: "Seus materiais viram prática",
    text: "Gere quizzes e flashcards somente a partir do material enviado, com trechos da fonte e integração ao caderno de erros."
  }
];

const planFeatures = [
  "Planos de estudo ilimitados com IA",
  "Rota adaptativa e Modo Recuperação",
  "Cronômetro e registro completo de sessões",
  "Revisões espaçadas e mapa de risco",
  "Caderno de erros e simulados",
  "Quizzes e flashcards a partir dos seus materiais",
  "Calendário, metas e disciplinas editáveis",
  "Suporte por e-mail"
];

const pricingPlans = [
  {
    name: "Mensal",
    price: "R$ 29,90",
    suffix: "/mês",
    description: "Cobrança mensal recorrente",
    href: checkoutLinks.monthly,
    cta: "Assinar mensal",
    code: "monthly",
    value: 29.9
  },
  {
    name: "Anual",
    price: "R$ 249,90",
    suffix: "/ano",
    description: "Equivale a R$ 20,82 por mês",
    href: checkoutLinks.annual,
    cta: "Assinar anual",
    code: "annual",
    value: 249.9,
    featured: true,
    badge: "30% de economia"
  },
  {
    name: "Trimestral",
    price: "R$ 79,90",
    suffix: "/trimestre",
    description: "Equivale a R$ 26,63 por mês",
    href: checkoutLinks.quarterly,
    cta: "Assinar trimestral",
    code: "quarterly",
    value: 79.9
  }
];

const faqs = [
  {
    question: "Como funciona o teste grátis?",
    answer:
      "Você cria a conta sem cartão e pode gerar um plano completo com IA. Os sete dias começam somente nessa primeira geração. Durante o período, você pode usar o calendário, registrar sessões, editar o plano e explorar os recursos de acompanhamento."
  },
  {
    question: "Serei cobrado automaticamente após os sete dias?",
    answer:
      "Não. O teste não pede cartão e não gera cobrança automática. Ao final, seu plano permanece salvo e você escolhe se quer assinar para continuar usando a plataforma."
  },
  {
    question: "Serve apenas para concurso?",
    answer:
      "Não. Concurso é o primeiro foco, mas o PlanoTracker também funciona para vestibular, OAB, residência, ENEM e qualquer prova com edital ou lista de conteúdos."
  },
  {
    question: "Qual é a diferença entre os planos?",
    answer:
      "Nenhuma diferença de recurso. Todos liberam o sistema completo. A diferença é apenas o período de cobrança e o valor mensal equivalente."
  },
  {
    question: "Posso editar o plano depois?",
    answer:
      "Sim. Depois que a IA cria a primeira versão, você pode alterar o calendário, as disciplinas, os pesos, as metas e registrar suas sessões de estudo."
  },
  {
    question: "Posso estudar quantidades diferentes em cada dia?",
    answer:
      "Sim. Você informa as horas disponíveis em cada dia da semana. Pode, por exemplo, estudar duas horas na segunda, quatro no sábado e deixar outros dias livres."
  },
  {
    question: "O que acontece quando eu atraso uma sessão?",
    answer:
      "O Modo Recuperação encontra novos espaços no calendário e mostra uma prévia da redistribuição. Sessões já concluídas não são alteradas automaticamente."
  },
  {
    question: "Como funcionam as revisões?",
    answer:
      "Depois de uma sessão, você informa se esqueceu o conteúdo ou se ele pareceu difícil, bom ou fácil. Esse feedback ajuda o sistema a priorizar as próximas revisões."
  },
  {
    question: "A IA inventa conteúdo nos quizzes e flashcards?",
    answer:
      "Essa ferramenta é orientada a usar somente o material que você enviar e exibe o trecho de origem em cada resposta. Ainda assim, vale conferir o material gerado antes de estudar."
  },
  {
    question: "O pagamento é seguro?",
    answer:
      "Sim. A compra é processada pela Cakto. Depois da aprovação do pagamento, o acesso é vinculado ao e-mail utilizado no checkout."
  }
];

const weekBlocks = [
  ["subject-green", "subject-coral", "subject-blue"],
  ["subject-lime", "subject-green", "subject-coral"],
  ["subject-blue", "subject-navy", "subject-green"],
  ["subject-coral", "subject-lime", "subject-blue"],
  ["subject-green", "subject-blue", "subject-lime"],
  ["subject-navy", "subject-green"],
  ["subject-soft"]
];

export default function HomePage() {
  return (
    <main className="sales-page">
      <header className="sales-nav">
        <Link className="sales-brand" href="/" aria-label="PlanoTracker, página inicial">
          <img src="/plano-tracker.png" alt="" aria-hidden="true" />
          <strong>PlanoTracker</strong>
        </Link>
        <nav aria-label="Navegação da página">
          <a href="#how-it-works">Como funciona</a>
          <a href="#features">Recursos</a>
          <a href="#pricing">Planos</a>
          <Link href="/quiz">Diagnóstico</Link>
        </nav>
        <div className="sales-nav-actions">
          <Link className="sales-login" href="/login">
            Entrar
          </Link>
          <Link className="sales-button small" href="/login?mode=signup&trial=1">
            Testar grátis <ArrowRight size={17} />
          </Link>
        </div>
      </header>

      <section className="sales-hero">
        <div className="hero-signal hero-signal-top" aria-hidden="true" />
        <div className="hero-signal hero-signal-bottom" aria-hidden="true" />

        <div className="sales-hero-copy">
          <p className="sales-kicker">
            <SignalBars /> 7 dias grátis • sem cartão
          </p>
          <h1>Seu plano de estudo, do edital até a prova.</h1>
          <p className="sales-lead">
            A IA organiza matérias, prioridades e sessões na sua rotina. Depois, o PlanoTracker acompanha o que você
            realmente cumpriu, mostra riscos e ajuda a reorganizar a rota quando a semana muda.
          </p>
          <div className="sales-actions">
            <Link className="sales-button" href="/login?mode=signup&trial=1">
              Testar grátis por 7 dias <ArrowRight size={20} />
            </Link>
            <Link className="sales-button secondary" href="/quiz">
              Fazer diagnóstico
            </Link>
          </div>
          <div className="sales-proof-row">
            <span>
              <Clock3 size={16} /> 7 dias completos
            </span>
            <span>
              <CheckCircle2 size={16} /> 1 plano completo com IA
            </span>
            <span>
              <ShieldCheck size={16} /> Sem cartão ou cobrança automática
            </span>
          </div>

          <div className="hero-metrics" aria-label="Exemplo de acompanhamento">
            <div>
              <span>Hoje</span>
              <strong>3h20</strong>
            </div>
            <div>
              <span>Até a prova</span>
              <strong>68 dias</strong>
            </div>
            <div>
              <span>Progresso</span>
              <strong>42%</strong>
            </div>
          </div>
        </div>

        <div className="sales-product-shot" aria-label="Prévia ilustrativa do painel PlanoTracker">
          <div className="mock-window">
            <div className="mock-titlebar">
              <span className="mock-dots" aria-hidden="true"><i /><i /><i /></span>
              <strong>ROTA EM ANDAMENTO</strong>
              <span>SEMANA 04</span>
            </div>
            <div className="mock-sidebar">
              <img src="/plano-tracker.png" alt="" aria-hidden="true" />
              <span className="mock-nav-active"><CalendarDays size={18} /></span>
              <span><Route size={18} /></span>
              <span><ListChecks size={18} /></span>
              <span><BarChart3 size={18} /></span>
              <small>GP</small>
            </div>
            <div className="mock-main">
              <div className="mock-top">
                <div>
                  <small>Reta final</small>
                  <strong>Minha semana</strong>
                </div>
                <span className="mock-sync"><i /> Rota confortável</span>
              </div>
              <div className="mock-stats">
                <span>Hoje <strong>3h20</strong></span>
                <span>Faltam <strong>68 dias</strong></span>
                <span>Progresso <strong>42%</strong></span>
              </div>
              <div className="mock-content">
                <div className="mock-week-panel">
                  <div className="mock-section-head"><strong>Ritmo da semana</strong><span>20 - 26 JUL</span></div>
                  <div className="mock-week-days">
                    {weekBlocks.map((blocks, index) => (
                      <div className={index === 1 ? "is-today" : ""} key={index}>
                        <span>{["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"][index]}</span>
                        <strong>{20 + index}</strong>
                        <div className="mock-blocks">
                          {blocks.map((block, blockIndex) => <i className={block} key={`${block}-${blockIndex}`} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mock-agenda">
                  <div className="mock-section-head"><strong>Hoje</strong><span>3 SESSÕES</span></div>
                  <StudyPreview tone="green" period="Manhã" subject="Direito Constitucional" topic="Direitos fundamentais" />
                  <StudyPreview tone="coral" period="Tarde" subject="Administrativo" topic="Atos administrativos" />
                  <StudyPreview tone="lime" period="Noite" subject="30 questões" topic="Revisão da matéria" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sales-route-strip" aria-label="Da análise ao acompanhamento">
        <span><strong>01</strong> Edital analisado</span>
        <span><strong>02</strong> Rotina calibrada</span>
        <span><strong>03</strong> Execução medida</span>
        <span><strong>04</strong> Rota ajustada</span>
      </section>

      <section className="sales-section problem-section" id="features">
        <div className="sales-section-title">
          <p className="sales-kicker"><Target size={16} /> Clareza antes de começar</p>
          <h2>Mais do que gerar um cronograma: acompanhar a rota até a prova.</h2>
          <p>
            O edital costuma dizer o que será cobrado, mas não como distribuir centenas de tópicos na rotina. O
            PlanoTracker transforma esse volume em próximas ações, registra sua execução e ajuda a corrigir o caminho.
          </p>
        </div>

        <div className="feature-ledger">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <span className="feature-number">{feature.number}</span>
              <span className="feature-icon">{feature.icon}</span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sales-section split-section">
        <div className="split-copy">
          <p className="sales-kicker"><CalendarDays size={16} /> Uma semana que você entende de relance</p>
          <h2>Planejado e realizado ficam no mesmo lugar.</h2>
          <p>
            Teoria, lei seca, revisão, questões e simulados entram nos períodos definidos por você. Ao estudar, o
            cronômetro e o feedback atualizam seu histórico e deixam o próximo passo mais claro.
          </p>
          <ul className="check-list">
            <li><CheckCircle2 size={19} /> Carga diferente para cada dia da semana</li>
            <li><CheckCircle2 size={19} /> Matérias priorizadas por peso, questões e desempenho</li>
            <li><CheckCircle2 size={19} /> Calendário criado até a véspera da prova</li>
            <li><CheckCircle2 size={19} /> Cronômetro, questões, acertos e observações por sessão</li>
            <li><CheckCircle2 size={19} /> Ajustes manuais e recuperação de atrasos</li>
          </ul>
        </div>

        <div className="study-board" aria-label="Exemplo de uma semana de estudos">
          <div className="board-header">
            <div><small>SEMANA 04</small><strong>20 - 26 JUL</strong></div>
            <span>18h40 planejadas</span>
          </div>
          <div className="board-grid">
            {weekBlocks.map((blocks, index) => (
              <div className={`board-day ${index === 1 ? "active" : ""}`} key={index}>
                <span>{["S", "T", "Q", "Q", "S", "S", "D"][index]}</span>
                <strong>{20 + index}</strong>
                <div>{blocks.map((block, blockIndex) => <i className={block} key={`${block}-${blockIndex}`} />)}</div>
              </div>
            ))}
          </div>
          <div className="board-legend">
            <span><i className="subject-green" /> Base do plano</span>
            <span><i className="subject-coral" /> Prioridade</span>
            <span><i className="subject-blue" /> Questões</span>
            <span><i className="subject-lime" /> Revisão</span>
          </div>
        </div>
      </section>

      <section className="sales-section how-section" id="how-it-works">
        <div className="sales-section-title">
          <p className="sales-kicker"><Route size={16} /> Como funciona</p>
          <h2>Do arquivo a uma rota que acompanha sua execução.</h2>
        </div>
        <div className="steps-grid">
          <article><span>01</span><div><h3>Monte a primeira rota</h3><p>Envie o edital, informe a prova, as horas de cada dia e descreva sua rotina desejada.</p></div></article>
          <article><span>02</span><div><h3>Execute e registre</h3><p>Abra o foco de hoje, use o cronômetro e registre questões, acertos, dificuldade e progresso.</p></div></article>
          <article><span>03</span><div><h3>Ajuste com dados reais</h3><p>Recupere atrasos, revise pontos frágeis e acompanhe o risco da rota sem perder o que já concluiu.</p></div></article>
        </div>
      </section>

      <section className="sales-section trial-offer-section" aria-label="Teste gratuito do PlanoTracker">
        <div className="trial-offer-number">07</div>
        <div className="trial-offer-copy">
          <p className="sales-kicker"><Sparkles size={16} /> Teste antes de assinar</p>
          <h2>Sete dias para colocar seu edital em movimento.</h2>
          <p>
            Crie uma conta sem cartão, gere um plano completo com IA e use a plataforma na sua rotina real. O prazo só
            começa depois que o primeiro plano estiver sendo gerado.
          </p>
          <div className="trial-offer-points">
            <span><CheckCircle2 size={18} /> Sem cobrança automática</span>
            <span><CheckCircle2 size={18} /> Dados preservados ao final</span>
            <span><CheckCircle2 size={18} /> Edite e acompanhe o plano</span>
          </div>
        </div>
        <Link className="sales-button" href="/login?mode=signup&trial=1">
          Começar teste grátis <ArrowRight size={19} />
        </Link>
      </section>

      <section className="sales-section evidence-section">
        <div className="sales-section-title">
          <p className="sales-kicker"><BookOpenCheck size={16} /> Sem promessa mágica</p>
          <h2>Organização não substitui o estudo. Ela ajuda o estudo a acontecer.</h2>
          <p>
            O PlanoTracker não garante aprovação. Ele combina planejamento, execução, revisão e acompanhamento para
            reduzir improvisos e tornar o avanço mais fácil de entender.
          </p>
        </div>
        <div className="evidence-grid">
          <article className="evidence-card">
            <span className="evidence-icon"><Newspaper size={22} /></span>
            <p className="evidence-label">Dados oficiais</p>
            <h3>2,1 milhões de inscritos para 6.640 vagas no primeiro CPNU.</h3>
            <p>A dimensão da seleção mostra por que prioridade e consistência importam em provas concorridas.</p>
            <a href="https://www.gov.br/gestao/pt-br/assuntos/noticias/2024/agosto/com-cerca-de-1-milhao-de-participantes-concurso-nacional-unificado-se-torna-a-maior-selecao-publica-da-historia-do-pais/" target="_blank" rel="noreferrer">
              Ministério da Gestão <ExternalLink size={15} />
            </a>
          </article>
          <article className="evidence-card research">
            <span className="evidence-icon"><BookOpenCheck size={22} /></span>
            <p className="evidence-label">Ciência da aprendizagem</p>
            <h3>Estudar de forma distribuída tende a superar o estudo concentrado.</h3>
            <p>Uma meta-análise de 2025 reuniu mais de 3 mil participantes e encontrou efeito favorável à prática distribuída.</p>
            <a href="https://pubmed.ncbi.nlm.nih.gov/40564553/" target="_blank" rel="noreferrer">
              Consultar no PubMed <ExternalLink size={15} />
            </a>
          </article>
        </div>
      </section>

      <section className="sales-section pricing-section" id="pricing">
        <div className="sales-section-title">
          <p className="sales-kicker"><Sparkles size={16} /> Continue depois do teste</p>
          <h2>Um único produto. Três formas de assinar.</h2>
          <p>Teste por sete dias sem cartão. Se fizer sentido para sua rotina, escolha o período que preferir e continue com planos ilimitados.</p>
        </div>
        <div className="landing-pricing-grid">
          {pricingPlans.map((plan) => (
            <article className={`landing-price-card ${plan.featured ? "featured" : ""}`} key={plan.name}>
              {plan.badge ? <div className="landing-price-badge">{plan.badge}</div> : null}
              <p className="price-period">{plan.name}</p>
              <div className="landing-price"><strong>{plan.price}</strong><span>{plan.suffix}</span></div>
              <p>{plan.description}</p>
              <ul>
                {planFeatures.map((feature) => <li key={feature}><CheckCircle2 size={19} /> {feature}</li>)}
              </ul>
              <a
                className={`sales-button ${plan.featured ? "" : "secondary dark"}`}
                href={plan.href}
                data-meta-custom-event="CheckoutClick"
                data-meta-content-name={`Plano ${plan.name}`}
                data-meta-plan={plan.code}
                data-meta-currency="BRL"
                data-meta-value={plan.value}
              >
                {plan.cta} <ArrowRight size={19} />
              </a>
            </article>
          ))}
        </div>
        <div className="trust-row">
          <span><LockKeyhole size={18} /> Teste sem cartão antes de assinar</span>
          <span><ShieldCheck size={18} /> 7 dias de garantia</span>
          <span><GraduationCap size={18} /> Planos de estudo ilimitados</span>
        </div>
      </section>

      <section className="sales-section guarantee-section">
        <div className="guarantee-number">07</div>
        <div>
          <p className="sales-kicker">Garantia após a assinatura</p>
          <h2>Assine com segurança.</h2>
          <p>Além do teste gratuito, sua compra conta com sete dias de garantia para solicitar reembolso.</p>
        </div>
        <ShieldCheck size={38} />
      </section>

      <section className="sales-section faq-section" id="faq">
        <div className="sales-section-title">
          <p className="sales-kicker"><MessageCircleQuestion size={16} /> Perguntas frequentes</p>
          <h2>Antes de começar.</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details key={faq.question}>
              <summary><span>{String(index + 1).padStart(2, "0")}</span>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <SignalBars />
        <p className="sales-kicker">Sua próxima sessão começa antes de sentar para estudar</p>
        <h2>Abra o painel e saiba qual é o próximo passo.</h2>
        <p>Transforme o edital em uma rota clara e experimente na prática por sete dias, sem cartão.</p>
        <Link className="sales-button" href="/login?mode=signup&trial=1">Testar grátis agora <ArrowRight size={20} /></Link>
      </section>

      <section className="sales-section contact-section" id="contact">
        <div className="contact-copy">
          <p className="sales-kicker"><MessageCircleQuestion size={16} /> Fale com a gente</p>
          <h2>Dúvida, sugestão ou feedback?</h2>
          <p>
            Sua experiência ajuda o PlanoTracker a ficar mais útil para quem está se preparando para uma prova. Envie
            uma mensagem e responderemos pelo e-mail informado.
          </p>
          <a className="contact-email" href="mailto:contato.planotracker@gmail.com">
            <Mail size={19} />
            <span><small>Prefere escrever diretamente?</small><strong>contato.planotracker@gmail.com</strong></span>
          </a>
        </div>
        <ContactForm />
      </section>

      <footer className="sales-footer">
        <Link className="sales-brand footer-brand" href="/">
          <img src="/plano-tracker.png" alt="" aria-hidden="true" />
          <strong>PlanoTracker</strong>
        </Link>
        <span>© 2026 PlanoTracker</span>
        <nav>
          <Link href="/login">Entrar</Link>
          <Link href="/login?mode=signup&trial=1">Teste grátis</Link>
          <a href="#pricing">Planos</a>
          <Link href="/termos">Termos</Link>
          <Link href="/privacidade">Privacidade</Link>
          <a href="#contact">Contato</a>
        </nav>
      </footer>
    </main>
  );
}

function SignalBars() {
  return <span className="signal-bars" aria-hidden="true"><i /><i /><i /></span>;
}

function StudyPreview({
  period,
  subject,
  topic,
  tone
}: {
  period: string;
  subject: string;
  topic: string;
  tone: "green" | "coral" | "lime";
}) {
  return (
    <div className={`study-preview tone-${tone}`}>
      <i aria-hidden="true" />
      <span>{period}</span>
      <div><strong>{subject}</strong><small>{topic}</small></div>
      <CheckCircle2 size={17} />
    </div>
  );
}
