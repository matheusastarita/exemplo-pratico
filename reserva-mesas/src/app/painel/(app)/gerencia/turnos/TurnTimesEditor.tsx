"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toast, useToast } from "@/components/ui/Toast";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { friendlyErrorMessage } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import type { TurnTimeRow } from "@/lib/types";

const MAX_PARTY = 60;

// Cada faixa guarda só o "até quantas pessoas"; o começo é o fim da anterior + 1.
// A última vale "daí pra cima" (até 60, o maior grupo aceito).
type Row = { upTo: string; minutes: string };

function toRows(list: TurnTimeRow[]): Row[] {
  const sorted = [...list].sort((a, b) => a.party_min - b.party_min);
  if (sorted.length === 0) return [{ upTo: "", minutes: "120" }];
  return sorted.map((r, i) => ({ upTo: i === sorted.length - 1 ? "" : String(r.party_max), minutes: String(r.minutes) }));
}

export function TurnTimesEditor({ initial }: { initial: TurnTimeRow[] }) {
  const [rows, setRows] = useState<Row[]>(() => toRows(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const { toast, show, clear } = useToast();

  const starts = rows.map((_, i) => (i === 0 ? 1 : Number(rows[i - 1].upTo) + 1));

  function update(i: number, patch: Partial<Row>) {
    setRows((list) => list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    setDirty(true);
  }

  function addRow() {
    setRows((list) => {
      const last = list[list.length - 1];
      const prevEnd = list.length > 1 ? Number(list[list.length - 2].upTo) : 0;
      // A última faixa ganha um limite e uma faixa nova vira o "daí pra cima"
      const newUpTo = String(Math.min(MAX_PARTY - 1, prevEnd + 2));
      return [...list.slice(0, -1), { ...last, upTo: newUpTo }, { upTo: "", minutes: String(Number(last.minutes) + 30) }];
    });
    setDirty(true);
  }

  function removeRow(i: number) {
    setRows((list) => {
      const next = list.filter((_, j) => j !== i);
      next[next.length - 1] = { ...next[next.length - 1], upTo: "" };
      return next;
    });
    setDirty(true);
  }

  async function save() {
    const payload: TurnTimeRow[] = [];
    let min = 1;
    for (let i = 0; i < rows.length; i++) {
      const last = i === rows.length - 1;
      const max = last ? MAX_PARTY : Number(rows[i].upTo);
      const minutes = Number(rows[i].minutes);
      if (!last && (!Number.isInteger(max) || max < min || max >= MAX_PARTY)) {
        return setError(`Na faixa ${i + 1}, o "até" precisa ser um número a partir de ${min}.`);
      }
      if (!Number.isInteger(minutes) || minutes < 15 || minutes > 600) {
        return setError(`Na faixa ${i + 1}, use um tempo entre 15 e 600 minutos.`);
      }
      payload.push({ party_min: min, party_max: max, minutes });
      min = max + 1;
    }
    setSaving(true);
    setError(null);
    const { error: e } = await createClient().rpc("save_turn_times", { p_rows: payload });
    setSaving(false);
    if (e) return setError(friendlyErrorMessage(e));
    setDirty(false);
    show("Tempos de permanência salvos. Valem para as próximas reservas.");
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-stone-900">Tempo de permanência por tamanho do grupo</h2>
        <p className="mt-1 text-sm text-stone-600">
          Quanto tempo a mesa fica reservada para cada grupo. Define até quando a mesa fica ocupada e quais horários sobram.
          Reservas já marcadas mantêm o tempo que tinham.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {rows.map((r, i) => {
          const last = i === rows.length - 1;
          const from = starts[i];
          const minutes = Number(r.minutes);
          return (
            <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-control border border-stone-200 bg-white px-3 py-2">
              <span className="min-w-28 text-sm text-stone-700">
                {last ? (
                  <>
                    {Number.isFinite(from) ? from : "?"} pessoas ou mais
                  </>
                ) : (
                  <label className="flex items-center gap-2">
                    <span>
                      {Number.isFinite(from) ? from : "?"} a
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={from}
                      max={MAX_PARTY - 1}
                      value={r.upTo}
                      onChange={(e) => update(i, { upTo: e.target.value })}
                      aria-label={`Faixa ${i + 1}: até quantas pessoas`}
                      className="h-10 w-16 rounded-control border border-stone-200 bg-stone-50/80 px-2 text-center text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                    />
                    <span>pessoas</span>
                  </label>
                )}
              </span>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="number"
                  inputMode="numeric"
                  min={15}
                  max={600}
                  step={5}
                  value={r.minutes}
                  onChange={(e) => update(i, { minutes: e.target.value })}
                  aria-label={`Faixa ${i + 1}: minutos de permanência`}
                  className="h-10 w-20 rounded-control border border-stone-200 bg-stone-50/80 px-2 text-center text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                />
                min
                {Number.isInteger(minutes) && minutes >= 60 && (
                  <span className="text-stone-500">({formatDuration(minutes)})</span>
                )}
              </label>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  aria-label={`Remover faixa ${i + 1}`}
                  className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <TrashIcon size={18} />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={addRow} disabled={rows.length >= 12}>
          <PlusIcon size={16} /> Faixa
        </Button>
        <Button onClick={save} disabled={!dirty || saving}>
          {saving ? "Salvando..." : "Salvar tempos"}
        </Button>
      </div>
      <Toast toast={toast} onClose={clear} />
    </Card>
  );
}
