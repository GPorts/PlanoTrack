import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  GraduationCap,
  ListChecks,
  LockKeyhole,
  MessageCircleQuestion,
  ShieldCheck,
  Sparkles,
  Star,
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
    title: "Edital vira plano",
    text: "Cole o edital e a IA separa disciplinas, topicos, pesos e ordem de estudo."
  },
  {
    icon: <CalendarDays size={22} />,
    title: "Cronograma diario",
    text: "Rotina flexivel por data, com teoria, revisao, questoes ou os blocos que fizerem sentido."
  },
  {
    icon: <Target size={22} />,
    title: "Metas por topico",
    text: "Cada subtitulo do edital vira uma meta clara para marcar como feita."
  },
  {
    icon: <Gauge size={22} />,
    title: "Peso das materias",
    text: "Priorize o que mais cai e acompanhe progresso por disciplina."
  },
  {
    icon: <ListChecks size={22} />,
    title: "Questoes e sessoes",
    text: "Registre tempo estudado, quantidade de questoes e taxa de acerto."
  },
  {
    icon: <Sparkles size={22} />,
    title: "Replanejamento simples",
    text: "Ajuste disciplinas, metas e sessoes quando a rotina mudar."
  }
];

const planFeatures = [
  "Planos de estudo ilimitados com IA",
  "Dashboard web completo",
  "Calendario, metas e disciplinas",
  "Organizacao por peso do edital",
  "Registro de sessoes e questoes",
  "Suporte por e-mail"
];

const pricingPlans = [
  {
    name: "Mensal",
    price: "R$ 29,90",
    suffix: "/mes",
    description: "Cobranca mensal recorrente",
    href: checkoutLinks.monthly,
    cta: "Assinar mensal"
  },
  {
    name: "Anual",
    price: "R$ 249,90",
    suffix: "/ano",
    description: "Equivale a R$ 20,82/mes",
    href: checkoutLinks.annual,
    cta: "Assinar anual",
    featured: true,
    badge: "Mais escolhido -30%"
  },
  {
    name: "Trimestral",
    price: "R$ 79,90",
    suffix: "/trim",
    description: "Equivale a R$ 26,63/mes",
    href: checkoutLinks.quarterly,
    cta: "Assinar trimestral"
  }
];

const faqs = [
  {
    question: "Serve apenas para concurso?",
    answer: "Nao. Concurso e o primeiro foco, mas o PlanoTrack tambem funciona para vestibular, OAB, residencia, ENEM e qualquer prova com edital ou lista de conteudos."
  },
  {
    question: "Qual a diferenca entre os planos?",
    answer: "Nenhuma diferenca de recurso. Todos liberam o sistema completo. A diferenca e apenas o preco mensal equivalente."
  },
  {
    question: "Posso editar o plano depois?",
    answer: "Sim. Depois que a IA cria o plano, voce pode alterar disciplinas, metas, prazos, sessoes e progresso manualmente."
  },
  {
    question: "O pagamento e seguro?",
    answer: "Sim. A compra e processada pela Cakto. Depois do pagamento aprovado, o acesso ao PlanoTrack e liberado para usar o sistema."
  }
];

