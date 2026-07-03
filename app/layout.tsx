import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlanoTrack",
  description: "Transforme editais em rotas de estudo executaveis."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
