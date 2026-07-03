import Link from "next/link";
import { CreditCard, ShieldCheck } from "lucide-react";

const plans = [
  {
    name: "Mensal",
    price: "R$ 29,90",
    suffix: "/mês",
    description: "Cobrança mensal recorrente",
    cta: "Assinar mensal",
    href: "https://pay.cakto.com.br/eyeihqu_955621"
  },
  {
    name: "Anual",
    price: "R$ 249,90",
    suffix: "/ano",
    description: "Equivale a R$ 20,82/mês",
    cta: "Assinar anual",
    href: "https://pay.cakto.com.br/377yac9"
  },
  {
    name: "Trimestral",
    price: "R$ 79,90",
    suffix: "/trim",
    description: "Equivale a R$ 26,63/mês",
    cta: "Assinar trimestral",
    href: "https://pay.cakto.com.br/gmnhfte"
  }
];

export default function CheckoutPage() {
  return (
    <main className="page">
      <div className="section-title">
        <div>
          <p className="eyebrow">Planos</p>
          <h1 style={{ fontSize: "2.3rem", lineHeight: 1.05 }}>Assinatura PlanoTracker</h1>
          <p className="muted">Todos os planos liberam criação ilimitada de planos com IA.</p>
        </div>
      </div>

      <section className="grid">
        {plans.map((plan, index) => (
          <article className="card" key={plan.name}>
            <h2>{plan.name}</h2>
            <p className="muted">{plan.description}</p>
            <strong style={{ display: "block", fontSize: "2rem", margin: "14px 0" }}>
              {plan.price} <span style={{ fontSize: "1rem" }}>{plan.suffix}</span>
            </strong>
            <Link className={index === 1 ? "button" : "button-secondary"} href={plan.href}>
              {plan.cta} <CreditCard size={18} />
            </Link>
          </article>
        ))}
      </section>

      <div className="notice" style={{ marginTop: 18 }}>
        <ShieldCheck size={18} /> Quando a Cakto chamar o webhook, o PlanoTracker grava ou atualiza a assinatura no
        Supabase.
      </div>
    </main>
  );
}
