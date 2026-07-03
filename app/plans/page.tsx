import { Sparkles } from "lucide-react";
import { PlanCreator } from "./plan-creator";

export default function PlansPage() {
  return (
    <main className="page">
      <div className="section-title">
        <div>
          <p className="eyebrow">Criar plano</p>
          <h1 style={{ fontSize: "2.3rem", lineHeight: 1.05 }}>Monte uma rota de estudo</h1>
          <p className="muted">Anexe ou cole o edital para gerar planos ilimitados com IA.</p>
        </div>
        <span className="pill">
          <Sparkles size={15} /> IA inclusa
        </span>
      </div>
      <PlanCreator />
    </main>
  );
}
