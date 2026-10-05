"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { CheckIcon } from "@/components/icons";
import { formatWeekdayDateShort, weekdayOf } from "@/lib/dates";
import { maskPhoneInput, normalizePhoneBR, peopleLabel } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/constants";
import type { PublicInfo } from "@/lib/types";

/** Lista de espera pela página pública (quando o dia escolhido está lotado). */
export function WaitlistForm({
  info,
  date,
  party,
  prefill,
  onCancel,
}: {
  info: PublicInfo;
  date: string;
  party: number;
  prefill: { name: string; phone: string; email: string };
  onCancel: () => void;
}) {
  const shifts = useMemo(() => info.shifts.filter((s) => s.weekday === weekdayOf(date)), [info.shifts, date]);
  const [name, setName] = useState(prefill.name);
  const [phone, setPhone] = useState(prefill.phone);
  const [shiftName, setShiftName] = useState<string>(shifts[shifts.length - 1]?.name ?? "");
  const [privacy, setPrivacy] = useState(false);
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<number | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Informe seu nome.");
    if (!normalizePhoneBR(phone)) return setError("Celular inválido. Use DDD + número.");
    if (!privacy) return setError("Aceite a Política de Privacidade para entrar na lista.");

    const shift = shifts.find((s) => s.name === shiftName);
    setLoading(true);
    const { data, error: rpcError } = await createClient().rpc("join_waitlist_public", {
      p_date: date,
      p_party_size: party,
      p_name: name.trim(),
      p_phone: phone,
      p_preferred_from: shift?.open_time ?? null,
      p_preferred_to: shift?.last_seating_time ?? null,
      p_privacy_consent: privacy,
      p_email: prefill.email || null,
      p_website: website || null,
    });
    setLoading(false);
    if (rpcError || !data) return setError(friendlyErrorMessage(rpcError));
    setPosition(data.position);
  }

  if (position !== null) {
    return (
      <div className="rounded-control border border-status-confirmed/20 bg-status-confirmed-bg p-5" role="status">
        <p className="flex items-center gap-2 font-semibold text-status-confirmed">
          <CheckIcon size={18} /> Você está na lista de espera
        </p>
        <p className="mt-1 text-sm text-stone-700">
          {peopleLabel(party)} em {formatWeekdayDateShort(date).toLowerCase()}
          {shiftName ? ` (${shiftName.toLowerCase()})` : ""}. Você é o nº {position} da fila. Se uma mesa
          abrir, avisamos pelo WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-control border border-stone-200 bg-stone-50 p-4" noValidate>
      <div>
        <p className="font-semibold text-stone-900">Lista de espera</p>
        <p className="mt-0.5 text-sm text-stone-600">
          {peopleLabel(party)} · {formatWeekdayDateShort(date)}
        </p>
      </div>
      <Input id="wl-name" label="Nome" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        id="wl-phone"
        label="Celular (WhatsApp)"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={phone}
        onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
      />
      {shifts.length > 1 && (
        <Select id="wl-shift" label="Turno de preferência" value={shiftName} onChange={(e) => setShiftName(e.target.value)}>
          {shifts.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name} ({s.open_time} às {s.last_seating_time})
            </option>
          ))}
        </Select>
      )}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="wl-website">Site</label>
        <input id="wl-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <Checkbox
        id="wl-privacy"
        checked={privacy}
        onChange={(e) => setPrivacy(e.target.checked)}
        label={
          <>
            Aceito a{" "}
            <Link href="/privacidade" target="_blank" className="font-medium text-brand-ink underline">
              Política de Privacidade
            </Link>{" "}
            e autorizo o contato pelo WhatsApp sobre esta vaga.
          </>
        }
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={loading} className="sm:flex-1">
          {loading ? "Enviando..." : "Entrar na lista"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Voltar
        </Button>
      </div>
    </form>
  );
}
