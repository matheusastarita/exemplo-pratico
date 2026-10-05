import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { brandCssVariables } from "@/lib/brand";
import { getPublicInfo } from "@/lib/restaurant";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Serifada só nos títulos de destaque (nome do restaurante, cabeçalhos do cliente).
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export async function generateMetadata(): Promise<Metadata> {
  const { info } = await getPublicInfo();
  return {
    title: { default: `${info.name} — Reservas`, template: `%s · ${info.name}` },
    description: info.tagline
      ? `${info.tagline} Reserve sua mesa online.`
      : `Reserve sua mesa no ${info.name}.`,
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { info } = await getPublicInfo();
  return { themeColor: info.primary_color, width: "device-width", initialScale: 1 };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { info } = await getPublicInfo();
  // A cor da marca vem do banco: trocar em Configurações repinta todas as telas.
  const brandStyle = brandCssVariables(info.primary_color) as CSSProperties;

  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${playfair.variable}`}
      style={brandStyle}
    >
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
