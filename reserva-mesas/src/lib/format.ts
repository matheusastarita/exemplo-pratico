export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Só os dígitos de um telefone. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Normaliza para o formato salvo no banco: só dígitos, com DDI 55.
 * "(41) 98888-7777" -> "5541988887777". Devolve null se não parecer um celular/fixo BR.
 */
export function normalizePhoneBR(phone: string): string | null {
  let digits = phoneDigits(phone);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!/^55\d{10,11}$/.test(digits)) return null;
  return digits;
}

/** "5541988887777" ou "41988887777" -> "(41) 98888-7777". */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  let digits = phoneDigits(phone);
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

/** Máscara progressiva pro input de telefone: vai formatando enquanto a pessoa digita. */
export function maskPhoneInput(value: string): string {
  let d = phoneDigits(value);
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Link tel: com DDI. */
export function telHref(phone: string): string {
  const d = phoneDigits(phone);
  return `tel:+${d.startsWith("55") ? d : `55${d}`}`;
}

/** Link do WhatsApp (wa.me) com mensagem opcional. */
export function whatsappHref(phone: string, text?: string): string {
  const d = phoneDigits(phone);
  const base = `https://wa.me/${d.startsWith("55") ? d : `55${d}`}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function peopleLabel(count: number): string {
  return pluralize(count, "pessoa", "pessoas");
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** Primeiro nome, pra saudações curtas. */
export function firstName(fullName: string | null | undefined): string {
  return (fullName ?? "").trim().split(/\s+/)[0] ?? "";
}
