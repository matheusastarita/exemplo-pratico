import Link from "next/link";
import { RestaurantMark } from "@/components/RestaurantMark";
import { ClockIcon, InstagramIcon, PhoneIcon, PinIcon, UserIcon, WhatsAppIcon } from "@/components/icons";
import { closedDaysLabel, instagramHref, mapsHref, summarizeShifts } from "@/lib/hours";
import { telHref, whatsappHref } from "@/lib/format";
import type { PublicInfo } from "@/lib/types";

/** Cabeçalho da página pública: marca, endereço com mapa, contatos e horários. */
export function RestaurantHeader({ info, signedIn }: { info: PublicInfo; signedIn: boolean }) {
  const hours = summarizeShifts(info.shifts);
  const closedLabel = closedDaysLabel(info.shifts);

  return (
    <header className="bg-brand text-brand-contrast">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-5 sm:px-6 lg:pb-10">
        <nav className="mb-6 flex items-center justify-between gap-3" aria-label="Topo">
          <RestaurantMark name={info.name} logoUrl={info.logo_url} tone="light" size="sm" showName={false} />
          <Link
            href={signedIn ? "/minhas-reservas" : "/login"}
            className="flex min-h-tap items-center gap-2 rounded-full border border-white/25 px-4 text-sm font-medium transition-colors hover:bg-white/10"
          >
            <UserIcon size={17} />
            {signedIn ? "Minhas reservas" : "Entrar"}
          </Link>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <h1 className="font-serif text-[38px] font-bold leading-[1.05] sm:text-5xl">{info.name}</h1>
            {info.tagline && <p className="mt-3 text-[17px] opacity-85">{info.tagline}</p>}

            <div className="mt-5 flex flex-wrap gap-2">
              {info.address && (
                <a
                  href={mapsHref(info.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-tap items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-medium hover:bg-white/15"
                >
                  <PinIcon size={17} /> Como chegar
                </a>
              )}
              {info.phone && (
                <a
                  href={telHref(info.phone)}
                  className="flex min-h-tap items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-medium hover:bg-white/15"
                >
                  <PhoneIcon size={17} /> {info.phone}
                </a>
              )}
              {info.whatsapp && (
                <a
                  href={whatsappHref(info.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-tap items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-medium hover:bg-white/15"
                >
                  <WhatsAppIcon size={17} /> WhatsApp
                </a>
              )}
              {info.instagram && (
                <a
                  href={instagramHref(info.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Instagram @${info.instagram.replace(/^@/, "")}`}
                  className="flex min-h-tap min-w-tap items-center justify-center gap-2 rounded-full bg-white/10 px-3 text-sm font-medium hover:bg-white/15"
                >
                  <InstagramIcon size={17} />
                </a>
              )}
            </div>
          </div>

          <div className="rounded-card bg-white/10 p-4 text-sm">
            {info.address && (
              <p className="flex gap-2.5">
                <PinIcon size={17} className="mt-0.5 shrink-0 opacity-80" />
                <span>{info.address}</span>
              </p>
            )}
            {hours.length > 0 && (
              <div className={`flex gap-2.5 ${info.address ? "mt-3" : ""}`}>
                <ClockIcon size={17} className="mt-0.5 shrink-0 opacity-80" />
                <div className="space-y-1">
                  {hours.map((seg) => (
                    <p key={seg.days}>
                      <span className="font-semibold">{seg.days}:</span> {seg.hours.join(" · ")}
                    </p>
                  ))}
                  {closedLabel && <p className="opacity-80">{closedLabel}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
