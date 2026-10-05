import Link from "next/link";
import { getPublicInfo } from "@/lib/restaurant";
import { buttonClasses } from "@/components/ui/Button";

export default async function HomePage() {
  const { info } = await getPublicInfo();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-serif text-4xl font-bold text-brand-ink">{info.name}</h1>
      <Link href="/login" className={buttonClasses("primary", "lg")}>Entrar</Link>
    </main>
  );
}
