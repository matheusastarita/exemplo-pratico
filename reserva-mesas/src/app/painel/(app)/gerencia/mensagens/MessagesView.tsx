"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPills } from "@/components/ui/FilterPills";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import { Toast, useToast } from "@/components/ui/Toast";
import { WhatsAppPreview } from "@/components/WhatsAppPreview";
import { MESSAGE_KIND_LABEL, formatWhen } from "@/components/reservas/ReservationHistory";
import { ChatIcon } from "@/components/icons";
import { friendlyErrorMessage } from "@/lib/constants";
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_INFO,
  TEMPLATE_ORDER,
  TEMPLATE_VARIABLES,
  renderSample,
  unknownVariables,
  type TemplateKind,
} from "@/lib/mensagens";
import type { MessageKind, MessageLogRow, MessageTemplateRow } from "@/lib/types";

type Tab = "modelos" | "enviadas";

export function MessagesView({
  templates,
  sample,
  restaurant,
}: {
  templates: MessageTemplateRow[];
  sample: Record<string, string>;
  restaurant: string;
}) {
  const [tab, setTab] = useState<Tab>("modelos");
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Mensagens"
        subtitle="O que o cliente recebe no WhatsApp. Na demonstração tudo é simulado: nada é enviado de verdade."
      />
      <div className="-mt-2">
        <FilterPills
          options={[
            { key: "modelos" as Tab, label: "Modelos" },
            { key: "enviadas" as Tab, label: "Enviadas" },
          ]}
          value={tab}
          onChange={setTab}
          label="Seção"
        />
      </div>
      {tab === "modelos" ? (
        <div className="flex flex-col gap-4">
          <Card padding="sm" className="text-sm text-stone-600">
            Toque numa variável para inserir no texto. Ela vira o dado da reserva na hora do envio — na prévia, usamos
            dados de exemplo.
          </Card>
          {TEMPLATE_ORDER.map((kind) => {
            const t = templates.find((x) => x.kind === kind);
            return (
              <TemplateEditor
                key={kind}
                kind={kind}
                initialBody={t?.body ?? DEFAULT_TEMPLATES[kind]}
                initialActive={t?.active ?? true}
                sample={sample}
                restaurant={restaurant}
              />
            );
          })}
        </div>
      ) : (
        <SentMessages restaurant={restaurant} />
      )}
    </div>
  );
}

