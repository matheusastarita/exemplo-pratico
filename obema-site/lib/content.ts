import {
  CalendarCheck,
  CalendarRange,
  ChartColumn,
  ChartLine,
  Clapperboard,
  Eye,
  MapPin,
  Palette,
  PanelsTopLeft,
  ShieldCheck,
  Smartphone,
  Video,
  type LucideIcon,
} from "lucide-react";

export type Service = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  includes: string[];
  icon: LucideIcon;
};

export const services: Service[] = [
  {
    slug: "gestao-de-instagram",
    title: "Gestão de Instagram",
    summary: "Conta ativa todos os dias, sem você pensar nisso.",
    description:
      "Planejamento do feed e dos stories, publicação nos melhores horários e resposta a comentários e direct. Conta ativa todos os dias, sem você pensar nisso.",
    includes: [
      "Planejamento do feed e dos stories",
      "Publicação nos melhores horários",
      "Resposta a comentários e direct",
    ],
    icon: Smartphone,
  },
  {
    slug: "captacao-de-videos",
    title: "Captação de vídeos",
    summary: "A equipe vai até a sua empresa e grava.",
    description:
      "Nossa equipe vai até a sua empresa gravar bastidores, atendimento, produtos e depoimentos. Material bruto pra várias semanas de conteúdo.",
    includes: [
      "Gravação na sua empresa",
      "Bastidores, atendimento e produtos",
      "Depoimentos de clientes",
    ],
    icon: Video,
  },
  {
    slug: "edicao-de-videos",
    title: "Edição de vídeos",
    summary: "Reels no ritmo certo, pra segurar quem passa o dedo.",
    description:
      "Reels e cortes no ritmo certo, com legenda, trilha e primeiros segundos pensados pra segurar quem está passando o dedo.",
    includes: [
      "Reels e cortes no ritmo certo",
      "Legenda e trilha",
      "Primeiros segundos pensados pra reter",
    ],
    icon: Clapperboard,
  },
  {
    slug: "google-meu-negocio",
    title: "Google Meu Negócio",
    summary: "Aparecer quando pesquisam seu serviço na região.",
    description:
      "Perfil completo: categorias, fotos, horários, produtos e avaliações. Pra aparecer quando pesquisam seu serviço na região.",
    includes: [
      "Categorias, fotos e horários",
      "Produtos e serviços cadastrados",
      "Avaliações organizadas",
    ],
    icon: MapPin,
  },
  {
    slug: "landing-pages",
    title: "Landing pages",
    summary: "Páginas feitas pra uma única ação: virar contato.",
    description:
      "Páginas rápidas e diretas, feitas pra uma única ação: virar visita em contato. Ideais pra campanhas e anúncios.",
    includes: [
      "Página rápida e direta",
      "Uma única ação: virar contato",
      "Pronta pra campanhas e anúncios",
    ],
    icon: PanelsTopLeft,
  },
  {
    slug: "identidade-visual",
    title: "Identidade visual",
    summary: "Sua marca reconhecível no feed, no cartão e na fachada.",
    description:
      "Logo, paleta, tipografia e templates de post. Sua marca reconhecível no feed, no cartão e na fachada.",
    includes: ["Logo e paleta de cores", "Tipografia", "Templates de post"],
    icon: Palette,
  },
  {
    slug: "estrategia-de-conteudo",
    title: "Estratégia de conteúdo",
    summary: "Pilares, calendário e ajuste todo mês.",
    description:
      "Público, pilares de conteúdo e calendário editorial. Todo mês a gente revisa o que funcionou e ajusta.",
    includes: [
      "Público e pilares de conteúdo",
      "Calendário editorial",
      "Revisão mensal do que funcionou",
    ],
    icon: CalendarRange,
  },
  {
    slug: "relatorios-mensais",
    title: "Relatórios mensais",
    summary: "Só o que orienta a próxima decisão.",
    description:
      "Um documento claro com o que importa: seguidores, alcance, salvamentos e contatos gerados. Só o que orienta a próxima decisão.",
    includes: [
      "Seguidores, alcance e salvamentos",
      "Contatos gerados",
      "Leitura do que mudar no mês seguinte",
    ],
    icon: ChartLine,
  },
];

export const marqueeItems = [
  "Identidade visual",
  "Bio e posicionamento",
  "Gestão de Instagram",
  "Captação de vídeo",
  "Edição de vídeo",
  "Google Meu Negócio",
  "Landing pages",
  "Relatório todo mês",
];

export type Principle = { title: string; text: string; icon: LucideIcon };

export const principles: Principle[] = [
  {
    title: "Acompanhamento semanal",
    text: "Toda semana tem alinhamento: o que foi publicado, o que vem e o que os números estão dizendo.",
    icon: CalendarCheck,
  },
  {
    title: "Decisão guiada por número",
    text: "O plano do mês seguinte sai do relatório do mês anterior. Sem achismo, sem repetir o que não funcionou.",
    icon: ChartColumn,
  },
  {
    title: "Transparência total",
    text: "Você vê o mesmo painel que a gente. Nada de relatório maquiado no fim do mês.",
    icon: Eye,
  },
  {
    title: "30 dias de garantia",
    text: "Se no primeiro mês não fizer sentido, encerra sem multa. A gente prefere cliente que quer ficar.",
    icon: ShieldCheck,
  },
];

