import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-shell" aria-label="Acesso ao PlanoTracker">
        <div className="login-brand">
          <img src="/plano-tracker.png" alt="" aria-hidden="true" />
          <div>
            <strong>PlanoTracker</strong>
            <span>Sua rota de estudos</span>
          </div>
        </div>
        <div className="login-weekmark" aria-hidden="true">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => (
            <span className={index === 1 ? "active" : ""} key={`${day}-${index}`}>
              <small>{day}</small><i />
            </span>
          ))}
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
