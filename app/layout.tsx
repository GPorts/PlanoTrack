import type { Metadata } from "next";
import "./globals.css";
import "./visual-refresh.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://planotrack.vercel.app"),
  title: "PlanoTracker",
  description: "Transforme seu edital em um plano de estudo claro, flexível e acompanhado até a prova.",
  openGraph: {
    title: "PlanoTracker",
    description: "Seu plano de estudo, do edital até a prova.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "PlanoTracker - plano de estudo do edital até a prova" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "PlanoTracker",
    description: "Seu plano de estudo, do edital até a prova.",
    images: ["/og.png"]
  },
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
