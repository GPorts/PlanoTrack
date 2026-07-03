import Link from "next/link";
import { CalendarCheck, CreditCard, FileText, Sparkles } from "lucide-react";
import { PlanPreview } from "@/components/PlanPreview";
import { demoPlan } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <main className="page">
      <div className="section-title">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 style={{ fontSize: "2.3rem", lineHeight: 1.05 }}>Seu centro de estudos</h1>
          <p className="muted">Esta tela já esta pronta para receber dados do Supabase.</p>
        </div>
        <Link className="button" href="/plans">
          Novo plano <Sparkles size={18} />
        </Link>
      </div>

      <section className="grid">
        <article className="stat">
          <span>Assinatura</span>
          <strong>Ativa</strong>
        </article>
        <article className="stat">
          <span>Planos criados</span>
          <strong>1</strong>
        </article>
        <article className="stat">
          <span>Proxima prova</span>
          <strong>29/08</strong>
        </article>
      </section>

      <section className="grid-2" style={{ marginTop: 18 }}>
        <PlanPreview plan={demoPlan} />
        <aside className="card">
          <h2>Checklist do MVP</h2>
          <p className="muted">Ordem ideal para validar sem gastar demais.</p>
          <table className="table">
            <tbody>
              <tr>
                <td>
                  <FileText size={17} /> Upload de edital
                </td>
                <td>
                  <span className="pill">pronto</span>
                </td>
              </tr>
              <tr>
                <td>
                  <CreditCard size={17} /> Assinaturas Cakto
                </td>
                <td>
                  <span className="pill">preparado</span>
                </td>
              </tr>
              <tr>
                <td>
                  <CalendarCheck size={17} /> Plano por IA
                </td>
                <td>
                  <span className="pill pill-blue">configurado</span>
                </td>
              </tr>
            </tbody>
          </table>
        </aside>
      </section>
    </main>
  );
}
