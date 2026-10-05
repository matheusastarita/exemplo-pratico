import Link from "next/link";
import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { LogoutButton } from "@/components/LogoutButton";
import { Avatar } from "@/components/ui/Avatar";
import {
  ChartIcon,
  ChatIcon,
  ChevronIcon,
  ClockIcon,
  SettingsIcon,
  TableIcon,
  UserIcon,
} from "@/components/icons";
import { ROLE_LABEL } from "@/lib/constants";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Mais" };

const G = "/painel/gerencia";

const LINKS = [
  { href: `${G}/mesas`, label: "Salão e mesas", hint: "Áreas, mesas e mapa do salão", Icon: TableIcon },
  { href: `${G}/turnos`, label: "Turnos e regras", hint: "Horários, permanência, prazos, feriados", Icon: ClockIcon },
  { href: `${G}/relatorios`, label: "Relatórios", hint: "Ocupação, faltas, origem das reservas", Icon: ChartIcon },
  { href: `${G}/mensagens`, label: "Mensagens", hint: "Modelos e histórico de envios", Icon: ChatIcon },
  { href: `${G}/equipe`, label: "Equipe", hint: "Anfitriões e gerentes", Icon: UserIcon },
  { href: `${G}/configuracoes`, label: "Configurações", hint: "Marca, contatos e cor do restaurante", Icon: SettingsIcon },
];

/** Menu secundário do celular (o que não cabe na barra inferior). */
export default async function MaisPage() {
  const { user, profile } = await requireStaff("/painel/mais");
  const name = profile.full_name?.trim() || user.email || "Equipe";
  const isManager = profile.role === "manager";

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeader title={isManager ? "Mais" : "Conta"} />

      <Card padding="sm" className="mb-4 flex items-center gap-3">
        <Avatar name={name} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-stone-900">{name}</p>
          <p className="truncate text-sm text-stone-500">
            {ROLE_LABEL[profile.role]} · {user.email}
          </p>
        </div>
      </Card>

      {isManager && (
        <Card padding="sm" className="divide-y divide-stone-100">
          {LINKS.map(({ href, label, hint, Icon }) => (
            <Link key={href} href={href} className="flex min-h-14 items-center gap-3 px-2 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
                <Icon size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-stone-900">{label}</span>
                <span className="block truncate text-xs text-stone-500">{hint}</span>
              </span>
              <ChevronIcon direction="right" size={18} className="text-stone-400" />
            </Link>
          ))}
        </Card>
      )}

      <Card padding="sm" className="mt-4">
        <LogoutButton redirectTo="/painel/entrar" variant="menu-row" />
      </Card>
    </div>
  );
}
