"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { PartyStepper } from "@/components/salao/PartyStepper";
import { TimeSlots } from "@/components/booking/TimeSlots";
import { SearchIcon } from "@/components/icons";
import { formatDateFull } from "@/lib/dates";
import { formatPhone, maskPhoneInput, normalizePhoneBR, phoneDigits } from "@/lib/format";
import { friendlyErrorMessage, OCCASION_OPTIONS, SOURCE_LABEL, STAFF_ERROR_MESSAGES } from "@/lib/constants";
import type { AvailableSlot, CustomerRow, Occasion, ReservationSource } from "@/lib/types";

type Found = Pick<CustomerRow, "id" | "full_name" | "phone" | "tags" | "allergies" | "blocked">;

const SOURCES: ReservationSource[] = ["telefone", "whatsapp", "instagram", "manual"];

/** Nova reserva lançada pela equipe (telefone/WhatsApp/Instagram) em poucos toques. */
export function NewReservationDialog({
  open,
  onClose,
  defaultDate,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate: string;
  onDone: (message: string) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Found[]>([]);
  const [customer, setCustomer] = useState<Found | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState(2);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState<string | null>(null);
  const [manualTime, setManualTime] = useState("");
  const [source, setSource] = useState<ReservationSource>("telefone");
  const [occasion, setOccasion] = useState<Occasion | "">("");
  const [notes, setNotes] = useState("");
  const [dietary, setDietary] = useState("");
  const [internal, setInternal] = useState("");
  const [slots, setSlots] = useState<{ key: string; list: AvailableSlot[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slotKey = `${date}|${party}`;
  const slotsLoading = slots?.key !== slotKey;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    supabase.rpc("get_available_slots_staff", { p_date: date, p_party_size: party }).then(({ data }) => {
      if (!cancelled) setSlots({ key: `${date}|${party}`, list: data ?? [] });
    });
    return () => {
      cancelled = true;
    };
  }, [open, supabase, date, party]);

  // Busca de cliente existente (nome ou telefone). Caracteres de filtro são removidos.
  useEffect(() => {
    const q = query.trim().replace(/[,()*%\\]/g, "");
    if (q.length < 2 || customer) return;
    let cancelled = false;
    const digits = phoneDigits(q);
    const filter = digits.length >= 4 ? `phone.ilike.%${digits}%` : `full_name.ilike.%${q}%`;
    const timer = setTimeout(() => {
      supabase
        .from("customers")
        .select("id, full_name, phone, tags, allergies, blocked")
        .or(filter)
        .is("anonymized_at", null)
        .order("full_name")
        .limit(6)
        .then(({ data }) => {
          if (!cancelled) setFound((data as Found[] | null) ?? []);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, customer, supabase]);

  function close() {
    setQuery("");
    setFound([]);
    setCustomer(null);
    setName("");
    setPhone("");
    setParty(2);
    setDate(defaultDate);
    setTime(null);
    setManualTime("");
    setSource("telefone");
    setOccasion("");
    setNotes("");
    setDietary("");
    setInternal("");
    setError(null);
    onClose();
  }

  function pick(c: Found) {
    setCustomer(c);
    setName(c.full_name);
    setPhone(c.phone ? maskPhoneInput(c.phone) : "");
    setFound([]);
  }

  async function save() {
    const start = manualTime || time;
    setError(null);
    if (!customer && name.trim().length < 2) return setError("Informe o nome do cliente.");
    if (!customer && !normalizePhoneBR(phone)) return setError("Informe um celular válido (DDD + número).");
    if (!start) return setError("Escolha um horário.");

    setSaving(true);
    const { data, error: rpcError } = await supabase.rpc("create_reservation_staff", {
      p_date: date,
      p_start_time: start,
      p_party_size: party,
      p_name: name.trim(),
      p_phone: phone,
      p_source: source,
      p_occasion: occasion || null,
      p_notes: notes.trim() || null,
      p_internal_notes: internal.trim() || null,
      p_dietary_notes: dietary.trim() || null,
      p_customer_id: customer?.id ?? null,
    });
    setSaving(false);
    if (rpcError || !data) return setError(friendlyErrorMessage(rpcError, STAFF_ERROR_MESSAGES));
    onDone(`Reserva de ${name.split(" ")[0]} lançada: ${start}, ${party} ${party === 1 ? "pessoa" : "pessoas"}. Código ${data.code}.`);
    close();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Nova reserva"
      description="Por telefone, WhatsApp ou Instagram"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Salvando..." : "Lançar reserva"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-stone-900">Cliente</p>
          {customer ? (
            <div className="flex items-center justify-between gap-3 rounded-control border border-brand/30 bg-brand-soft px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-stone-900">{customer.full_name}</p>
                <p className="text-sm text-stone-600">{formatPhone(customer.phone)}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {customer.tags.map((t) => (
                    <Badge key={t} tone="brand">
                      {t}
                    </Badge>
                  ))}
                  {customer.blocked && <Badge tone="no_show">Bloqueado para reservas online</Badge>}
                </div>
                {customer.allergies && <p className="mt-1 text-sm font-medium text-red-700">Alergia: {customer.allergies}</p>}
              </div>
              <button type="button" onClick={() => setCustomer(null)} className="min-h-tap shrink-0 px-2 text-sm font-medium text-brand-ink hover:underline">
                Trocar
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <SearchIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar cliente por nome ou telefone"
                  aria-label="Buscar cliente"
                  className="w-full rounded-control border border-stone-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                />
              </div>
              {found.length > 0 && query.trim().length >= 2 && (
                <ul className="divide-y divide-stone-100 rounded-control border border-stone-200 bg-white">
                  {found.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => pick(c)} className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-stone-50">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-stone-900">{c.full_name}</span>
                          <span className="block text-xs text-stone-500">{formatPhone(c.phone)}</span>
                        </span>
                        {c.tags.includes("VIP") && <Badge tone="brand">VIP</Badge>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid grid-cols-1 gap-3">
                <Input id="nr-name" label="Nome" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
                <Input
                  id="nr-phone"
                  label="Celular"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
                  autoComplete="off"
                />
              </div>
            </>
          )}
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold text-stone-900">Pessoas</p>
          <PartyStepper
            value={party}
            onChange={(n) => {
              setParty(n);
              setTime(null);
            }}
          />
        </section>

        <section className="flex flex-col gap-3">
          <Input
            id="nr-date"
            type="date"
            label="Data"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTime(null);
            }}
          />
          <p className="-mt-1 px-1 text-xs text-stone-500">{date ? formatDateFull(date) : ""}</p>
          <div>
            <p className="mb-2 px-1 text-sm font-medium text-stone-600">Horários com mesa</p>
            {!slotsLoading && (slots?.list.length ?? 0) === 0 ? (
              <p className="rounded-control bg-stone-50 px-4 py-3 text-sm text-stone-600">
                Sem mesa livre para esse grupo nesse dia. Use um horário manual abaixo (o sistema confere a mesa).
              </p>
            ) : (
              <TimeSlots
                slots={slots?.list ?? []}
                loading={slotsLoading}
                selected={manualTime ? null : time}
                onSelect={(t) => {
                  setTime(t);
                  setManualTime("");
                }}
              />
            )}
          </div>
          <Input
            id="nr-manual"
            type="time"
            label="Outro horário (encaixe)"
            value={manualTime}
            onChange={(e) => setManualTime(e.target.value)}
          />
        </section>

        <section className="grid grid-cols-1 gap-3">
          <Select id="nr-source" label="Origem" value={source} onChange={(e) => setSource(e.target.value as ReservationSource)}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABEL[s]}
              </option>
            ))}
          </Select>
          <Select id="nr-occasion" label="Ocasião" value={occasion} onChange={(e) => setOccasion(e.target.value as Occasion | "")}>
            <option value="">Nenhuma</option>
            {OCCASION_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input id="nr-dietary" label="Alergias / restrições" value={dietary} onChange={(e) => setDietary(e.target.value)} />
          <Textarea id="nr-notes" label="Pedido do cliente" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Textarea id="nr-internal" label="Observação interna (só a equipe vê)" rows={2} value={internal} onChange={(e) => setInternal(e.target.value)} />
        </section>

        {error && (
          <p role="alert" className="rounded-control bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
