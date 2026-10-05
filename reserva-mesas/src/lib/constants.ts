import type { Occasion, ReservationSource, ReservationStatus, Role } from "./types";

// Erros levantados pelas funções do banco (raise exception '<chave>') -> mensagem amigável.
export const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "Você precisa entrar na sua conta para continuar.",
  not_allowed: "Você não tem permissão para essa ação.",
  not_found: "Não encontramos essa reserva. Confira o código e o telefone.",
  invalid_request: "Não foi possível processar o pedido. Revise os dados e tente de novo.",
  invalid_name: "Informe o nome completo (pelo menos 2 letras).",
  invalid_phone: "Telefone inválido. Use DDD + número, ex.: (11) 98888-7777.",
  invalid_email: "E-mail inválido.",
  invalid_party: "Número de pessoas inválido.",
  invalid_range: "Período inválido.",
  consent_required: "Para reservar, é preciso aceitar a Política de Privacidade.",
  text_too_long: "O texto ficou longo demais. Resuma um pouco, por favor.",
  party_too_large: "Para grupos desse tamanho, fale com a gente pelo WhatsApp ou telefone.",
  date_out_of_range: "Essa data não está aberta para reservas pela internet.",
  outside_hours: "Esse horário não está disponível. Escolha outro horário da lista.",
  too_soon: "Esse horário é muito próximo. Escolha um pouco mais tarde ou ligue para nós.",
  slot_taken: "Esse horário acabou de ser ocupado. Escolha outro, por favor.",
  customer_blocked:
    "Não foi possível concluir a reserva pela internet. Por favor, entre em contato com o restaurante.",
  too_many_active: "Você já tem reservas ativas demais. Cancele uma delas ou fale com a gente.",
  rate_limited: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.",
  duplicate_reservation: "Você já tem uma reserva nesse horário.",
  not_cancellable: "Essa reserva não pode mais ser alterada ou cancelada.",
  not_confirmable: "Essa reserva não pode mais ser confirmada.",
  past_deadline: "O prazo para alterar ou cancelar pela internet já passou. Entre em contato com o restaurante.",
  waitlist_disabled: "A lista de espera não está disponível no momento.",
  no_table: "Não há mesa livre para esse grupo nesse horário.",
  table_unavailable: "Essa mesa está bloqueada ou foi desativada.",
  tables_taken: "As mesas dessa reserva já foram ocupadas. Escolha outra mesa antes de restaurar.",
  invalid_transition: "Essa ação não é possível no status atual da reserva.",
  not_editable: "Essa reserva já foi encerrada e não pode ser editada.",
  reason_required: "Informe o motivo.",
  cannot_change_self: "Você não pode alterar o seu próprio acesso.",
};

function extractMessage(error: unknown): string {
  // Erros do Supabase (PostgrestError) não são instâncias de Error, mas têm
  // uma propriedade "message" com o texto exato do RAISE EXCEPTION do Postgres.
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

/** Mensagens do painel da equipe: o mesmo erro do banco, explicado no contexto de mesa. */
export const STAFF_ERROR_MESSAGES: Record<string, string> = {
  slot_taken: "Essa mesa tem outra reserva nesse horário. Escolha outra mesa.",
  no_table: "Não há mesa livre para esse grupo nesse horário. Escolha as mesas manualmente ou coloque na fila.",
  not_found: "Essa reserva não existe mais (pode ter sido alterada em outro aparelho).",
};

export function friendlyErrorMessage(error: unknown, overrides?: Record<string, string>): string {
  const raw = extractMessage(error);
  const messages = overrides ? { ...ERROR_MESSAGES, ...overrides } : ERROR_MESSAGES;
  // Chave exata primeiro (evita "not_found" casar dentro de outra chave).
  if (messages[raw]) return messages[raw];
  for (const key of Object.keys(messages)) {
    if (raw.includes(key)) return messages[key];
  }
  if (/fetch|network|Failed to fetch/i.test(raw)) {
    return "Sem conexão com o servidor. Verifique sua internet e tente de novo.";
  }
  return "Não foi possível concluir a ação. Tente novamente.";
}

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Aguardando sinal",
  confirmed: "Confirmada",
  seated: "Sentada",
  completed: "Concluída",
  cancelled: "Cancelada",
  no_show: "Faltou",
};

export const SOURCE_LABEL: Record<ReservationSource, string> = {
  site: "Site",
  telefone: "Telefone",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  walk_in: "Sem reserva",
  manual: "Manual",
};

export const OCCASION_LABEL: Record<Occasion, string> = {
  aniversario: "Aniversário",
  casal: "Casal",
  negocios: "Negócios",
  familia: "Família",
  comemoracao: "Comemoração",
  outro: "Outra",
};

export const OCCASION_OPTIONS: { key: Occasion; label: string }[] = [
  { key: "aniversario", label: "Aniversário" },
  { key: "casal", label: "Jantar a dois" },
  { key: "negocios", label: "Negócios" },
  { key: "familia", label: "Família" },
  { key: "comemoracao", label: "Comemoração" },
  { key: "outro", label: "Outra" },
];

export const ROLE_LABEL: Record<Role, string> = {
  client: "Cliente",
  host: "Anfitrião",
  manager: "Gerente",
};

export const CUSTOMER_TAGS = ["VIP", "Frequente", "Imprensa", "Aniversariante", "Alergia", "Acessibilidade"];

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

/** Rotas da equipe / gerência (usadas no proxy de login e no callback). */
export const STAFF_HOME = "/painel";
export const MANAGER_HOME = "/painel/gerencia";
export const CLIENT_HOME = "/minhas-reservas";
