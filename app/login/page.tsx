import Link from "next/link";
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
        <nav className="login-links" aria-label="Links institucionais">
          <Link href="/">Página inicial</Link>
          <Link href="/termos">Termos de uso</Link>
          <Link href="/privacidade">Privacidade</Link>
        </nav>
      </section>
    </main>
  );
}