function TemplateEditor({
  kind,
  initialBody,
  initialActive,
  sample,
  restaurant,
}: {
  kind: TemplateKind;
  initialBody: string;
  initialActive: boolean;
  sample: Record<string, string>;
  restaurant: string;
}) {
  const [body, setBody] = useState(initialBody);
  const [saved, setSaved] = useState({ body: initialBody, active: initialActive });
  const [active, setActive] = useState(initialActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const { toast, show, clear } = useToast();
  const info = TEMPLATE_INFO[kind];
  const unknown = unknownVariables(body);
  const dirty = body !== saved.body || active !== saved.active;
  const id = `tpl-${kind}`;

  function insert(token: string) {
    const el = textRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    // Devolve o cursor logo depois da variável inserida
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function save(patch?: { active: boolean }) {
    const nextActive = patch?.active ?? active;
    const text = body.trim();
    if (text.length < 10 || text.length > 1000) return setError("O texto precisa ter entre 10 e 1000 caracteres.");
    setSaving(true);
    setError(null);
    const { error: e } = await createClient()
      .from("message_templates")
      .update({ body: text, active: nextActive })
      .eq("kind", kind);
    setSaving(false);
    if (e) return setError(friendlyErrorMessage(e));
    setBody(text);
    setSaved({ body: text, active: nextActive });
    show(patch ? (nextActive ? `${info.title}: envio ligado.` : `${info.title}: envio desligado.`) : `Modelo "${info.title}" salvo.`);
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-stone-900">{info.title}</h2>
          <p className="mt-0.5 text-sm text-stone-500">{info.when}</p>
        </div>
        <Switch
          checked={active}
          disabled={saving}
          label={active ? "Enviando" : "Desligada"}
          onChange={(v) => {
            setActive(v);
            save({ active: v });
          }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-2">
          <label htmlFor={id} className="px-1 text-sm font-medium text-stone-600">
            Texto
          </label>
          <textarea
            ref={textRef}
            id={id}
            rows={5}
            maxLength={1000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-describedby={`${id}-vars`}
            className="w-full resize-y rounded-control border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm leading-relaxed text-stone-900 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
          <div id={`${id}-vars`} className="flex flex-wrap gap-1.5" role="group" aria-label="Inserir variável">
            {TEMPLATE_VARIABLES.map((v) => (
              <button
                key={v.token}
                type="button"
                onClick={() => insert(v.token)}
                title={v.label}
                aria-label={`Inserir ${v.label}`}
                className="min-h-9 rounded-full border border-stone-200 bg-white px-2.5 font-mono text-xs text-stone-700 hover:border-brand hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {v.token}
              </button>
            ))}
          </div>
          {unknown.length > 0 && (
            <p role="status" className="text-xs font-medium text-amber-800">
              {unknown.join(", ")} não {unknown.length === 1 ? "é uma variável conhecida" : "são variáveis conhecidas"} e
              apareceria assim no WhatsApp.
            </p>
          )}
          {kind === "confirmacao" && !body.includes("{link}") && (
            <p className="text-xs font-medium text-amber-800">Sem {"{link}"}, o cliente não recebe o atalho para alterar ou cancelar.</p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={!dirty || saving} onClick={() => save()}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            {body !== DEFAULT_TEMPLATES[kind] && (
              <Button variant="ghost" size="sm" onClick={() => setBody(DEFAULT_TEMPLATES[kind])}>
                Restaurar texto padrão
              </Button>
            )}
          </div>
        </div>
        <div>
          <p className="mb-2 px-1 text-sm font-medium text-stone-600">Prévia</p>
          <WhatsAppPreview body={renderSample(body, sample)} sender={restaurant} time={sample["{hora}"]} />
        </div>
      </div>
      <Toast toast={toast} onClose={clear} />
    </Card>
  );
}

type SentRow = MessageLogRow & { customer_name: string | null };

const KIND_FILTERS: { key: MessageKind | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "confirmacao", label: "Confirmações" },
  { key: "lembrete_24h", label: "Lembrete 24h" },
  { key: "lembrete_2h", label: "Lembrete 2h" },
  { key: "alteracao", label: "Alterações" },
  { key: "cancelamento", label: "Cancelamentos" },
  { key: "lista_espera", label: "Lista de espera" },
  { key: "manual", label: "Da equipe" },
];

function SentMessages({ restaurant }: { restaurant: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [kind, setKind] = useState<MessageKind | "all">("all");
  const [query, setQuery] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [rows, setRows] = useState<{ key: string; list: SentRow[] } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const { toast, show, clear } = useToast();
  const key = `${kind}|${refresh}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let q = supabase.from("message_log").select("*").order("created_at", { ascending: false }).limit(200);
      if (kind !== "all") q = q.eq("kind", kind);
      const { data } = await q;
      const list = (data ?? []) as MessageLogRow[];
      const ids = [...new Set(list.map((m) => m.customer_id).filter((x): x is string => !!x))];
      const { data: customers } = ids.length
        ? await supabase.from("customers").select("id, full_name").in("id", ids)
        : { data: [] as { id: string; full_name: string }[] };
      const names = new Map((customers ?? []).map((c) => [c.id, c.full_name]));
      if (!cancelled) {
        setRows({ key: `${kind}|${refresh}`, list: list.map((m) => ({ ...m, customer_name: m.customer_id ? names.get(m.customer_id) ?? null : null })) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, kind, refresh]);

  async function runReminders() {
    setRunning(true);
    const { data, error } = await supabase.rpc("run_due_reminders");
    setRunning(false);
    if (error) return show(friendlyErrorMessage(error), "error");
    show(data ? `${data} ${data === 1 ? "lembrete gerado" : "lembretes gerados"} (simulados).` : "Nenhum lembrete pendente agora.");
    setRefresh((n) => n + 1);
  }

  const q = query.trim().toLowerCase();
  const list = (rows?.list ?? []).filter((m) => !q || (m.customer_name ?? "").toLowerCase().includes(q) || m.body.toLowerCase().includes(q));
  const loading = rows?.key !== key;

  return (
    <div className="flex flex-col gap-4">
      <Card padding="sm" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">
          Os lembretes saem sozinhos enquanto o salão está aberto no painel (24 h e 2 h antes). Para testar agora:
        </p>
        <Button variant="secondary" size="sm" disabled={running} onClick={runReminders} className="shrink-0">
          {running ? "Verificando..." : "Enviar lembretes pendentes"}
        </Button>
      </Card>

      <div className="flex flex-col gap-3">
        <SearchInput
          placeholder="Cliente ou texto da mensagem"
          aria-label="Buscar mensagem"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-md"
        />
        <FilterPills options={KIND_FILTERS} value={kind} onChange={setKind} label="Tipo de mensagem" scrollOnMobile />
      </div>

      {loading && !rows ? (
        <div className="flex flex-col gap-2" role="status" aria-label="Carregando mensagens">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-card" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={<ChatIcon size={22} />} title="Nenhuma mensagem" message="Nada enviado com esse filtro ainda." />
      ) : (
        <Card padding="none" className={`divide-y divide-stone-100 ${loading ? "opacity-60" : ""}`}>
          {list.map((m) => {
            const expanded = open === m.id;
            return (
              <div key={m.id} className="px-4 py-3">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : m.id)}
                  className="flex w-full items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-stone-900">
                      {m.customer_name ?? "Cliente"} <span className="font-normal text-stone-500">· {MESSAGE_KIND_LABEL[m.kind] ?? m.kind}</span>
                    </span>
                    <span className={`block text-sm text-stone-600 ${expanded ? "" : "truncate"}`}>{m.body}</span>
                  </span>
                  <span className="shrink-0 text-xs text-stone-500">{formatWhen(m.created_at)}</span>
                </button>
                {expanded && (
                  <div className="mt-3 flex flex-col gap-2 sm:max-w-md">
                    <WhatsAppPreview body={m.body} sender={restaurant} simulated={m.simulated} />
                    {m.customer_id && (
                      <Link
                        href={`/painel/gerencia/clientes/${m.customer_id}`}
                        className="self-start text-sm font-medium text-brand-ink underline underline-offset-2"
                      >
                        Ver ficha do cliente
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}
      <Toast toast={toast} onClose={clear} />
    </div>
  );
}
