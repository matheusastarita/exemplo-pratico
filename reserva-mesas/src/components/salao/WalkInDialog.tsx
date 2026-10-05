"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PartyStepper } from "@/components/salao/PartyStepper";
import { TablePicker } from "@/components/salao/TablePicker";
import { CheckCircleIcon, ClockIcon } from "@/components/icons";
import { formatDuration, maskPhoneInput, normalizePhoneBR } from "@/lib/format";
import { friendlyErrorMessage, STAFF_ERROR_MESSAGES } from "@/lib/constants";
import type { TableStatus } from "@/lib/salao";
import type { HostDay, WalkinOptions } from "@/lib/types";

/** "Chegou sem reserva": nº de pessoas -> tem mesa agora ou entra na fila. */
export function WalkInDialog({
  open,
  onClose,
  day,
  statuses,
  presetTableId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  day: HostDay;
  statuses: Map<string, TableStatus>;
  presetTableId?: string | null;
  onDone: (message: string) => void;
}) {
  const [party, setParty] = useState(2);
  const [options, setOptions] = useState<WalkinOptions | null>(null);
  const [checking, setChecking] = useState(false);
  const [picking, setPicking] = useState(Boolean(presetTableId));
  const [chosen, setChosen] = useState<string[]>(presetTableId ? [presetTableId] : []);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setParty(2);
    setOptions(null);
    setPicking(false);
    setChosen([]);
    setName("");
    setPhone("");
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function check(n = party) {
    setChecking(true);
    setError(null);
    const { data, error: rpcError } = await createClient().rpc("walkin_options", { p_party_size: n });
    setChecking(false);
    if (rpcError || !data) return setError(friendlyErrorMessage(rpcError, STAFF_ERROR_MESSAGES));
    setOptions(data);
    if (data.available) setChosen(data.table_ids);
  }

  async function seat(tableIds: string[]) {
    if (phone && !normalizePhoneBR(phone)) return setError("Celular inválido. Use DDD + número, ou deixe em branco.");
    setSaving(true);
    setError(null);
    const { data, error: rpcError } = await createClient().rpc("create_walkin", {
      p_party_size: party,
      p_name: name.trim() || null,
      p_phone: phone || null,
      p_table_ids: tableIds,
    });
    setSaving(false);
    if (rpcError || !data) return setError(friendlyErrorMessage(rpcError, STAFF_ERROR_MESSAGES));
    onDone(`${party} ${party === 1 ? "pessoa sentada" : "pessoas sentadas"} na mesa ${data.labels}.`);
    close();
  }

  async function enqueue() {
    if (name.trim().length < 2) return setError("Informe o nome para chamar na fila.");
    if (phone && !normalizePhoneBR(phone)) return setError("Celular inválido. Use DDD + número, ou deixe em branco.");
    setSaving(true);
    setError(null);
    const { error: rpcError } = await createClient().rpc("waitlist_add_staff", {
      p_party_size: party,
      p_name: name.trim(),
      p_phone: phone || null,
      p_quoted_wait_minutes: options && !options.available ? options.wait_minutes : null,
    });
    setSaving(false);
    if (rpcError) return setError(friendlyErrorMessage(rpcError, STAFF_ERROR_MESSAGES));
    onDone(`${name.trim()} entrou na fila de espera.`);
    close();
  }

  const contactFields = (
    <div className="grid grid-cols-1 gap-3">
      <Input id="walkin-name" label="Nome" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      <Input
        id="walkin-phone"
        label="Celular (opcional)"
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
        autoComplete="off"
      />
    </div>
  );

  return (
    <Modal open={open} onClose={close} title="Chegou sem reserva" description="Quantas pessoas?">
      <div className="flex flex-col gap-5">
        <PartyStepper
          value={party}
          onChange={(n) => {
            setParty(n);
            setOptions(null);
            if (!presetTableId) setChosen([]);
          }}
        />

        {picking ? (
          <>
            <TablePicker day={day} statuses={statuses} party={party} selected={chosen} onChange={setChosen} />
            {contactFields}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <Button size="lg" disabled={saving || chosen.length === 0} onClick={() => seat(chosen)}>
              {saving ? "Sentando..." : "Sentar agora"}
            </Button>
          </>
        ) : !options ? (
          <>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <Button size="lg" onClick={() => check()} disabled={checking}>
              {checking ? "Procurando mesa..." : "Ver mesa livre"}
            </Button>
          </>
        ) : options.available ? (
          <>
            <div className="flex items-start gap-3 rounded-control bg-status-confirmed-bg p-4 text-status-confirmed" role="status">
              <CheckCircleIcon size={22} className="shrink-0" />
              <div>
                <p className="text-lg font-semibold">Tem mesa agora: mesa {options.labels}</p>
                <p className="text-sm">
                  {options.seats} lugares · permanência prevista de {formatDuration(options.duration_minutes)}
                </p>
              </div>
            </div>
            {contactFields}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-col gap-2">
              <Button size="lg" disabled={saving} onClick={() => seat(options.table_ids)}>
                {saving ? "Sentando..." : `Sentar na mesa ${options.labels}`}
              </Button>
              <Button variant="ghost" onClick={() => setPicking(true)}>
                Escolher outra mesa
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 rounded-control bg-status-pending-bg p-4 text-status-pending" role="status">
              <ClockIcon size={22} className="shrink-0" />
              <div>
                <p className="text-lg font-semibold">
                  {options.wait_minutes !== null
                    ? `Sem mesa agora — espera de ~${formatDuration(options.wait_minutes)}`
                    : "Sem mesa nas próximas 3 horas"}
                </p>
                <p className="text-sm">
                  {options.queue_ahead > 0
                    ? `${options.queue_ahead} ${options.queue_ahead === 1 ? "grupo" : "grupos"} na fila antes.`
                    : "Ninguém na fila antes."}
                </p>
              </div>
            </div>
            {contactFields}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-col gap-2">
              <Button size="lg" disabled={saving} onClick={enqueue}>
                {saving ? "Salvando..." : "Colocar na fila"}
              </Button>
              <Button variant="ghost" onClick={() => setPicking(true)}>
                Juntar mesas / escolher manualmente
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
