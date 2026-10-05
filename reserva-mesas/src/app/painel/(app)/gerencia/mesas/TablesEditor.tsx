"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Toast, useToast } from "@/components/ui/Toast";
import { PlusIcon } from "@/components/icons";
import { friendlyErrorMessage } from "@/lib/constants";
import { nowInSaoPauloMillis } from "@/lib/dates";
import { pluralize } from "@/lib/format";
import {
  SHAPE_LABEL,
  SIZE_LABEL,
  SIZE_PRESETS,
  combinableNeighbors,
  compareLabels,
  findFreeSpot,
  nextLabel,
  sizeKeyOf,
  type SizeKey,
} from "@/lib/mesas";
import type { AreaRow, DiningTableRow, TableShape } from "@/lib/types";
import { MapCanvas } from "./MapCanvas";

function tableError(error: { code?: string; message?: string }): string {
  if (error.code === "23505") return "Já existe uma mesa com esse nome. Use outro (ex.: 13, V6, B4).";
  if (error.code === "23514") return "Confira os lugares: o mínimo não pode ser maior que o máximo.";
  return friendlyErrorMessage(error);
}

/** Reservas ativas daqui pra frente que usam a mesa (para avisar antes de desativar/mudar de área). */
async function futureReservationsOn(tableId: string): Promise<number> {
  const nowSP = new Date(nowInSaoPauloMillis()).toISOString().slice(0, 19).replace("T", " ");
  const { data } = await createClient()
    .from("reservation_tables")
    .select("time_range")
    .eq("table_id", tableId)
    .eq("active", true);
  // tsrange vem como ["2026-10-05 20:00:00","2026-10-05 22:00:00")
  return (data ?? []).filter((r) => {
    const upper = String(r.time_range).split(",")[1]?.replace(/["\])]/g, "").trim() ?? "";
    return upper > nowSP;
  }).length;
}

export function TablesEditor({ initialAreas, initialTables }: { initialAreas: AreaRow[]; initialTables: DiningTableRow[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [areas, setAreas] = useState(initialAreas);
  const [tables, setTables] = useState(initialTables);
  const [areaId, setAreaId] = useState<string | null>(initialAreas.find((a) => a.active)?.id ?? initialAreas[0]?.id ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast, show: notify, clear: clearToast } = useToast();
  const [areaDialog, setAreaDialog] = useState<AreaRow | "new" | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const savedPositions = useRef(new Map(initialTables.map((t) => [t.id, { x: t.pos_x, y: t.pos_y }])));
  const panelRef = useRef<HTMLDivElement>(null);

  const area = areas.find((a) => a.id === areaId) ?? null;
  const areaTables = useMemo(
    () => tables.filter((t) => t.area_id === areaId && t.active).sort((a, b) => compareLabels(a.label, b.label)),
    [tables, areaId]
  );
  const inactiveTables = tables.filter((t) => !t.active).sort((a, b) => compareLabels(a.label, b.label));
  const selected = tables.find((t) => t.id === selectedId && t.active) ?? null;
  const neighbors = useMemo(() => (selected ? combinableNeighbors(selected, tables) : []), [selected, tables]);

  // No celular o formulário fica abaixo do mapa: ao tocar numa mesa, rola até ele
  // (mas não durante o arraste, que precisa do mapa parado).
  function select(id: string, via: "tap" | "drag" | "key") {
    setSelectedId(id);
    if (via !== "tap" || window.matchMedia("(min-width: 1024px)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  }
  function patchLocal(id: string, patch: Partial<DiningTableRow>) {
    setTables((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function savePosition(id: string, x: number, y: number) {
    const before = savedPositions.current.get(id);
    if (before && Number(before.x) === x && Number(before.y) === y) return;
    savedPositions.current.set(id, { x, y });
    const { error } = await supabase.from("dining_tables").update({ pos_x: x, pos_y: y }).eq("id", id);
    if (error) {
      if (before) {
        savedPositions.current.set(id, before);
        patchLocal(id, { pos_x: before.x, pos_y: before.y });
      }
      notify(friendlyErrorMessage(error), "error");
    }
  }

  async function createTable() {
    if (!area) return;
    const size = SIZE_PRESETS.square.m;
    const spot = findFreeSpot(areaTables, size.width, size.height);
    const { data, error } = await supabase
      .from("dining_tables")
      .insert({
        area_id: area.id,
        label: nextLabel(areaTables, tables),
        min_seats: 2,
        max_seats: 4,
        combinable: true,
        shape: "square",
        pos_x: spot.x,
        pos_y: spot.y,
        width: size.width,
        height: size.height,
      })
      .select()
      .single();
    if (error || !data) {
      notify(error ? tableError(error) : "Não foi possível criar a mesa.", "error");
      return;
    }
    const row = data as DiningTableRow;
    savedPositions.current.set(row.id, { x: row.pos_x, y: row.pos_y });
    setTables((list) => [...list, row]);
    setSelectedId(row.id);
    notify(`Mesa ${row.label} criada. Arraste para o lugar certo.`);
  }

  async function reactivate(t: DiningTableRow) {
    const { error } = await supabase.from("dining_tables").update({ active: true }).eq("id", t.id);
    if (error) return notify(tableError(error), "error");
    patchLocal(t.id, { active: true });
    setAreaId(t.area_id);
    setSelectedId(t.id);
    notify(`Mesa ${t.label} reativada.`);
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Salão e mesas"
        subtitle={`${pluralize(tables.filter((t) => t.active).length, "mesa ativa", "mesas ativas")} em ${pluralize(
          areas.filter((a) => a.active).length,
          "área",
          "áreas"
        )}`}
      />

      {/* Áreas */}
      <div className="-mt-2 flex flex-wrap items-center gap-2" role="tablist" aria-label="Áreas">
        {areas.map((a) => {
          const active = a.id === areaId;
          return (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setAreaId(a.id);
                setSelectedId(null);
              }}
              className={`flex min-h-tap items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                active ? "bg-brand text-brand-contrast" : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              } ${a.active ? "" : "opacity-70"}`}
            >
              {a.name}
              <span className={`rounded-full px-1.5 text-xs ${active ? "bg-white/20" : "bg-stone-100 text-stone-600"}`}>
                {tables.filter((t) => t.area_id === a.id && t.active).length}
              </span>
              {!a.active && <span className="text-xs">(fechada)</span>}
            </button>
          );
        })}
        <Button variant="ghost" size="sm" onClick={() => setAreaDialog("new")}>
          <PlusIcon size={16} /> Nova área
        </Button>
      </div>

      {area ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-stone-600">
                {area.bookable_online ? "Aceita reservas pelo site" : "Só pela equipe (não aparece no site)"}
                {!area.active && " · área fechada"}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setAreaDialog(area)}>
                  Editar área
                </Button>
                <Button size="sm" onClick={() => createTable()}>
                  <PlusIcon size={16} /> Nova mesa
                </Button>
              </div>
            </div>

            <MapCanvas
              tables={areaTables}
              selectedId={selectedId}
              neighborIds={new Set(neighbors.map((n) => n.id))}
              onSelect={select}
              onMove={(id, x, y) => patchLocal(id, { pos_x: x, pos_y: y })}
              onMoveEnd={(id, x, y) => savePosition(id, x, y)}
            />
            <p className="text-xs text-stone-500">
              Arraste as mesas para montar a planta (ou selecione e use as setas do teclado). A posição é salva sozinha.
              Borda vermelha = mesas encostadas uma na outra.
            </p>

            {/* Lista: acesso rápido e alternativa ao mapa */}
            <ul className="flex flex-wrap gap-2" aria-label={`Mesas da área ${area.name}`}>
              {areaTables.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => select(t.id, "tap")}
                    aria-pressed={t.id === selectedId}
                    className={`flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                      t.id === selectedId
                        ? "border-brand bg-brand-soft font-semibold text-brand-ink"
                        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {t.label}
                    <span className="text-xs text-stone-500">
                      {t.min_seats === t.max_seats ? t.max_seats : `${t.min_seats}–${t.max_seats}`}
                    </span>
                    {t.blocked && <Badge tone="neutral">Bloqueada</Badge>}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div ref={panelRef} className="flex scroll-mt-4 flex-col gap-4 lg:sticky lg:top-6">
            {selected ? (
              <TableForm
                key={selected.id}
                table={selected}
                areas={areas}
                neighbors={neighbors}
                onChange={(patch) => {
                  patchLocal(selected.id, patch);
                  if (patch.pos_x !== undefined || patch.pos_y !== undefined) {
                    savedPositions.current.set(selected.id, {
                      x: patch.pos_x ?? selected.pos_x,
                      y: patch.pos_y ?? selected.pos_y,
                    });
                  }
                  // Mudou de área: o mapa acompanha a mesa
                  if (patch.area_id && patch.area_id !== areaId) setAreaId(patch.area_id);
                }}
                onSaved={(message) => notify(message)}
                onDeactivated={() => {
                  patchLocal(selected.id, { active: false });
                  setSelectedId(null);
                  notify(`Mesa ${selected.label} desativada.`);
                }}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <Card className="text-sm text-stone-600">
                <p className="font-medium text-stone-900">Nenhuma mesa selecionada</p>
                <p className="mt-1">Toque numa mesa do mapa para editar nome, lugares, formato, bloquear ou desativar.</p>
              </Card>
            )}

            {inactiveTables.length > 0 && (
              <Card padding="sm">
                <button
                  type="button"
                  aria-expanded={showInactive}
                  onClick={() => setShowInactive((v) => !v)}
                  className="flex min-h-9 w-full items-center justify-between px-1 text-sm font-medium text-stone-700"
                >
                  Mesas desativadas ({inactiveTables.length})
                  <span aria-hidden="true">{showInactive ? "−" : "+"}</span>
                </button>
                {showInactive && (
                  <ul className="mt-2 divide-y divide-stone-100">
                    {inactiveTables.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-2 px-1 py-2 text-sm">
                        <span>
                          Mesa {t.label}{" "}
                          <span className="text-stone-500">· {areas.find((a) => a.id === t.area_id)?.name}</span>
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => reactivate(t)}>
                          Reativar
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card className="text-sm text-stone-600">Crie a primeira área (ex.: Salão, Varanda) para cadastrar as mesas.</Card>
      )}

      <AreaDialog
        state={areaDialog}
        nextOrder={Math.max(0, ...areas.map((a) => a.sort_order)) + 1}
        onClose={() => setAreaDialog(null)}
        onSaved={(row, created) => {
          setAreas((list) => (created ? [...list, row] : list.map((a) => (a.id === row.id ? row : a))));
          setAreaId(row.id);
          setAreaDialog(null);
          notify(created ? `Área ${row.name} criada.` : `Área ${row.name} atualizada.`);
        }}
      />

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}

function TableForm({
  table: t,
  areas,
  neighbors,
  onChange,
  onSaved,
  onDeactivated,
  onClose,
}: {
  table: DiningTableRow;
  areas: AreaRow[];
  neighbors: DiningTableRow[];
  onChange: (patch: Partial<DiningTableRow>) => void;
  onSaved: (message: string) => void;
  onDeactivated: () => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(t.label);
  const [areaId, setAreaId] = useState(t.area_id);
  const [minSeats, setMinSeats] = useState(String(t.min_seats));
  const [maxSeats, setMaxSeats] = useState(String(t.max_seats));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState<number | null>(null);
  const size = sizeKeyOf(t);

  // Forma, tamanho e "combinável" valem na hora (o mapa já mostra); nome/lugares/área pelo botão salvar.
  async function saveLook(patch: Partial<DiningTableRow>) {
    const before = { shape: t.shape, width: t.width, height: t.height, combinable: t.combinable, pos_x: t.pos_x, pos_y: t.pos_y };
    onChange(patch);
    const { error: e } = await createClient().from("dining_tables").update(patch).eq("id", t.id);
    if (e) {
      onChange(before);
      setError(tableError(e));
    }
  }

  function changeShape(shape: TableShape) {
    const preset = SIZE_PRESETS[shape][size ?? "m"];
    const pos_x = Math.min(Number(t.pos_x), 100 - preset.width);
    const pos_y = Math.min(Number(t.pos_y), 100 - preset.height);
    saveLook({ shape, ...preset, pos_x, pos_y });
  }

  function changeSize(key: SizeKey) {
    const preset = SIZE_PRESETS[t.shape][key];
    const pos_x = Math.min(Number(t.pos_x), 100 - preset.width);
    const pos_y = Math.min(Number(t.pos_y), 100 - preset.height);
    saveLook({ ...preset, pos_x, pos_y });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const min = Number(minSeats);
    const max = Number(maxSeats);
    const name = label.trim();
    if (!name || name.length > 10) return setError("O nome da mesa precisa ter de 1 a 10 caracteres.");
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < 1) return setError("Informe os lugares (números inteiros).");
    if (min > max) return setError("O mínimo de lugares não pode ser maior que o máximo.");
    if (max > 30) return setError("No máximo 30 lugares por mesa. Para grupos maiores, junte mesas.");
    if (areaId !== t.area_id) {
      const future = await futureReservationsOn(t.id);
      if (future > 0) {
        return setError(
          `Essa mesa tem ${pluralize(future, "reserva marcada", "reservas marcadas")}. Troque a mesa dessas reservas no salão antes de mudá-la de área.`
        );
      }
    }
    setSaving(true);
    setError(null);
    const patch = { label: name, area_id: areaId, min_seats: min, max_seats: max };
    const { error: e2 } = await createClient().from("dining_tables").update(patch).eq("id", t.id);
    setSaving(false);
    if (e2) return setError(tableError(e2));
    onChange(patch);
    onSaved(`Mesa ${name} salva.`);
  }

  async function setBlocked(blocked: boolean) {
    setSaving(true);
    const { error: e } = await createClient().rpc("set_table_state", {
      p_table_id: t.id,
      p_blocked: blocked,
      p_reason: blocked ? blockReason.trim() || null : null,
    });
    setSaving(false);
    if (e) return setError(friendlyErrorMessage(e));
    onChange({ blocked, blocked_reason: blocked ? blockReason.trim() || null : null });
    setBlockOpen(false);
    setBlockReason("");
    onSaved(blocked ? `Mesa ${t.label} bloqueada: não entra em novas reservas.` : `Mesa ${t.label} liberada.`);
  }

  async function askDeactivate() {
    setConfirmDeactivate(await futureReservationsOn(t.id));
  }

  async function deactivate() {
    setSaving(true);
    const { error: e } = await createClient().from("dining_tables").update({ active: false }).eq("id", t.id);
    setSaving(false);
    setConfirmDeactivate(null);
    if (e) return setError(tableError(e));
    onDeactivated();
  }

  const dirty =
    label.trim() !== t.label || areaId !== t.area_id || Number(minSeats) !== t.min_seats || Number(maxSeats) !== t.max_seats;

  return (
    <Card>
      <form onSubmit={save} className="flex flex-col gap-4" noValidate>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Mesa {t.label}</h2>
            {t.blocked && (
              <p className="mt-0.5 text-sm text-stone-600">
                Bloqueada{t.blocked_reason ? `: ${t.blocked_reason}` : ""}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Input id="t-label" label="Nome" value={label} maxLength={10} onChange={(e) => setLabel(e.target.value)} />
          <Select id="t-area" label="Área" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Input
            id="t-min"
            label="Lugares (mínimo)"
            type="number"
            inputMode="numeric"
            min={1}
            max={30}
            value={minSeats}
            onChange={(e) => setMinSeats(e.target.value)}
          />
          <Input
            id="t-max"
            label="Lugares (máximo)"
            type="number"
            inputMode="numeric"
            min={1}
            max={30}
            value={maxSeats}
            onChange={(e) => setMaxSeats(e.target.value)}
          />
        </div>
        <p className="-mt-2 px-1 text-xs text-stone-500">
          Pelo site, a mesa só é oferecida para grupos a partir do mínimo (evita sentar 2 pessoas numa mesa de 6).
        </p>

        <div className="flex flex-col gap-2">
          <p className="px-1 text-sm font-medium text-stone-600">Formato</p>
          <SegmentedControl
            label="Formato da mesa"
            stretch
            value={t.shape}
            onChange={changeShape}
            options={(Object.keys(SHAPE_LABEL) as TableShape[]).map((key) => ({ key, label: SHAPE_LABEL[key] }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="px-1 text-sm font-medium text-stone-600">Tamanho no mapa</p>
          <SegmentedControl
            label="Tamanho da mesa no mapa"
            stretch
            value={size ?? ("" as SizeKey)}
            onChange={changeSize}
            options={(Object.keys(SIZE_LABEL) as SizeKey[]).map((key) => ({ key, label: SIZE_LABEL[key] }))}
          />
        </div>

        <div>
          <Checkbox
            id="t-combinable"
            checked={t.combinable}
            onChange={(e) => saveLook({ combinable: e.target.checked })}
            label="Pode juntar com mesa vizinha"
            hint="Para grupos grandes, o sistema junta mesas combináveis que estão perto no mapa."
          />
          {t.combinable && (
            <p className="px-1 text-xs text-stone-600">
              {neighbors.length > 0
                ? `Junta com: ${neighbors.map((n) => `mesa ${n.label}`).join(", ")} (tracejadas no mapa).`
                : "Nenhuma mesa combinável perto o bastante. Aproxime as mesas no mapa."}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!dirty || saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
          {t.blocked ? (
            <Button variant="secondary" disabled={saving} onClick={() => setBlocked(false)}>
              Desbloquear
            </Button>
          ) : (
            <Button variant="secondary" disabled={saving} onClick={() => setBlockOpen(true)}>
              Bloquear
            </Button>
          )}
          <Button variant="danger" disabled={saving} onClick={askDeactivate}>
            Desativar
          </Button>
        </div>
      </form>

      <Modal
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        title={`Bloquear a mesa ${t.label}?`}
        description="Use para mesa quebrada, reservada para evento ou fora de uso por um tempo."
        footer={
          <>
            <Button variant="ghost" onClick={() => setBlockOpen(false)}>
              Voltar
            </Button>
            <Button variant="danger" disabled={saving} onClick={() => setBlocked(true)}>
              Bloquear
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-stone-600">
            A mesa deixa de entrar em novas reservas (site e equipe). Reservas já marcadas nela continuam.
          </p>
          <Textarea
            id="t-block-reason"
            label="Motivo (opcional)"
            value={blockReason}
            maxLength={80}
            onChange={(e) => setBlockReason(e.target.value)}
            hint="Aparece para o anfitrião no mapa do salão."
          />
        </div>
      </Modal>

      <Modal
        open={confirmDeactivate !== null}
        onClose={() => setConfirmDeactivate(null)}
        title={`Desativar a mesa ${t.label}?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDeactivate(null)}>
              Voltar
            </Button>
            <Button variant="danger" disabled={saving || (confirmDeactivate ?? 0) > 0} onClick={deactivate}>
              Desativar
            </Button>
          </>
        }
      >
        {(confirmDeactivate ?? 0) > 0 ? (
          <p className="text-sm text-stone-600">
            Essa mesa tem {pluralize(confirmDeactivate ?? 0, "reserva marcada", "reservas marcadas")}. Troque a mesa dessas
            reservas no salão (ou bloqueie a mesa) antes de desativar.
          </p>
        ) : (
          <p className="text-sm text-stone-600">
            A mesa sai do mapa e das reservas. O histórico continua nos relatórios, e você pode reativá-la depois.
          </p>
        )}
      </Modal>
    </Card>
  );
}

function AreaDialog({
  state,
  nextOrder,
  onClose,
  onSaved,
}: {
  state: AreaRow | "new" | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: (row: AreaRow, created: boolean) => void;
}) {
  const editing = state !== null && state !== "new" ? state : null;
  return (
    <Modal open={state !== null} onClose={onClose} title={editing ? `Editar área ${editing.name}` : "Nova área"}>
      {state !== null && (
        <AreaForm key={editing?.id ?? "new"} area={editing} nextOrder={nextOrder} onCancel={onClose} onSaved={onSaved} />
      )}
    </Modal>
  );
}

function AreaForm({
  area,
  nextOrder,
  onCancel,
  onSaved,
}: {
  area: AreaRow | null;
  nextOrder: number;
  onCancel: () => void;
  onSaved: (row: AreaRow, created: boolean) => void;
}) {
  const [name, setName] = useState(area?.name ?? "");
  const [online, setOnline] = useState(area?.bookable_online ?? true);
  const [active, setActive] = useState(area?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.length < 1 || clean.length > 40) return setError("Dê um nome de até 40 caracteres (ex.: Varanda).");
    setSaving(true);
    const supabase = createClient();
    const values = { name: clean, bookable_online: online, active };
    const { data, error: e2 } = area
      ? await supabase.from("areas").update(values).eq("id", area.id).select().single()
      : await supabase.from("areas").insert({ ...values, sort_order: nextOrder }).select().single();
    setSaving(false);
    if (e2 || !data) return setError(e2 ? friendlyErrorMessage(e2) : "Não foi possível salvar a área.");
    onSaved(data as AreaRow, !area);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Input id="a-name" label="Nome da área" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
      <Checkbox
        id="a-online"
        checked={online}
        onChange={(e) => setOnline(e.target.checked)}
        label="Aceita reservas pelo site"
        hint="Desmarque para áreas que a equipe distribui na hora (ex.: bar)."
      />
      {area && (
        <Checkbox
          id="a-active"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          label="Área aberta"
          hint="Fechar a área tira as mesas dela de novas reservas. As já marcadas continuam valendo."
        />
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : area ? "Salvar" : "Criar área"}
        </Button>
      </div>
    </form>
  );
}
