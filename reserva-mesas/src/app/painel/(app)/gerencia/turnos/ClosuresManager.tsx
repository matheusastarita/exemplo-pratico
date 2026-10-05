"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast, useToast } from "@/components/ui/Toast";
import { AlertIcon, TrashIcon } from "@/components/icons";
import { friendlyErrorMessage } from "@/lib/constants";
import { formatWeekdayDate, weekdayOf } from "@/lib/dates";
import { pluralize } from "@/lib/format";
import type { ClosureRow, ShiftRow } from "@/lib/types";

const hhmm = (t: string) => t.slice(0, 5);

/** Reservas ainda de pé no dia (ou no turno) fechado: não são canceladas sozinhas. */
async function countAffected(closure: Pick<ClosureRow, "date" | "shift_id">, shifts: ShiftRow[]): Promise<number> {
  let query = createClient()
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("date", closure.date)
    .in("status", ["pending", "confirmed"]);
  const shift = shifts.find((s) => s.id === closure.shift_id);
  if (shift) query = query.gte("start_time", shift.open_time).lte("start_time", shift.last_seating_time);
  const { count } = await query;
  return count ?? 0;
}

export function ClosuresManager({
  initialClosures,
  shifts,
  today,
}: {
  initialClosures: ClosureRow[];
  shifts: ShiftRow[];
  today: string;
}) {
  const [closures, setClosures] = useState(initialClosures);
  const [affected, setAffected] = useState<Record<string, number>>({});
  const [date, setDate] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast, show, clear } = useToast();

  const sorted = useMemo(() => [...closures].sort((a, b) => a.date.localeCompare(b.date)), [closures]);
  const dayShifts = date
    ? shifts.filter((s) => s.weekday === weekdayOf(date)).sort((a, b) => a.open_time.localeCompare(b.open_time))
    : [];

  // Quantas reservas cada fechamento atinge (para avisar a equipe)
  useEffect(() => {
    let cancelled = false;
    Promise.all(initialClosures.map(async (c) => [c.id, await countAffected(c, shifts)] as const)).then((pairs) => {
      if (!cancelled) setAffected(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
  }, [initialClosures, shifts]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return setError("Escolha a data.");
    if (date < today) return setError("Escolha hoje ou uma data futura.");
    const sameDay = closures.filter((c) => c.date === date);
    if (sameDay.some((c) => c.shift_id === null)) return setError("Esse dia já está fechado inteiro.");
    if (shiftId && sameDay.some((c) => c.shift_id === shiftId)) return setError("Esse turno já está fechado nesse dia.");
    setSaving(true);
    setError(null);
    const { data, error: e2 } = await createClient()
      .from("closures")
      .insert({ date, shift_id: shiftId || null, reason: reason.trim() || null })
      .select()
      .single();
    setSaving(false);
    if (e2 || !data) return setError(e2 ? friendlyErrorMessage(e2) : "Não foi possível salvar.");
    const row = data as ClosureRow;
    setClosures((list) => [...list, row]);
    const n = await countAffected(row, shifts);
    setAffected((m) => ({ ...m, [row.id]: n }));
    setDate("");
    setShiftId("");
    setReason("");
    show(
      n > 0
        ? `Fechado. Atenção: ${pluralize(n, "reserva já marcada continua", "reservas já marcadas continuam")} de pé — avise os clientes.`
        : "Fechado. O site já não oferece horários nesse período."
    );
  }

  async function remove(c: ClosureRow) {
    const { error: e } = await createClient().from("closures").delete().eq("id", c.id);
    if (e) return show(friendlyErrorMessage(e), "error");
    setClosures((list) => list.filter((x) => x.id !== c.id));
    show("Fechamento removido. Os horários voltaram a aparecer no site.");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <form onSubmit={add} noValidate className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Fechar um dia ou um turno</h2>
            <p className="mt-1 text-sm text-stone-600">Feriado, evento fechado, manutenção. O site deixa de oferecer horários na hora.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)]">
            <Input
              id="c-date"
              label="Data"
              type="date"
              min={today}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setShiftId("");
              }}
            />
            <Select id="c-shift" label="O que fecha" value={shiftId} onChange={(e) => setShiftId(e.target.value)} disabled={!date}>
              <option value="">Dia inteiro</option>
              {dayShifts.map((s) => (
                <option key={s.id} value={s.id}>
                  Só o {s.name.toLowerCase()} ({hhmm(s.open_time)}–{hhmm(s.close_time)})
                </option>
              ))}
            </Select>
            <Input
              id="c-reason"
              label="Motivo (opcional)"
              value={reason}
              maxLength={120}
              placeholder="Ex.: Feriado de Natal"
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Fechar"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">Próximos fechamentos</h2>
        {sorted.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Nenhum dia fechado daqui pra frente.</p>
        ) : (
          <ul className="mt-2 divide-y divide-stone-100">
            {sorted.map((c) => {
              const shift = shifts.find((s) => s.id === c.shift_id);
              const n = affected[c.id] ?? 0;
              return (
                <li key={c.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900">
                      {formatWeekdayDate(c.date)} · {shift ? `só o ${shift.name.toLowerCase()}` : "dia inteiro"}
                    </p>
                    {c.reason && <p className="text-sm text-stone-600">{c.reason}</p>}
                    {n > 0 && (
                      <p className="mt-1 flex items-start gap-1.5 text-xs font-medium text-amber-800">
                        <AlertIcon size={14} className="mt-px shrink-0" />
                        <span>
                          {pluralize(n, "reserva marcada", "reservas marcadas")} nesse período.{" "}
                          <Link
                            href={`/painel/gerencia/reservas?de=${c.date}&ate=${c.date}`}
                            className="underline underline-offset-2 hover:text-amber-900"
                          >
                            Ver reservas
                          </Link>
                        </span>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(c)}
                    aria-label={`Remover fechamento de ${formatWeekdayDate(c.date)}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <TrashIcon size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Toast toast={toast} onClose={clear} />
    </div>
  );
}
