import Link from "next/link";
import { AppShell, type NavItem } from "@/components/AppShell";
import { LogoutButton } from "@/components/LogoutButton";
import { RestaurantMark } from "@/components/RestaurantMark";
import { DemoNotice } from "@/components/DemoNotice";
import { Avatar } from "@/components/ui/Avatar";
import { ROLE_LABEL } from "@/lib/constants";
import { getPublicInfo } from "@/lib/restaurant";
import { requireStaff } from "@/lib/session";

const G = "/painel/gerencia";

const MANAGER_NAV: NavItem[] = [
  { href: "/painel", label: "Salão", icon: "salao" },
  { href: G, label: "Visão geral", shortLabel: "Visão", icon: "visao" },
  { href: `${G}/reservas`, label: "Reservas", icon: "reservas" },
  { href: `${G}/clientes`, label: "Clientes", icon: "clientes" },
  { href: `${G}/mesas`, label: "Salão e mesas", icon: "mesas" },
  { href: `${G}/turnos`, label: "Turnos e regras", icon: "turnos" },
  { href: `${G}/relatorios`, label: "Relatórios", icon: "relatorios" },
  { href: `${G}/mensagens`, label: "Mensagens", icon: "mensagens" },
  { href: `${G}/equipe`, label: "Equipe", icon: "equipe" },
  { href: `${G}/configuracoes`, label: "Configurações", icon: "config" },
];

const MANAGER_MOBILE_NAV: NavItem[] = [
  { href: "/painel", label: "Salão", icon: "salao" },
  { href: G, label: "Visão geral", shortLabel: "Visão", icon: "visao" },
  { href: `${G}/reservas`, label: "Reservas", icon: "reservas" },
  { href: `${G}/clientes`, label: "Clientes", icon: "clientes" },
  {
    href: "/painel/mais",
    label: "Mais",
    icon: "mais",
    activePrefixes: [
      `${G}/mesas`,
      `${G}/turnos`,
      `${G}/relatorios`,
      `${G}/mensagens`,
      `${G}/equipe`,
      `${G}/configuracoes`,
    ],
  },
];

const HOST_NAV: NavItem[] = [
  { href: "/painel", label: "Salão", icon: "salao" },
  { href: "/painel/mais", label: "Conta", icon: "perfil" },
];

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const [{ user, profile }, { info }] = await Promise.all([requireStaff(), getPublicInfo()]);
  const isManager = profile.role === "manager";
  const name = profile.full_name?.trim() || user.email || "Equipe";

  return (
    <AppShell
      navItems={isManager ? MANAGER_NAV : HOST_NAV}
      mobileNavItems={isManager ? MANAGER_MOBILE_NAV : HOST_NAV}
      maxWidth="wide"
      logo={
        <Link href="/painel" className="block">
          <RestaurantMark name={info.name} logoUrl={info.logo_url} tone="light" size="sm" subtitle="Painel do restaurante" />
        </Link>
      }
      mobileHeaderAction={<LogoutButton redirectTo="/painel/entrar" variant="header" />}
      sidebarFooter={
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 px-1.5 py-2">
            <Avatar name={name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="text-xs opacity-70">{ROLE_LABEL[profile.role]}</p>
            </div>
          </div>
          <LogoutButton redirectTo="/painel/entrar" />
        </div>
      }
      footerNote={info.demo_mode ? <DemoNotice /> : undefined}
    >
      {children}
    </AppShell>
  );
}
