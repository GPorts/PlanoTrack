"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

type FormState = "idle" | "sending" | "success" | "error";

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);

    setState("sending");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.get("name"),
          email: fields.get("email"),
          message: fields.get("message"),
          website: fields.get("website")
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setState("error");
        setMessage(data.error || "Não foi possível enviar a mensagem.");
        return;
      }

      form.reset();
      setState("success");
      setMessage("Mensagem enviada. Obrigado por falar com a gente!");
    } catch {
      setState("error");
      setMessage("Não foi possível conectar. Verifique sua internet e tente novamente.");
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <label>
        Nome
        <input name="name" type="text" autoComplete="name" maxLength={80} placeholder="Como podemos chamar você?" required />
      </label>
      <label>
        E-mail
        <input name="email" type="email" autoComplete="email" maxLength={254} placeholder="voce@email.com" required />
      </label>
      <label>
        Mensagem
        <textarea name="message" minLength={10} maxLength={2000} rows={6} placeholder="Conte sua dúvida, sugestão ou feedback..." required />
      </label>
      <label className="contact-honeypot" aria-hidden="true">
        Site
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>
      {message ? (
        <div className={`contact-form-message ${state}`} role="status">
          {state === "success" ? <CheckCircle2 size={18} /> : null}
          {message}
        </div>
      ) : null}
      <button className="sales-button" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Enviando..." : <>Enviar mensagem <Send size={18} /></>}
      </button>
    </form>
  );
}
