"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type Mode = "signin" | "signup";

const savedEmailKey = "planotracker:last-email";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(savedEmailKey);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail) {
      window.localStorage.setItem(savedEmailKey, normalizedEmail);
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setLoading(false);
      setMessage("Supabase ainda não está configurado.");
      return;
    }

    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
        : await supabase.auth.signUp({ email: normalizedEmail, password });

    if (result.error) {
      setLoading(false);
      setMessage(result.error.message);
      return;
    }

    const session = result.data.session || (await supabase.auth.getSession()).data.session;
    if (session?.access_token) {
      await fetch("/api/auth/link-subscription", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
    }

    setLoading(false);
    router.push("/app");
    router.refresh();
  }

  return (
    <form className="card form login-card" onSubmit={submit}>
      <div className="login-card-copy">
        <h1>{mode === "signin" ? "Bem-vindo de volta" : "Criar sua conta"}</h1>
        <p>
          {mode === "signin"
            ? "Acesse seu painel de estudos e continue sua organização."
            : "Crie seu acesso para entrar no painel e montar seus planos de estudo."}
        </p>
      </div>

      <div className="auth-tabs" aria-label="Tipo de acesso">
        <button className={mode === "signin" ? "active" : ""} type="button" onClick={() => setMode("signin")}>
          Entrar
        </button>
        <button className={mode === "signup" ? "active" : ""} type="button" onClick={() => setMode("signup")}>
          Criar conta
        </button>
      </div>

      <label className="field">
        E-mail
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="você@email.com"
          autoComplete="email"
          required
        />
      </label>
      <label className="field">
        Senha
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="********"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          minLength={6}
          required
        />
      </label>

      {message ? <div className="notice">{message}</div> : null}

      <button className="button" type="submit" disabled={loading}>
        {loading ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
      </button>
    </form>
  );
}
