"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { maskPhoneInput, normalizePhoneBR } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/constants";
import { rememberPhone } from "@/lib/reservas";

/** Busca a reserva pelo código + celular (as duas informações juntas, sempre). */
export function FindReservation() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length !== 8) return setError("O código tem 8 letras e números, como K7M2Q9XA.");
    if (!normalizePhoneBR(phone)) return setError("Celular inválido. Use DDD + número.");
    setLoading(true);
    const { error: rpcError } = await createClient().rpc("get_reservation_public", { p_code: clean, p_phone: phone });
    setLoading(false);
    if (rpcError) return setError(friendlyErrorMessage(rpcError));
    rememberPhone(clean, phone);
    router.push(`/r/${clean}`);
  }

  return (
    <form onSubmit={submit} className="mt-5 flex flex-col gap-4" noValidate>
      <Input
        id="code"
        label="Código da reserva"
        autoComplete="off"
        autoCapitalize="characters"
        placeholder="Ex.: K7M2Q9XA"
        value={code}
        maxLength={10}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="font-mono tracking-widest"
      />
      <Input
        id="phone"
        label="Celular usado na reserva"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="(11) 98888-7777"
        value={phone}
        onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "Buscando..." : "Encontrar reserva"}
      </Button>
    </form>
  );
}
