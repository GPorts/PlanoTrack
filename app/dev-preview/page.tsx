import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { PlanoTrackerApp } from "../plano-track-app";

export default async function DevelopmentPreviewPage() {
  const host = (await headers()).get("host") || "";
  if (!host.startsWith("localhost:") && !host.startsWith("127.0.0.1:") && !host.startsWith("[::1]:")) notFound();
  return <PlanoTrackerApp userId="__preview__" />;
}
