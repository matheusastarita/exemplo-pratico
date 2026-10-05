import type { Metadata } from "next";
import { PublicBookingPage } from "./PublicBookingPage";

export const metadata: Metadata = { title: "Reservar mesa" };

export default async function ReservarPage({ searchParams }: PageProps<"/reservar">) {
  return <PublicBookingPage params={await searchParams} />;
}
