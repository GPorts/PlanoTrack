"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie, ShieldCheck } from "lucide-react";
import {
  MARKETING_CONSENT_KEY,
  initializeMetaPixel,
  revokeMetaPixelConsent,
  trackMetaEvent
} from "@/lib/meta-pixel";

type ConsentState = "prompt" | "granted" | "denied" | null;

export function MetaPixel() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentState>(null);
  const lastTrackedPath = useRef("");

  useEffect(() => {
    const shouldReopen = new URLSearchParams(window.location.search).get("cookies") === "configurar";
    if (shouldReopen) {
      setConsent("prompt");
      return;
    }

    const savedConsent = window.localStorage.getItem(MARKETING_CONSENT_KEY);
    setConsent(savedConsent === "granted" || savedConsent === "denied" ? savedConsent : "prompt");
  }, []);

  useEffect(() => {
    if (consent !== "granted" || lastTrackedPath.current === pathname) return;
    initializeMetaPixel();
    trackMetaEvent("PageView");
    lastTrackedPath.current = pathname;
  }, [consent, pathname]);

  useEffect(() => {
    function trackMarkedElement(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>("[data-meta-event]");
      if (!element?.dataset.metaEvent) return;

      const parameters: Record<string, unknown> = {};
      if (element.dataset.metaContentName) parameters.content_name = element.dataset.metaContentName;
      if (element.dataset.metaPlan) parameters.content_ids = [element.dataset.metaPlan];
      if (element.dataset.metaCurrency) parameters.currency = element.dataset.metaCurrency;
      if (element.dataset.metaValue) parameters.value = Number(element.dataset.metaValue);

      trackMetaEvent(element.dataset.metaEvent, parameters);
    }

    document.addEventListener("click", trackMarkedElement);
    return () => document.removeEventListener("click", trackMarkedElement);
  }, []);

  function chooseConsent(value: "granted" | "denied") {
    window.localStorage.setItem(MARKETING_CONSENT_KEY, value);
    lastTrackedPath.current = "";
    if (value === "denied") revokeMetaPixelConsent();
    setConsent(value);

    if (window.location.search.includes("cookies=configurar")) {
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
    }
  }

  if (consent !== "prompt") return null;

  return (
    <aside className="cookie-consent" role="dialog" aria-label="Preferências de cookies" aria-live="polite">
      <div className="cookie-consent-icon"><Cookie size={23} /></div>
      <div className="cookie-consent-copy">
        <strong>Você escolhe como seus dados são usados</strong>
        <p>
          Usamos cookies necessários para o site funcionar. Com sua autorização, o Pixel da Meta também mede visitas e
          ações para avaliar nossos anúncios. <Link href="/privacidade">Saiba mais</Link>.
        </p>
      </div>
      <div className="cookie-consent-actions">
        <button className="cookie-button secondary" type="button" onClick={() => chooseConsent("denied")}>Recusar</button>
        <button className="cookie-button" type="button" onClick={() => chooseConsent("granted")}>
          <ShieldCheck size={17} /> Aceitar cookies
        </button>
      </div>
    </aside>
  );
}
