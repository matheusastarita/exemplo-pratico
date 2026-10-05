import { PublicBookingPage } from "./reservar/PublicBookingPage";

// A página inicial é a própria página de reserva do restaurante.
export default async function HomePage({ searchParams }: PageProps<"/">) {
  return <PublicBookingPage params={await searchParams} />;
}