export const facts = [
  { value: "8 frentes", label: "de serviço, num time só" },
  { value: "Semanal", label: "alinhamento com você" },
  { value: "30 dias", label: "de garantia, sem multa" },
];

export const steps = [
  {
    title: "Conversa de diagnóstico",
    text: "15 a 20 minutos. A gente olha seu perfil e a sua meta.",
  },
  {
    title: "Proposta com escopo e preço",
    text: "Clara, item por item. Sem pacote fechado que você não vai usar.",
  },
  {
    title: "Primeira semana de produção",
    text: "Captação agendada e calendário do primeiro mês na mão.",
  },
  {
    title: "Relatório e ajuste, todo mês",
    text: "O plano do mês seguinte sai do relatório do mês anterior. Você vê o mesmo painel que a gente.",
  },
];

export const testimonials = [
  {
    name: "Valdir",
    company: "VAVÁ Barbearia",
    city: "Curitiba, PR",
    poster: "/media/valdir-poster.jpg",
    video: "/media/valdir.mp4",
  },
  {
    name: "Rodolfo",
    company: null,
    city: "Curitiba, PR",
    poster: "/media/rodolfo-poster.jpg",
    video: "/media/rodolfo.mp4",
  },
  {
    name: "Edson",
    company: null,
    city: "Curitiba, PR",
    poster: "/media/edson-poster.jpg",
    video: "/media/edson.mp4",
  },
];

export const jmCase = {
  name: "Instituto J. Mortensen",
  segment: "Saúde mental e desenvolvimento humano · Curitiba",
  instagram: "https://www.instagram.com/institutojmortensen/",
  handle: "@institutojmortensen",
  lede: "A conta tinha acabado de nascer: sem logo, sem bio, sem feed. A OBEMA deu forma à marca no Instagram antes de qualquer anúncio ir pro ar.",
  quote: "A presença começa a trabalhar pela marca antes da primeira oferta.",
  before: [
    { title: "0 publicações", text: "Feed em branco, nada dizia o que o instituto era." },
    { title: "Bio vazia", text: "Sem descrição e sem link." },
    { title: "Nenhum destaque", text: "Quem chegava não tinha por onde começar." },
  ],
  after: [
    {
      title: "Bio organizada",
      text: "Cada linha cumpre uma função: o que é, a norma (NR-1), a promessa e o convite pra falar com a equipe.",
    },
    {
      title: "Destaques com função",
      text: "Serviços, Sobre nós, Resultados e Depoimentos. Quem chega entende a marca sem rolar o feed.",
    },
    {
      title: "Feed com identidade",
      text: "Um sistema visual verde só: logo, retratos e institucionais que conversam entre si.",
    },
  ],
  deliverables: [
    {
      title: "Identidade visual",
      text: "Logo, paleta e templates de post. A marca fica reconhecível em qualquer lugar: feed, cartão, fachada.",
    },
    {
      title: "Bio e posicionamento",
      text: "Cada linha da bio cumpre uma função: o que é, pra quem é, onde atende e o que fazer em seguida.",
    },
    {
      title: "Destaques com função",
      text: "Serviços, Sobre nós, Resultados e Depoimentos. Quem chega entende a marca sem rolar o feed.",
    },
    {
      title: "Feed com unidade",
      text: "Um sistema visual só. Os posts conversam entre si e passam a ideia de uma empresa organizada.",
    },
  ],
};

export const faq = [
  {
    q: "Quanto custa?",
    a: "Depende do escopo. Depois da conversa de diagnóstico, a gente manda uma proposta clara, item por item, com preço. Sem pacote fechado que você não vai usar.",
  },
  {
    q: "Preciso contratar todos os serviços?",
    a: "Não. Contrate o que precisa agora e amplie quando fizer sentido. Acompanhamento semanal e relatório mensal vêm incluídos em qualquer formato.",
  },
  {
    q: "Tem fidelidade ou multa?",
    a: "Tem 30 dias de garantia: se no primeiro mês não fizer sentido, encerra sem multa. A gente prefere cliente que quer ficar.",
  },
  {
    q: "Em quanto tempo começa?",
    a: "Com a proposta aprovada, a primeira semana já é de produção: captação agendada e calendário do primeiro mês na mão.",
  },
  {
    q: "Como eu acompanho os resultados?",
    a: "Toda semana tem alinhamento. Todo mês, um relatório com seguidores, alcance, salvamentos e contatos gerados. Você vê o mesmo painel que a gente.",
  },
  {
    q: "Quem vai me atender?",
    a: "Os próprios fundadores. Sem camada de gerente de contas entre você e quem produz.",
  },
];
