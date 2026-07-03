import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-shell" aria-label="Acesso ao PlanoTracker">
        <div className="login-brand">
          <img src="/plano-tracker.png" alt="" aria-hidden="true" />
          <strong>PlanoTracker</strong>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
