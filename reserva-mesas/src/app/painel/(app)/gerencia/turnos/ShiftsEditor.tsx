"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { Toast, useToast } from "@/components/ui/Toast";
import { PlusIcon } from "@/components/icons";
import { friendlyErrorMessage } from "@/lib/constants";
import { weekdayFullLabel } from "@/lib/dates";
import type { ShiftRow } from "@/lib/types";

type Draft = {
  id?: string;
  name: string;
  open_time: string;
  last_seating_time: string;
  close_time: string;
  max_covers: number | null;
  is_open: boolean;
};

const hhmm = (t: string) => t.slice(0, 5);
const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

// Segunda primeiro: é como o dono de restaurante pensa a semana.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function toDraft(s: ShiftRow): Draft {
  return {
    id: s.id,
    name: s.name,
    open_time: hhmm(s.open_time),
    last_seating_time: hhmm(s.last_seating_time),
    close_time: hhmm(s.close_time),
    max_covers: s.max_covers,
    is_open: s.is_open,
  };
}

/** Sugestão para um turno novo: almoço se o dia ainda não tem, senão jantar. */
function suggestion(day: Draft[]): Draft {
  const hasLunch = day.some((s) => toMinutes(s.open_time) < 16 * 60);
  return hasLunch
    ? { name: "Jantar", open_time: "19:00", last_seating_time: "21:30", close_time: "23:00", max_covers: null, is_open: true }
    : { name: "Almoço", open_time: "12:00", last_seating_time: "14:00", close_time: "15:00", max_covers: null, is_open: true };
}

/** Mesmas regras do banco (save_day_shifts), para avisar antes de enviar. */
function validate(list: Draft[]): string | null {
  for (const s of list) {
    if (!s.name.trim()) return "Dê um nome ao turno (ex.: Almoço, Jantar).";
    if (!s.open_time || !s.last_seating_time || !s.close_time) return "Preencha os três horários.";
    if (!(s.open_time < s.last_seating_time && s.last_seating_time <= s.close_time)) {
      return "O turno abre antes da última entrada, e a última entrada vem antes (ou junto) do fechamento.";
    }
    if (s.max_covers !== null && (!Number.isInteger(s.max_covers) || s.max_covers < 1)) {
      return "O limite de pessoas precisa ser um número maior que zero.";
    }
  }
  const open = list.filter((s) => s.is_open);
  for (let i = 0; i < open.length; i++) {
    for (let j = i + 1; j < open.length; j++) {
      if (open[i].open_time < open[j].close_time && open[j].open_time < open[i].close_time) {
        return `Os turnos ${open[i].name} e ${open[j].name} estão se cruzando. Ajuste os horários.`;
      }
    }
  }
  return null;
}

