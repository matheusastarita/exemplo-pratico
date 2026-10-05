"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Toast, useToast } from "@/components/ui/Toast";
import { RefreshIcon } from "@/components/icons";
import { friendlyErrorMessage } from "@/lib/constants";
import { isValidHexColor } from "@/lib/brand";
import { maskPhoneInput, normalizePhoneBR } from "@/lib/format";
import type { RestaurantSettingsRow } from "@/lib/types";
import { BrandPreview } from "./BrandPreview";

// Cores prontas com cara de restaurante (qualquer outra pode ser escolhida no seletor).
const PRESETS = [
  { name: "Verde alecrim", hex: "#2F4A3A" },
  { name: "Azul-marinho", hex: "#1B2A4B" },
  { name: "Vinho", hex: "#7A2E3A" },
  { name: "Terracota", hex: "#A8492A" },
  { name: "Mostarda", hex: "#C28B1E" },
  { name: "Grafite", hex: "#2E2E2E" },
];

type Brand = Pick<
  RestaurantSettingsRow,
  "name" | "tagline" | "address" | "phone" | "whatsapp" | "instagram" | "primary_color" | "logo_url" | "public_url"
>;

function cleanInstagram(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
}

function validUrl(value: string, httpsOnly: boolean): boolean {
  try {
    const u = new URL(value);
    return httpsOnly ? u.protocol === "https:" : u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function SettingsForm({ initial, demoMode }: { initial: Brand; demoMode: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [name, setName] = useState(initial.name);
  const [tagline, setTagline] = useState(initial.tagline ?? "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [phone, setPhone] = useState(initial.phone ? maskPhoneInput(initial.phone) : "");
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp ? maskPhoneInput(initial.whatsapp) : "");
  const [instagram, setInstagram] = useState(initial.instagram ?? "");
  const [color, setColor] = useState(initial.primary_color.toUpperCase());
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? "");
  const [publicUrl, setPublicUrl] = useState(initial.public_url ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { toast, show, clear } = useToast();

  function edit(setter: (v: string) => void, transform: (v: string) => string = (v) => v) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(transform(e.target.value));
      setDirty(true);
    };
  }

  const previewLogo = logoUrl.trim() && validUrl(logoUrl.trim(), true) ? logoUrl.trim() : null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (cleanName.length < 2 || cleanName.length > 60) next.name = "O nome precisa ter entre 2 e 60 caracteres.";
    if (tagline.trim().length > 80) next.tagline = "Até 80 caracteres.";
    if (address.trim().length > 160) next.address = "Até 160 caracteres.";
    const phoneDigits = phone.trim() ? normalizePhoneBR(phone) : null;
    if (phone.trim() && !phoneDigits) next.phone = "Telefone inválido. Use DDD + número.";
    const whatsDigits = whatsapp.trim() ? normalizePhoneBR(whatsapp) : null;
    if (whatsapp.trim() && !whatsDigits) next.whatsapp = "WhatsApp inválido. Use DDD + número.";
    const handle = cleanInstagram(instagram);
    if (handle && !/^[A-Za-z0-9._]{1,30}$/.test(handle)) next.instagram = "Use só o nome do perfil, ex.: bistroalecrim.";
    if (!isValidHexColor(color)) next.color = "Use uma cor no formato #RRGGBB.";
    if (logoUrl.trim() && (!validUrl(logoUrl.trim(), true) || logoUrl.trim().length > 500)) {
      next.logo = "Use um endereço de imagem que comece com https://";
    }
    if (publicUrl.trim() && !validUrl(publicUrl.trim(), false)) next.publicUrl = "Endereço inválido. Ex.: https://reservas.seurestaurante.com.br";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    const { error } = await createClient()
      .from("restaurant_settings")
      .update({
        name: cleanName,
        tagline: tagline.trim() || null,
        address: address.trim() || null,
        phone: phoneDigits,
        whatsapp: whatsDigits,
        instagram: handle || null,
        primary_color: color.toUpperCase(),
        logo_url: logoUrl.trim() || null,
        public_url: publicUrl.trim().replace(/\/+$/, "") || null,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      setErrors({ form: friendlyErrorMessage(error) });
      return;
    }
    setDirty(false);
    setInstagram(handle);
    show("Marca salva. Todas as telas já usam o novo nome e a nova cor.");
    // Recarrega o layout raiz (de onde vêm as variáveis da cor) sem perder a página
    startTransition(() => router.refresh());
  }

  async function resetDemo() {
    setResetting(true);
    const { error } = await createClient().rpc("demo_reset", { p_site_url: window.location.origin });
    setResetting(false);
    setResetOpen(false);
    if (error) return show(friendlyErrorMessage(error), "error");
    show("Demonstração restaurada: reservas, mesas e marca voltaram ao padrão.");
    router.push("/painel");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Configurações" subtitle="A marca e os contatos que aparecem para os clientes e para a equipe." />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <form onSubmit={save} noValidate className="flex flex-col gap-5">
          <Card className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-stone-900">Marca</h2>
            <Input id="b-name" label="Nome do restaurante" value={name} maxLength={60} onChange={edit(setName)} error={errors.name} />
            <Input
              id="b-tagline"
              label="Frase de apresentação (opcional)"
              value={tagline}
              maxLength={80}
              placeholder="Ex.: Cozinha de bistrô, sem pressa."
              onChange={edit(setTagline)}
              error={errors.tagline}
            />

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 px-1 text-sm font-medium text-stone-600">Cor principal</legend>
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((p) => {
                  const on = color.toUpperCase() === p.hex;
                  return (
                    <button
                      key={p.hex}
                      type="button"
                      aria-pressed={on}
                      aria-label={`Usar a cor ${p.name}`}
                      title={p.name}
                      onClick={() => {
                        setColor(p.hex);
                        setDirty(true);
                      }}
                      className={`h-11 w-11 rounded-full border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 ${
                        on ? "scale-110 border-stone-900" : "border-white shadow-sm hover:scale-105"
                      }`}
                      style={{ backgroundColor: p.hex }}
                    />
                  );
                })}
                <label className="flex h-11 items-center gap-2 rounded-full border border-stone-200 bg-white pl-1.5 pr-3 text-sm text-stone-700">
                  <input
                    type="color"
                    value={isValidHexColor(color) ? color : "#000000"}
                    onChange={(e) => {
                      setColor(e.target.value.toUpperCase());
                      setDirty(true);
                    }}
                    aria-label="Escolher outra cor"
                    className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  />
                  Outra cor
                </label>
              </div>
              <div className="sm:max-w-[200px]">
                <Input
                  id="b-color"
                  label="Código da cor"
                  value={color}
                  maxLength={7}
                  onChange={edit(setColor, (v) => (v.startsWith("#") ? v : `#${v}`).toUpperCase())}
                  error={errors.color}
                />
              </div>
              <p className="px-1 text-xs text-stone-500">
                Qualquer cor funciona: o sistema ajusta sozinho o tom dos textos para continuar legível.
              </p>
            </fieldset>

            <Input
              id="b-logo"
              label="Logo (endereço da imagem, opcional)"
              value={logoUrl}
              placeholder="https://..."
              onChange={edit(setLogoUrl)}
              error={errors.logo}
              hint="Imagem quadrada, de preferência. Sem logo, usamos as iniciais na cor da marca."
            />
          </Card>

          <Card className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-stone-900">Contatos e endereço</h2>
            <Input
              id="b-address"
              label="Endereço"
              value={address}
              maxLength={160}
              onChange={edit(setAddress)}
              error={errors.address}
              hint="Aparece na página de reserva com link para o mapa."
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                id="b-phone"
                label="Telefone"
                inputMode="tel"
                value={phone}
                onChange={edit(setPhone, maskPhoneInput)}
                error={errors.phone}
              />
              <Input
                id="b-whatsapp"
                label="WhatsApp"
                inputMode="tel"
                value={whatsapp}
                onChange={edit(setWhatsapp, maskPhoneInput)}
                error={errors.whatsapp}
                hint="Para grupos grandes e dúvidas."
              />
            </div>
            <Input
              id="b-instagram"
              label="Instagram"
              value={instagram}
              placeholder="bistroalecrim"
              onChange={edit(setInstagram)}
              error={errors.instagram}
            />
            <Input
              id="b-public"
              label="Endereço do site de reservas"
              value={publicUrl}
              placeholder="https://reservas.seurestaurante.com.br"
              onChange={edit(setPublicUrl)}
              error={errors.publicUrl}
              hint="Usado nos links das mensagens (confirmação, lembrete)."
            />
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPublicUrl(window.location.origin);
                  setDirty(true);
                }}
              >
                Usar o endereço atual
              </Button>
            </div>
          </Card>

          {errors.form && (
            <p role="alert" className="text-sm text-red-600">
              {errors.form}
            </p>
          )}
          <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-10 flex justify-end lg:bottom-6">
            <Button type="submit" size="lg" disabled={!dirty || saving} className="shadow-elevated">
              {saving ? "Salvando..." : "Salvar marca"}
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <div>
            <h2 className="px-1 text-sm font-semibold text-stone-900">Pré-visualização</h2>
            <p className="px-1 text-xs text-stone-500">Muda na hora; vale para todos depois de salvar.</p>
          </div>
          <BrandPreview name={name} tagline={tagline} color={color} logoUrl={previewLogo} />

          {demoMode && (
            <Card className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-stone-900">Demonstração</h2>
              <p className="text-sm text-stone-600">
                Volta tudo ao ponto de partida: reservas de hoje com horários reais, clientes, mesas, turnos, mensagens e a
                marca original. Use antes de apresentar.
              </p>
              <Button variant="secondary" onClick={() => setResetOpen(true)}>
                <RefreshIcon size={18} /> Resetar demonstração
              </Button>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Resetar a demonstração?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Voltar
            </Button>
            <Button variant="danger" disabled={resetting} onClick={resetDemo}>
              {resetting ? "Resetando..." : "Resetar"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-stone-600">
          Tudo o que foi feito durante a demonstração é apagado e os dados de exemplo são recriados (leva alguns segundos).
          As contas de acesso não mudam.
        </p>
      </Modal>

      <Toast toast={toast} onClose={clear} />
    </div>
  );
}
