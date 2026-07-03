import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="page">
      <section className="grid-2">
        <div>
          <p className="eyebrow">Acesso</p>
          <h1 style={{ fontSize: "2.3rem", lineHeight: 1.05 }}>Entre no PlanoTracker</h1>
          <p className="muted">
            Use o mesmo e-mail informado na compra. Se a assinatura já estiver aprovada, o acesso será liberado
            automaticamente.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
