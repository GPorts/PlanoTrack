export default function LoginPage() {
  return (
    <main className="page">
      <section className="grid-2">
        <div>
          <p className="eyebrow">Acesso</p>
          <h1 style={{ fontSize: "2.3rem", lineHeight: 1.05 }}>Entre no PlanoTrack</h1>
          <p className="muted">
            Na proxima etapa, esta tela usa Supabase Auth com magic link ou email/senha. Por enquanto, serve como
            placeholder visual.
          </p>
        </div>
        <form className="card form">
          <label className="field">
            E-mail
            <input type="email" placeholder="voce@email.com" />
          </label>
          <label className="field">
            Senha
            <input type="password" placeholder="********" />
          </label>
          <button className="button" type="button">
            Entrar em modo demo
          </button>
        </form>
      </section>
    </main>
  );
}
