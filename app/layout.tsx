import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlanoTracker",
  description: "Transforme editais em rotas de estudo executáveis.",
  icons: {
    icon: "/plano-tracker.png",
    shortcut: "/plano-tracker.png",
    apple: "/plano-tracker.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