export default function HomePage() {
  return (
    <main className="sales-page">
      <header className="sales-nav">
        <Link className="sales-brand" href="/">
          <span>PT</span>
          <strong>PlanoTrack</strong>
        </Link>
        <nav aria-label="Navegacao da pagina">
          <a href="#features">Recursos</a>
          <a href="#how-it-works">Como funciona</a>
          <a href="#pricing">Planos</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="sales-nav-actions">
          <Link className="sales-login" href="/login">
            Entrar
          </Link>
          <a className="sales-button small" href="#pricing">
            Comecar
          </a>
        </div>
      </header>

      <section className="sales-hero">
        <div className="sales-hero-copy">
          <p className="sales-kicker">
            <Sparkles size={16} /> Planejamento de estudos com IA
          </p>
          <h1>Transforme qualquer edital em um plano de estudo completo.</h1>
          <p className="sales-lead">
            O PlanoTrack organiza disciplinas, subtitulos, pesos, metas e calendario para quem precisa estudar com
            clareza ate o dia da prova.
          </p>
          <div className="sales-actions">
            <a className="sales-button" href="#pricing">
              Escolher plano <ArrowRight size={20} />
            </a>
            <a className="sales-button secondary" href="#how-it-works">
              Ver como funciona
            </a>
          </div>
          <div className="sales-proof-row">
            <span>
              <Star size={16} /> MVP para concurseiros
            </span>
            <span>
              <ShieldCheck size={16} /> Garantia 7 dias
            </span>
            <span>
              <Clock3 size={16} /> Plano em minutos
            </span>
          </div>
        </div>

        <div className="sales-product-shot" aria-label="Previa do PlanoTrack">
          <div className="mock-window">
            <div className="mock-sidebar">
              <strong>PlanoTrack</strong>
              <span>Painel</span>
              <span>Criar plano</span>
              <span>Calendario</span>
              <span>Metas</span>
              <span>Disciplinas</span>
            </div>
            <div className="mock-main">
              <div className="mock-top">
                <div>
                  <small>Planejamento inteligente</small>
                  <strong>Painel</strong>
                </div>
                <button>Nova sessao</button>
              </div>
              <div className="mock-stats">
                <span>Horas estudadas <strong>18h 40min</strong></span>
                <span>Metas concluidas <strong>42/120</strong></span>
              </div>
              <div className="mock-card large">
                <div className="mock-card-head">
                  <strong>Foco de hoje</strong>
                  <small>Ver calendario</small>
                </div>
                <StudyPreview period="Manha" subject="Direito Constitucional" topic="Direitos fundamentais" />
                <StudyPreview period="Tarde" subject="Administrativo" topic="Atos administrativos" />
                <StudyPreview period="Noite" subject="Questoes" topic="Revisao por assunto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sales-section stats-band">
        <div>
          <strong>1 edital</strong>
          <span>entrada inicial</span>
        </div>
        <div>
          <strong>3 blocos</strong>
          <span>rotina flexivel</span>
        </div>
        <div>
          <strong>100%</strong>
          <span>editavel depois da IA</span>
        </div>
        <div>
          <strong>ilimitado</strong>
          <span>nos planos pagos</span>
        </div>
      </section>

      <section className="sales-section" id="features">
        <div className="sales-section-title">
          <p className="sales-kicker">Tudo em um lugar</p>
          <h2>Do edital confuso ao plano executavel.</h2>
          <p>
            A pessoa nao precisa mais ficar quebrando a cabeca para dividir subtitulos, pesos e revisoes. O sistema
            organiza a primeira versao e deixa tudo ajustavel.
          </p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <span>{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sales-section split-section">
        <div>
          <p className="sales-kicker">Sem planilha improvisada</p>
          <h2>O estudo fica dividido por prioridade, data e acao.</h2>
          <p>
            Em vez de uma lista gigante de materias, o aluno recebe um painel com o que estudar hoje, quais topicos
            faltam, quanto ja avancou e onde precisa fazer mais questoes.
          </p>
          <ul className="check-list">
            <li>
              <CheckCircle2 size={20} /> Topicos extraidos do edital
            </li>
            <li>
              <CheckCircle2 size={20} /> Materias com peso e progresso
            </li>
            <li>
              <CheckCircle2 size={20} /> Metas editaveis por prazo
            </li>
            <li>
              <CheckCircle2 size={20} /> Sessoes de estudo e questoes
            </li>
          </ul>
        </div>
        <div className="study-board">
          <div className="board-row header">
            <span>Dia</span>
            <span>Manha</span>
            <span>Tarde</span>
            <span>Noite</span>
          </div>
          {["Segunda", "Terca", "Quarta", "Quinta"].map((day, index) => (
            <div className="board-row" key={day}>
              <strong>{day}</strong>
              <span>{["Penal", "Civil", "Tributario", "Administrativo"][index]}</span>
              <span>{["Processo Penal", "Processo Civil", "Constitucional", "Financeiro"][index]}</span>
              <span>Questoes</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sales-section how-section" id="how-it-works">
        <div className="sales-section-title">
          <p className="sales-kicker">Como funciona</p>
          <h2>3 passos para sair estudando.</h2>
        </div>
        <div className="steps-grid">
          <article>
            <span>1</span>
            <h3>Escolha um plano</h3>
            <p>O aluno assina mensal, trimestral ou anual e cria o acesso ao PlanoTrack.</p>
          </article>
          <article>
            <span>2</span>
            <h3>Cole o edital</h3>
            <p>Informe prova, data, horas por dia e rotina desejada. A IA monta a primeira versao.</p>
          </article>
          <article>
            <span>3</span>
            <h3>Acompanhe o progresso</h3>
            <p>Use painel, calendario, metas, disciplinas e sessoes para manter o estudo visivel.</p>
          </article>
        </div>
      </section>

      <section className="sales-section testimonials-section">
        <div className="sales-section-title">
          <p className="sales-kicker">Para quem vive edital</p>
          <h2>Feito para reduzir a ansiedade antes da prova.</h2>
        </div>
        <div className="testimonial-grid">
          <QuoteCard name="Mariana" role="Concurso municipal" text="Eu sabia as materias, mas nao sabia como quebrar tudo em metas. O plano pronto destravou minha semana." />
          <QuoteCard name="Lucas" role="OAB" text="Gostei porque nao fica preso na IA. Ela cria, mas eu consigo editar tudo do meu jeito." />
          <QuoteCard name="Renata" role="Vestibular" text="O calendario adaptado a minha rotina deixou bem mais facil entender o que fazer em cada dia." />
        </div>
      </section>

      <section className="sales-section pricing-section" id="pricing">
        <div className="sales-section-title">
          <p className="sales-kicker">Planos</p>
          <h2>Escolha o periodo e comece hoje.</h2>
          <p>Todos os planos tem acesso completo. Quanto mais longo, menor o valor mensal equivalente.</p>
        </div>
        <div className="landing-pricing-grid">
          {pricingPlans.map((plan) => (
            <article className={`landing-price-card ${plan.featured ? "featured" : ""}`} key={plan.name}>
              {plan.badge ? <div className="landing-price-badge">{plan.badge}</div> : null}
              <h3>{plan.name}</h3>
              <div className="landing-price">
                <strong>{plan.price}</strong>
                <span>{plan.suffix}</span>
              </div>
              <p>{plan.description}</p>
              <ul>
                {planFeatures.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 size={20} /> {feature}
                  </li>
                ))}
              </ul>
              <Link className={`sales-button ${plan.featured ? "" : "secondary dark"}`} href={plan.href}>
                {plan.cta} <ArrowRight size={20} />
              </Link>
            </article>
          ))}
        </div>
        <div className="trust-row">
          <span>
            <LockKeyhole size={18} /> Pagamento seguro Cakto
          </span>
          <span>
            <ShieldCheck size={18} /> Garantia 7 dias
          </span>
          <span>
            <GraduationCap size={18} /> Planos ilimitados
          </span>
        </div>
      </section>

      <section className="sales-section guarantee-section">
        <ShieldCheck size={34} />
        <div>
          <p className="sales-kicker">Garantia incondicional</p>
          <h2>7 dias para testar com calma.</h2>
          <p>Se o PlanoTrack nao ajudar a organizar seus estudos, voce pode pedir reembolso dentro do periodo de garantia.</p>
        </div>
      </section>

      <section className="sales-section faq-section" id="faq">
        <div className="sales-section-title">
          <p className="sales-kicker">
            <MessageCircleQuestion size={16} /> Perguntas frequentes
          </p>
          <h2>Tirando as principais duvidas.</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <h2>Seu edital nao precisa virar bagunca.</h2>
        <p>Escolha um plano, crie seu acesso e deixe o PlanoTrack montar a primeira rota de estudo.</p>
        <a className="sales-button" href="#pricing">
          Ver planos <ArrowRight size={20} />
        </a>
      </section>

      <footer className="sales-footer">
        <span>© 2026 PlanoTrack</span>
        <nav>
          <Link href="/login">Entrar</Link>
          <a href="#pricing">Planos</a>
          <a href="#faq">FAQ</a>
        </nav>
      </footer>
    </main>
  );
}

function StudyPreview({ period, subject, topic }: { period: string; subject: string; topic: string }) {
  return (
    <div className="study-preview">
      <span>{period}</span>
      <div>
        <strong>{subject}</strong>
        <small>{topic}</small>
      </div>
    </div>
  );
}

function QuoteCard({ name, role, text }: { name: string; role: string; text: string }) {
  return (
    <article className="quote-card">
      <div className="stars">
        <Star size={16} />
        <Star size={16} />
        <Star size={16} />
        <Star size={16} />
        <Star size={16} />
      </div>
      <p>"{text}"</p>
      <strong>{name}</strong>
      <span>{role}</span>
    </article>
  );
}
