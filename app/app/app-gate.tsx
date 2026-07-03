"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlanoTrackApp } from "../plano-track-app";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type AccessState = "loading" | "allowed" | "signed-out" | "blocked" | "error";

export function AppGate() {
  const router = useRouter();
  const [state, setState] = useState<AccessState>("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      const supabase = createBrowserSupabaseClient();
      if (!supabase) {
        if (active) setState("error");
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const userEmail = data.session?.user.email || "";

      if (!token) {
        if (active) setState("signed-out");
        return;
      }

      setEmail(userEmail);

      await fetch("/api/auth/link-subscription", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const response = await fetch("/api/auth/access", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const access = await response.json();

      if (!active) return;
      setState(access.active ? "allowed" : "blocked");
    }

    checkAccess().catch(() => {
      if (active) setState("error");
    });

    const supabase = createBrowserSupabaseClient();
    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setState("signed-out");
        router.refresh();
      }
    });

    return () => {
      active = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, [router]);

  if (state === "allowed") return <PlanoTrackApp />;

  return (
    <main className="page">
      <section className="card access-card">
        {state === "loading" ? (
          <>
            <p className="eyebrow">Validando acesso</p>
            <h1>Conferindo sua assinatura...</h1>
            <p className="muted">Isso leva apenas alguns segundos.</p>
          </>
        ) : null}

        {state === "signed-out" ? (
          <>
            <p className="eyebrow">Acesso necessario</p>
            <h1>Entre para acessar o PlanoTrack</h1>
            <p className="muted">Use o mesmo e-mail informado na compra.</p>
            <Link className="button" href="/login">
              Entrar
            </Link>
          </>
        ) : null}

        {state === "blocked" ? (
          <>
            <p className="eyebrow">Assinatura nao encontrada</p>
            <h1>Seu acesso ainda nao foi liberado</h1>
            <p className="muted">
              Nao encontramos uma assinatura ativa para {email || "este e-mail"}. Se voce acabou de comprar, confirme se
              criou a conta com o mesmo e-mail usado no checkout.
            </p>
            <Link className="button" href="/#pricing">
              Ver planos
            </Link>
          </>
        ) : null}

        {state === "error" ? (
          <>
            <p className="eyebrow">Erro de configuracao</p>
            <h1>Nao foi possivel validar o acesso</h1>
            <p className="muted">Confira as variaveis do Supabase na Vercel e tente novamente.</p>
          </>
        ) : null}
      </section>
    </main>
  );
}
