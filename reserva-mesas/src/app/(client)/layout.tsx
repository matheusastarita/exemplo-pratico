import Link from "next/link";
import { AppShell, type NavItem } from "@/components/AppShell";
import { LogoutButton } from "@/components/LogoutButton";
import { RestaurantMark } from "@/components/RestaurantMark";
import { DemoNotice } from "@/components/DemoNotice";
import { Avatar } from "@/components/ui/Avatar";
import { getPublicInfo } from "@/lib/restaurant";
import { requireUser } from "@/lib/session";

const NAV_ITEMS: NavItem[] = [
  { href: "/reservar", label: "Reservar mesa", shortLabel: "Reservar", icon: "reservar" },
  { href: "/minhas-reservas", label: "Minhas reservas", shortLabel: "Reservas", icon: "minhas" },
  { href: "/perfil", label: "Meus dados", shortLabel: "Perfil", icon: "perfil" },
];

/** Área do cliente logado. A proteção é aqui, no servidor (o proxy só renova a sessão). */
export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const [{ user, profile }, { info }] = await Promise.all([requireUser(), getPublicInfo()]);
  const name = profile?.full_name?.trim() || user.email || "Minha conta";

  return (
    <AppShell
      navItems={NAV_ITEMS}
      maxWidth="2xl"
      logo={
        <Link href="/" className="block">
          <RestaurantMark name={info.name} logoUrl={info.logo_url} tone="light" size="sm" />
        </Link>
      }
      mobileHeaderAction={<LogoutButton variant="header" redirectTo="/" />}
      sidebarFooter={
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 px-1.5 py-2">
            <Avatar name={name} size="sm" />
            <p className="min-w-0 truncate text-sm font-medium">{name}</p>
          </div>
          <LogoutButton redirectTo="/" />
        </div>
      }
      footerNote={info.demo_mode ? <DemoNotice /> : undefined}
    >
      {children}
    </AppShell>
  );
}
