"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlanoTrackerApp } from "../plano-track-app";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { AppAccess } from "@/lib/access";

type AccessState = "loading" | "allowed" | "signed-out" | "blocked" | "error";

export function AppGate() {
  const router = useRouter();
  const [state, setState] = useState<AccessState>("loading");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [accessInfo, setAccessInfo] = useState<AppAccess | null>(null);

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
      const sessionUserId = data.session?.user.id || "";

      if (!token) {
        if (active) setState("signed-out");
        return;
      }

      setEmail(userEmail);
      setUserId(sessionUserId);

      await fetch("/api/auth/link-subscription", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const response = await fetch("/api/auth/access", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const access = await response.json() as AppAccess;

      if (!active) return;
      if (!response.ok) {
        setState("error");
        return;
      }
      setAccessInfo(access);
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

  if (state === "allowed" && accessInfo) return <PlanoTrackerApp userId={userId} access={accessInfo} />;

  return (
    <main className="access-page">
      <div className="access-shell">
        <Link className="access-brand" href="/">
          <img src="/plano-tracker.png" alt="" aria-hidden="true" />
          <div><strong>PlanoTracker</strong><span>Sua rota de estudos</span></div>
        </Link>
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
            <p className="eyebrow">Sua rota começa aqui</p>
            <h1>Entre ou teste o PlanoTracker grátis</h1>
            <p className="muted">Crie sua conta sem cartão e gere um plano completo com IA.</p>
            <Link className="button" href="/login?mode=signup&trial=1">
              Testar grátis por 7 dias
            </Link>
          </>
        ) : null}

        {state === "blocked" ? (
          <>
            <p className="eyebrow">{accessInfo?.trial?.status === "expired" ? "Teste concluído" : "Acesso não encontrado"}</p>
            <h1>{accessInfo?.trial?.status === "expired" ? "Seus 7 dias gratuitos terminaram" : "Seu acesso ainda não foi liberado"}</h1>
            <p className="muted">{accessInfo?.trial?.status === "expired"
              ? "Seu plano e todo o seu histórico continuam salvos. Escolha uma assinatura para retomar de onde parou."
              : `Não encontramos uma assinatura ativa para ${email || "este e-mail"}. Se você acabou de comprar, confirme se usou o mesmo e-mail do checkout.`}
            </p>
            <Link className="button" href="/#pricing">
              Escolher um plano
            </Link>
          </>
        ) : null}

        {state === "error" ? (
          <>
            <p className="eyebrow">Não foi possível conectar</p>
            <h1>Não foi possível validar o acesso</h1>
            <p className="muted">Tente novamente em alguns instantes. Se o problema continuar, entre em contato com o suporte.</p>
          </>
        ) : null}
        </section>
      </div>
    </main>
  );
}
