import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { archivo, schibsted } from "@/lib/fonts";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Gestão de Instagram e social media em Curitiba`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: site.name,
    title: site.name,
    description: `${site.tagline} Estúdio de social media em Curitiba.`,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0b1b34",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${schibsted.variable}`}>
      <body className="min-h-svh">
        <a
          href="#conteudo"
          className="fixed top-3 left-3 z-[60] -translate-y-24 rounded-full bg-lime px-5 py-3 text-sm font-semibold text-navy transition-transform focus:translate-y-0"
        >
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
