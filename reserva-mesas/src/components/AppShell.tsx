"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  CalendarPlusIcon,
  ChartIcon,
  ChatIcon,
  GridIcon,
  ClockIcon,
  MapIcon,
  MoreIcon,
  PeopleIcon,
  SettingsIcon,
  TableIcon,
  UserIcon,
} from "@/components/icons";

export type NavIcon =
  | "salao"
  | "visao"
  | "reservas"
  | "clientes"
  | "mesas"
  | "turnos"
  | "relatorios"
  | "mensagens"
  | "equipe"
  | "config"
  | "mais"
  | "minhas"
  | "perfil"
  | "reservar";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  shortLabel?: string;
  /** Também fica "ativo" quando a rota atual começa com um destes prefixos. */
  activePrefixes?: string[];
};

const ICONS: Record<NavIcon, (p: { size?: number }) => React.ReactElement> = {
  salao: MapIcon,
  visao: GridIcon,
  reservas: CalendarIcon,
  clientes: PeopleIcon,
  mesas: TableIcon,
  turnos: ClockIcon,
  relatorios: ChartIcon,
  mensagens: ChatIcon,
  equipe: UserIcon,
  config: SettingsIcon,
  mais: MoreIcon,
  minhas: CalendarIcon,
  perfil: UserIcon,
  reservar: CalendarPlusIcon,
};

function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  return item.activePrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false;
}

function NavGlyph({ name, size = 20 }: { name: NavIcon; size?: number }) {
  const Glyph = ICONS[name];
  return <Glyph size={size} />;
}

const MAX_WIDTH_CLASSES = {
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  wide: "max-w-[1480px]",
};

/**
 * Casca das áreas logadas: barra lateral na cor da marca a partir de 1024px,
 * cabeçalho + navegação inferior fixa no celular/tablet.
 */
export function AppShell({
  navItems,
  mobileNavItems,
  logo,
  sidebarFooter,
  mobileHeaderAction,
  children,
  maxWidth = "2xl",
  footerNote,
}: {
  navItems: NavItem[];
  /** Lista compacta para a barra inferior do celular (máx. 5), quando difere da lateral. */
  mobileNavItems?: NavItem[];
  logo: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  /** Canto direito do cabeçalho no celular. */
  mobileHeaderAction?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: keyof typeof MAX_WIDTH_CLASSES;
  /** Linha discreta no fim do conteúdo (ex.: aviso de demonstração). */
  footerNote?: React.ReactNode;
}) {
  const pathname = usePathname();
  const bottomItems = mobileNavItems ?? navItems;

  return (
    <div className="min-h-screen bg-stone-50 lg:flex">
      {/* Cabeçalho do celular/tablet */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-brand px-4 py-3 text-brand-contrast lg:hidden">
        <div className="min-w-0">{logo}</div>
        {mobileHeaderAction && <div className="shrink-0">{mobileHeaderAction}</div>}
      </header>

      {/* Barra lateral do desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-brand p-5 text-brand-contrast lg:flex">
        <div className="mb-8 px-1">{logo}</div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Navegação principal">
          {navItems.map((item) => {
            const active = isNavItemActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-tap items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/15 before:absolute before:bottom-2 before:left-0 before:top-2 before:w-1 before:rounded-full before:bg-current"
                    : "opacity-75 hover:bg-white/10 hover:opacity-100"
                }`}
              >
                <NavGlyph name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {sidebarFooter && <div className="border-t border-white/15 pt-4">{sidebarFooter}</div>}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
          <div className={`mx-auto ${MAX_WIDTH_CLASSES[maxWidth]}`}>{children}</div>
          {footerNote && <div className="mx-auto mt-10 max-w-2xl">{footerNote}</div>}
        </main>
      </div>

      {/* Navegação inferior do celular/tablet */}
      <nav
        aria-label="Navegação"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-stone-200 bg-white pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 lg:hidden"
      >
        {bottomItems.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors ${
                active ? "text-brand-ink" : "text-stone-500"
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full ${active ? "bg-brand-soft" : ""}`}
              >
                <NavGlyph name={item.icon} size={20} />
              </span>
              <span className="whitespace-nowrap">{item.shortLabel ?? item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
