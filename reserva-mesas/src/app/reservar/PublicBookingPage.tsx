import { RestaurantHeader } from "@/components/RestaurantHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { ErrorState } from "@/components/ui/EmptyState";
import { getPublicInfo } from "@/lib/restaurant";
import { getSession } from "@/lib/session";
import { BookingFlow } from "./BookingFlow";

type Params = Record<string, string | string[] | undefined>;

/** Página pública de reserva (sem login) — usada em "/" e em "/reservar". */
export async function PublicBookingPage({ params }: { params: Params }) {
  const [{ info, ok }, { user, profile }] = await Promise.all([getPublicInfo(), getSession()]);

  const party = Number(typeof params.pessoas === "string" ? params.pessoas : "") || null;
  const area = typeof params.area === "string" ? params.area : null;
  const prefill =
    user && profile?.role === "client"
      ? { name: profile.full_name ?? "", phone: profile.phone ?? "", email: user.email ?? "" }
      : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <RestaurantHeader info={info} signedIn={Boolean(user)} />
      <main className="mx-auto mt-5 max-w-6xl px-4 sm:px-6 lg:-mt-4">
        {ok ? (
          <BookingFlow info={info} prefill={prefill} initialParty={party} initialArea={area} />
        ) : (
          <div className="pt-8">
            <ErrorState message="Não conseguimos carregar as reservas agora. Tente de novo em instantes ou fale com o restaurante." />
          </div>
        )}
      </main>
      <PublicFooter info={info} />
    </div>
  );
}
