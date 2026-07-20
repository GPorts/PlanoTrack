import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Gauge,
  GraduationCap,
  ListChecks,
  LockKeyhole,
  MessageCircleQuestion,
  Newspaper,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Upload
} from "lucide-react";

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
    text: "A IA separa disciplinas e subtópicos e transforma o conteúdo em uma sequência executável."
  },
  {
    icon: <CalendarDays size={22} />,
    number: "02",
    title: "A rotina define o calendário",
    text: "Você informa dias, horários e método. O plano respeita sua disponibilidade real até a prova."
  },
  {
    icon: <Gauge size={22} />,
    number: "03",
    title: "Prioridades ficam visíveis",
    text: "Pesos, quantidade de questões e progresso ajudam a concentrar energia no que mais importa."
  },
  {
    icon: <RefreshCw size={22} />,
    number: "04",
    title: "O plano acompanha a semana",
    text: "Calendário, disciplinas e sessões continuam editáveis quando sua rotina precisar mudar."
  }
];

const planFeatures = [
  "Planos de estudo ilimitados com IA",
  "Dashboard web completo",
  "Calendário, metas e disciplinas",
  "Organização por peso do edital",
  "Registro de sessões e questões",
  "Suporte por e-mail"
];

const pricingPlans = [
  {
    name: "Mensal",
    price: "R$ 29,90",
    suffix: "/mês",
    description: "Cobrança mensal recorrente",
    href: checkoutLinks.monthly,
    cta: "Assinar mensal"
  },
  {
    name: "Anual",
    price: "R$ 249,90",
    suffix: "/ano",
    description: "Equivale a R$ 20,82 por mês",
    href: checkoutLinks.annual,
    cta: "Assinar anual",
    featured: true,
    badge: "30% de economia"
  },
  {
    name: "Trimestral",
    price: "R$ 79,90",
    suffix: "/trimestre",
    description: "Equivale a R$ 26,63 por mês",
    href: checkoutLinks.quarterly,
    cta: "Assinar trimestral"
  }
];

const faqs = [
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
          <a className="sales-button small" href="#pricing">
            Começar agora <ArrowRight size={17} />
          </a>
        </div>
      </header>

      <section className="sales-hero">
        <div className="hero-signal hero-signal-top" aria-hidden="true" />
        <div className="hero-signal hero-signal-bottom" aria-hidden="true" />

        <div className="sales-hero-copy">
          <p className="sales-kicker">
            <SignalBars /> Plano de estudo que cabe na vida real
          </p>
          <h1>Seu plano de estudo, do edital até a prova.</h1>
          <p className="sales-lead">
            A IA organiza matérias, prioridades e sessões na sua rotina. Você abre o painel e sabe o que estudar hoje,
            sem perder o controle quando a semana muda.
          </p>
          <div className="sales-actions">
            <a className="sales-button" href="#pricing">
              Montar meu plano <ArrowRight size={20} />
            </a>
            <Link className="sales-button secondary" href="/quiz">
              Fazer diagnóstico
            </Link>
          </div>
          <div className="sales-proof-row">
            <span>
              <Clock3 size={16} /> Plano em minutos
            </span>
            <span>
              <CheckCircle2 size={16} /> Totalmente editável
            </span>
            <span>
              <ShieldCheck size={16} /> 7 dias de garantia
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
              <strong>PLANO EM ANDAMENTO</strong>
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
                <span className="mock-sync"><i /> Rotina sincronizada</span>
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
        <span><strong>03</strong> Semana distribuída</span>
        <span><strong>04</strong> Progresso visível</span>
      </section>

      <section className="sales-section problem-section" id="features">
        <div className="sales-section-title">
          <p className="sales-kicker"><Target size={16} /> Clareza antes de começar</p>
          <h2>Você não precisa decidir tudo de novo a cada sessão.</h2>
          <p>
            O edital costuma dizer o que será cobrado, mas não como distribuir centenas de tópicos na rotina. O
            PlanoTracker transforma esse volume em próximas ações visíveis.
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
          <h2>Cada bloco tem hora, matéria e intenção.</h2>
          <p>
            Teoria, lei seca, revisão ou questões entram no período definido por você. As cores ajudam a enxergar o
            ritmo sem transformar seu cronograma em uma planilha interminável.
          </p>
          <ul className="check-list">
            <li><CheckCircle2 size={19} /> Dias e períodos configuráveis</li>
            <li><CheckCircle2 size={19} /> Matérias priorizadas por peso</li>
            <li><CheckCircle2 size={19} /> Calendário criado até a véspera da prova</li>
            <li><CheckCircle2 size={19} /> Ajustes manuais sempre disponíveis</li>
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
          <h2>Do arquivo ao primeiro dia de estudo.</h2>
        </div>
        <div className="steps-grid">
          <article><span>01</span><div><h3>Envie o edital</h3><p>Anexe o PDF ou cole o conteúdo programático da sua prova.</p></div></article>
          <article><span>02</span><div><h3>Descreva sua rotina</h3><p>Informe prazo, dias disponíveis e como prefere estudar em cada período.</p></div></article>
          <article><span>03</span><div><h3>Receba sua rota</h3><p>A IA organiza o calendário e você ajusta tudo conforme a vida real.</p></div></article>
        </div>
      </section>

      <section className="sales-section evidence-section">
        <div className="sales-section-title">
          <p className="sales-kicker"><BookOpenCheck size={16} /> Sem promessa mágica</p>
          <h2>Organização não substitui o estudo. Ela ajuda o estudo a acontecer.</h2>
          <p>
            O PlanoTracker não garante aprovação. Ele organiza conteúdo, prazo e rotina para reduzir improvisos e
            tornar o avanço mais fácil de acompanhar.
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
          <p className="sales-kicker"><Sparkles size={16} /> Acesso completo</p>
          <h2>Um único produto. Três formas de assinar.</h2>
          <p>Todos os planos liberam os mesmos recursos e permitem criar planos de estudo ilimitados.</p>
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
              <a className={`sales-button ${plan.featured ? "" : "secondary dark"}`} href={plan.href}>
                {plan.cta} <ArrowRight size={19} />
              </a>
            </article>
          ))}
        </div>
        <div className="trust-row">
          <span><LockKeyhole size={18} /> Pagamento processado pela Cakto</span>
          <span><ShieldCheck size={18} /> 7 dias de garantia</span>
          <span><GraduationCap size={18} /> Planos de estudo ilimitados</span>
        </div>
      </section>

      <section className="sales-section guarantee-section">
        <div className="guarantee-number">07</div>
        <div>
          <p className="sales-kicker">Dias para testar</p>
          <h2>Conheça o PlanoTracker com calma.</h2>
          <p>Se ele não ajudar a organizar seus estudos, você pode pedir reembolso dentro do período de garantia.</p>
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
        <p>Transforme o edital em um plano claro, acompanhe o avanço e ajuste a rota sem começar do zero.</p>
        <a className="sales-button" href="#pricing">Ver planos <ArrowRight size={20} /></a>
      </section>

      <footer className="sales-footer">
        <Link className="sales-brand footer-brand" href="/">
          <img src="/plano-tracker.png" alt="" aria-hidden="true" />
          <strong>PlanoTracker</strong>
        </Link>
        <span>© 2026 PlanoTracker</span>
        <nav>
          <Link href="/login">Entrar</Link>
          <a href="#pricing">Planos</a>
          <Link href="/termos">Termos</Link>
          <Link href="/privacidade">Privacidade</Link>
          <a href="mailto:gustavorossiniports@gmail.com">Suporte</a>
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