export function ShiftsEditor({ initialShifts, slotStep }: { initialShifts: ShiftRow[]; slotStep: number }) {
  const supabase = useMemo(() => createClient(), []);
  const [shifts, setShifts] = useState(initialShifts);
  const [editing, setEditing] = useState<{ weekday: number; index: number | null } | null>(null);
  const [copyFrom, setCopyFrom] = useState<number | null>(null);
  const [busyDay, setBusyDay] = useState<number | null>(null);
  const { toast, show, clear } = useToast();

  const dayList = (weekday: number): Draft[] =>
    shifts
      .filter((s) => s.weekday === weekday)
      .sort((a, b) => a.open_time.localeCompare(b.open_time))
      .map(toDraft);

  async function saveDay(weekday: number, list: Draft[]): Promise<string | null> {
    const problem = validate(list);
    if (problem) return problem;
    setBusyDay(weekday);
    const { error } = await supabase.rpc("save_day_shifts", {
      p_weekday: weekday,
      p_shifts: list.map((s) => ({ ...s, id: s.id ?? null, name: s.name.trim() })),
    });
    if (error) {
      setBusyDay(null);
      return friendlyErrorMessage(error);
    }
    const { data } = await supabase.from("shifts").select("*").eq("weekday", weekday);
    setShifts((prev) => [...prev.filter((s) => s.weekday !== weekday), ...((data ?? []) as ShiftRow[])]);
    setBusyDay(null);
    return null;
  }

  async function toggleDay(weekday: number, open: boolean) {
    const list = dayList(weekday);
    if (open && list.length === 0) {
      setEditing({ weekday, index: null });
      return;
    }
    const problem = await saveDay(
      weekday,
      list.map((s) => ({ ...s, is_open: open }))
    );
    if (problem) show(problem, "error");
    else show(`${weekdayFullLabel(weekday)}: ${open ? "aberto" : "fechado"}. Os horários do site já foram atualizados.`);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-stone-600">
        O site oferece horários de entrada a cada {slotStep} minutos, da abertura até a última entrada de cada turno.
        Feriados e eventos ficam na aba Fechamentos.
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        {WEEK_ORDER.map((weekday) => {
          const list = dayList(weekday);
          const open = list.some((s) => s.is_open);
          return (
            <Card key={weekday} padding="sm" className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3 px-1">
                <h3 className="font-semibold text-stone-900">{weekdayFullLabel(weekday)}</h3>
                <Switch
                  checked={open}
                  disabled={busyDay === weekday}
                  onChange={(v) => toggleDay(weekday, v)}
                  label={open ? "Aberto" : "Fechado"}
                />
              </div>

              {list.length === 0 && <p className="px-1 pb-1 text-sm text-stone-500">Fechado o dia todo.</p>}
              <ul className="divide-y divide-stone-100">
                {list.map((s, index) => (
                  <li key={s.id ?? index} className="flex items-center justify-between gap-3 px-1 py-2">
                    <div className={`min-w-0 ${s.is_open ? "" : "opacity-60"}`}>
                      <p className="text-sm font-medium text-stone-900">
                        {s.name}{" "}
                        <span className="font-normal tabular-nums text-stone-600">
                          {s.open_time}–{s.close_time}
                        </span>
                        {!s.is_open && <span className="font-normal text-stone-500"> · fechado</span>}
                      </p>
                      <p className="text-xs text-stone-500">
                        Entradas até {s.last_seating_time}
                        {s.max_covers ? ` · até ${s.max_covers} pessoas ao mesmo tempo` : ""}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setEditing({ weekday, index })}>
                      Editar
                    </Button>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-1">
                {list.length < 4 && (
                  <Button variant="ghost" size="sm" onClick={() => setEditing({ weekday, index: null })}>
                    <PlusIcon size={16} /> Turno
                  </Button>
                )}
                {list.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setCopyFrom(weekday)}>
                    Copiar para outros dias
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <ShiftDialog
        state={editing}
        list={editing ? dayList(editing.weekday) : []}
        onClose={() => setEditing(null)}
        onSave={async (list, message) => {
          if (!editing) return null;
          const problem = await saveDay(editing.weekday, list);
          if (!problem) {
            setEditing(null);
            show(message);
          }
          return problem;
        }}
      />

      <CopyDialog
        from={copyFrom}
        dayList={dayList}
        onClose={() => setCopyFrom(null)}
        onCopy={async (targets) => {
          if (copyFrom === null) return;
          const source = dayList(copyFrom);
          for (const weekday of targets) {
            // Reaproveita o turno de mesmo nome do dia de destino (mantém fechamentos ligados a ele)
            const existing = dayList(weekday);
            const list = source.map((s) => ({
              ...s,
              id: existing.find((e) => e.name.toLowerCase() === s.name.toLowerCase())?.id,
            }));
            const problem = await saveDay(weekday, list);
            if (problem) {
              show(`${weekdayFullLabel(weekday)}: ${problem}`, "error");
              return;
            }
          }
          setCopyFrom(null);
          show(`Turnos de ${weekdayFullLabel(copyFrom).toLowerCase()} copiados para ${targets.length} ${targets.length === 1 ? "dia" : "dias"}.`);
        }}
      />

      <Toast toast={toast} onClose={clear} />
    </div>
  );
}

function ShiftDialog({
  state,
  list,
  onClose,
  onSave,
}: {
  state: { weekday: number; index: number | null } | null;
  list: Draft[];
  onClose: () => void;
  onSave: (list: Draft[], message: string) => Promise<string | null>;
}) {
  const title = state
    ? `${state.index === null ? "Novo turno" : "Editar turno"} · ${weekdayFullLabel(state.weekday)}`
    : "";
  return (
    <Modal open={state !== null} onClose={onClose} title={title}>
      {state && (
        <ShiftForm
          key={`${state.weekday}-${state.index}`}
          initial={state.index === null ? suggestion(list) : list[state.index]}
          isNew={state.index === null}
          onCancel={onClose}
          onRemove={async () => {
            const next = list.filter((_, i) => i !== state.index);
            return onSave(next, "Turno removido.");
          }}
          onSubmit={async (draft) => {
            const next = state.index === null ? [...list, draft] : list.map((s, i) => (i === state.index ? draft : s));
            return onSave(next, state.index === null ? `Turno ${draft.name} criado.` : `Turno ${draft.name} salvo.`);
          }}
        />
      )}
    </Modal>
  );
}

function ShiftForm({
  initial,
  isNew,
  onCancel,
  onRemove,
  onSubmit,
}: {
  initial: Draft;
  isNew: boolean;
  onCancel: () => void;
  onRemove: () => Promise<string | null>;
  onSubmit: (draft: Draft) => Promise<string | null>;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [covers, setCovers] = useState(initial.max_covers ? String(initial.max_covers) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  async function run(action: () => Promise<string | null>) {
    setSaving(true);
    setError(null);
    const problem = await action();
    setSaving(false);
    if (problem) setError(problem);
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const max_covers = covers.trim() ? Number(covers) : null;
        run(() => onSubmit({ ...draft, name: draft.name.trim(), max_covers }));
      }}
    >
      <Input
        id="s-name"
        label="Nome do turno"
        value={draft.name}
        maxLength={30}
        list="shift-names"
        onChange={(e) => set({ name: e.target.value })}
      />
      <datalist id="shift-names">
        <option value="Almoço" />
        <option value="Jantar" />
        <option value="Brunch" />
        <option value="Café da manhã" />
        <option value="Happy hour" />
      </datalist>
      {/* Campos de horário empilhados no celular (no iPhone, lado a lado eles se sobrepõem) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input id="s-open" label="Abre" type="time" value={draft.open_time} onChange={(e) => set({ open_time: e.target.value })} />
        <Input
          id="s-last"
          label="Última entrada"
          type="time"
          value={draft.last_seating_time}
          onChange={(e) => set({ last_seating_time: e.target.value })}
        />
        <Input id="s-close" label="Fecha" type="time" value={draft.close_time} onChange={(e) => set({ close_time: e.target.value })} />
      </div>
      <Input
        id="s-covers"
        label="Limite de pessoas ao mesmo tempo (opcional)"
        type="number"
        inputMode="numeric"
        min={1}
        value={covers}
        onChange={(e) => setCovers(e.target.value)}
        hint="Ritmo da cozinha: o site para de oferecer horário quando esse número seria passado. Em branco = sem limite."
      />
      <Checkbox
        id="s-open-flag"
        checked={draft.is_open}
        onChange={(e) => set({ is_open: e.target.checked })}
        label="Turno aberto para reservas"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-between gap-2">
        {!isNew ? (
          <Button variant="danger" disabled={saving} onClick={() => run(onRemove)}>
            Remover turno
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function CopyDialog({
  from,
  dayList,
  onClose,
  onCopy,
}: {
  from: number | null;
  dayList: (weekday: number) => Draft[];
  onClose: () => void;
  onCopy: (targets: number[]) => Promise<void>;
}) {
  return (
    <Modal
      open={from !== null}
      onClose={onClose}
      title={from !== null ? `Copiar os turnos de ${weekdayFullLabel(from).toLowerCase()}` : ""}
      description="Os turnos dos dias escolhidos passam a ser iguais a estes."
    >
      {from !== null && <CopyForm key={from} from={from} dayList={dayList} onCancel={onClose} onCopy={onCopy} />}
    </Modal>
  );
}

function CopyForm({
  from,
  dayList,
  onCancel,
  onCopy,
}: {
  from: number;
  dayList: (weekday: number) => Draft[];
  onCancel: () => void;
  onCopy: (targets: number[]) => Promise<void>;
}) {
  const [targets, setTargets] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        {WEEK_ORDER.filter((d) => d !== from).map((d) => {
          const list = dayList(d);
          return (
            <Checkbox
              key={d}
              id={`copy-${d}`}
              checked={targets.includes(d)}
              onChange={(e) => setTargets((t) => (e.target.checked ? [...t, d] : t.filter((x) => x !== d)))}
              label={weekdayFullLabel(d)}
              hint={list.length === 0 ? "Hoje: fechado" : `Hoje: ${list.map((s) => `${s.name} ${s.open_time}–${s.close_time}`).join(", ")}`}
            />
          );
        })}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          disabled={saving || targets.length === 0}
          onClick={async () => {
            setSaving(true);
            await onCopy(targets);
            setSaving(false);
          }}
        >
          {saving
            ? "Copiando..."
            : targets.length === 0
              ? "Copiar"
              : `Copiar para ${targets.length} ${targets.length === 1 ? "dia" : "dias"}`}
        </Button>
      </div>
    </div>
  );
}
