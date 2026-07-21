import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PlanoTracker",
    short_name: "PlanoTracker",
    description: "Sua rota adaptativa de estudos até a prova.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f4f7f2",
    theme_color: "#087c68",
    lang: "pt-BR",
    icons: [{ src: "/plano-tracker.png", sizes: "1536x1536", type: "image/png", purpose: "maskable" }]
  };
}
