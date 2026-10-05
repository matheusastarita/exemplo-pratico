import type { MessageTemplateRow } from "./types";

export type TemplateKind = MessageTemplateRow["kind"];

// Mesmas variáveis que o banco troca em render_message.
export const TEMPLATE_VARIABLES: { token: string; label: string }[] = [
  { token: "{nome}", label: "Primeiro nome" },
  { token: "{data}", label: "Data (dd/mm)" },
  { token: "{hora}", label: "Horário" },
  { token: "{pessoas}", label: "Nº de pessoas" },
  { token: "{codigo}", label: "Código" },
  { token: "{link}", label: "Link da reserva" },
  { token: "{restaurante}", label: "Nome do restaurante" },
  { token: "{endereco}", label: "Endereço" },
];

export const TEMPLATE_INFO: Record<TemplateKind, { title: string; when: string }> = {
  confirmacao: { title: "Confirmação", when: "Assim que a reserva é feita (site, telefone ou equipe)." },
  lembrete_24h: { title: "Lembrete 24 horas antes", when: "Um dia antes, para o cliente confirmar presença." },
  lembrete_2h: { title: "Lembrete 2 horas antes", when: "No dia, duas horas antes do horário." },
  alteracao: { title: "Alteração", when: "Quando data, horário ou número de pessoas mudam." },
  cancelamento: { title: "Cancelamento", when: "Quando o cliente ou o restaurante cancela." },
  lista_espera: { title: "Lista de espera", when: "Quando abre mesa para quem está na fila." },
};

export const TEMPLATE_ORDER: TemplateKind[] = [
  "confirmacao",
  "lembrete_24h",
  "lembrete_2h",
  "alteracao",
  "cancelamento",
  "lista_espera",
];

/** Textos padrão (iguais aos do seed_demo.sql), para o botão "restaurar". */
export const DEFAULT_TEMPLATES: Record<TemplateKind, string> = {
  confirmacao:
    "Olá, {nome}! Sua reserva no {restaurante} está confirmada para {data} às {hora}, {pessoas}. Código: {codigo}. Para ver, alterar ou cancelar: {link}",
  lembrete_24h:
    "Oi, {nome}! Passando para lembrar: amanhã, {data} às {hora}, tem mesa para {pessoas} esperando por você no {restaurante}. Confirme sua presença: {link}",
  lembrete_2h: "{nome}, sua reserva é hoje às {hora}. Até daqui a pouco! Endereço: {endereco}. Se precisar mudar algo: {link}",
  alteracao: "{nome}, sua reserva foi alterada: {data} às {hora}, {pessoas}. Código: {codigo}. Detalhes: {link}",
  cancelamento: "{nome}, sua reserva de {data} às {hora} foi cancelada. Esperamos receber você em breve no {restaurante}.",
  lista_espera:
    "Boa notícia, {nome}! Abriu uma mesa para {pessoas} no {restaurante} em {data}. Responda esta mensagem ou fale com a recepção para garantir o seu lugar.",
};

/** Variáveis escritas errado (ex.: {nme}) — o banco deixaria o texto cru na mensagem. */
export function unknownVariables(body: string): string[] {
  const known = new Set(TEMPLATE_VARIABLES.map((v) => v.token));
  return [...new Set(body.match(/\{[^{}\s]*\}/g) ?? [])].filter((t) => !known.has(t));
}

/** Mesma troca do banco, com dados de exemplo, para a prévia. */
export function renderSample(body: string, sample: Record<string, string>): string {
  return TEMPLATE_VARIABLES.reduce((text, v) => text.split(v.token).join(sample[v.token] ?? v.token), body);
}
