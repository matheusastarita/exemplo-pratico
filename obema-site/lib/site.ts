export const site = {
  name: "OBEMA Marketing",
  shortName: "OBEMA",
  url: "https://obemamarketing.com.br",
  tagline: "Presença digital que vira agenda cheia.",
  description:
    "Estúdio de social media em Curitiba. Gestão de Instagram, vídeo e estratégia num time só, com acompanhamento semanal e relatório de resultado todo mês.",
  city: "Curitiba · PR",
  since: 2023,
  whatsapp: {
    number: "5541988681042",
    display: "+55 41 98868-1042",
  },
  email: "contato@obema.com.br",
  instagram: {
    handle: "@obema.marketing",
    url: "https://www.instagram.com/obema.marketing/",
  },
  founders: [
    { name: "Matheus Astarita", role: "Cofundador" },
    { name: "Benjamin Guimarães", role: "Cofundador" },
  ],
} as const;

export const nav = [
  { href: "/", label: "Início" },
  { href: "/servicos", label: "Serviços" },
  { href: "/cases", label: "Cases" },
  { href: "/#depoimentos", label: "Depoimentos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
] as const;

export function whatsappLink(message = "Oi, quero saber mais sobre a OBEMA") {
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export const diagnosticMessage = "Oi, quero um diagnóstico da OBEMA";
