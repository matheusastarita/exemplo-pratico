"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowUpRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { services } from "@/lib/content";
import { whatsappLink } from "@/lib/site";
import { cn } from "@/lib/utils";

type Errors = Partial<Record<"name", string>>;

/**
 * O site não tem back-end: o formulário monta a mensagem e abre o WhatsApp
 * da OBEMA com o texto pronto. Nada é armazenado.
 */
export function ContactForm() {
  const id = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [sentLink, setSentLink] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();
    const instagram = String(data.get("instagram") ?? "").trim().replace(/^@?/, "@");
    const interests = data.getAll("interest").map(String);
    const message = String(data.get("message") ?? "").trim();

    if (!name) {
      setErrors({ name: "Diz pra gente como te chamar." });
      event.currentTarget.querySelector<HTMLInputElement>("[name=name]")?.focus();
      return;
    }
    setErrors({});

    const lines = [
      `Oi, OBEMA! Sou ${name}${company ? `, da ${company}` : ""}.`,
      instagram.length > 1 ? `Instagram: ${instagram}` : null,
      interests.length ? `Tenho interesse em: ${interests.join(", ")}.` : null,
      message || null,
    ].filter(Boolean);

    const link = whatsappLink(lines.join("\n"));
    setSentLink(link);
    window.open(link, "_blank", "noopener,noreferrer");
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-6" aria-describedby={`${id}-note`}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${id}-name`}>
            Seu nome <span className="text-muted-foreground">(obrigatório)</span>
          </Label>
          <Input
            id={`${id}-name`}
            name="name"
            autoComplete="name"
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${id}-name-error` : undefined}
          />
          {errors.name ? (
            <p id={`${id}-name-error`} className="text-sm font-medium text-destructive">
              {errors.name}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-company`}>Empresa</Label>
          <Input id={`${id}-company`} name="company" autoComplete="organization" />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-instagram`}>@ da empresa no Instagram</Label>
        <Input
          id={`${id}-instagram`}
          name="instagram"
          placeholder="@suaempresa"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={`${id}-instagram-hint`}
        />
        <p id={`${id}-instagram-hint`} className="text-sm text-muted-foreground">
          Com o @, a gente já chega na conversa sabendo o que faria primeiro.
        </p>
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-3 text-sm font-medium">O que você precisa?</legend>
        <div className="flex flex-wrap gap-2">
          {services.map((service) => (
            <label key={service.slug} className="cursor-pointer">
              <input type="checkbox" name="interest" value={service.title} className="peer sr-only" />
              <span
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full border border-input bg-card px-4 text-sm transition-colors",
                  "peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white",
                  "peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/40 hover:border-navy/40"
                )}
              >
                {service.title}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-message`}>Mensagem</Label>
        <Textarea id={`${id}-message`} name="message" rows={4} placeholder="Conta rapidinho sobre o seu negócio e a sua meta." />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p id={`${id}-note`} className="max-w-[42ch] text-sm text-muted-foreground">
          Ao enviar, o WhatsApp abre com a sua mensagem pronta. É só apertar enviar por lá.
        </p>
        <Button type="submit" size="lg" className="shrink-0">
          Enviar pelo WhatsApp
          <ArrowUpRight aria-hidden="true" />
        </Button>
      </div>

      <div aria-live="polite">
        {sentLink ? (
          <p className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm">
            <Check className="size-4 text-navy" aria-hidden="true" />
            Abrimos o WhatsApp numa nova aba com a sua mensagem.
            <a href={sentLink} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">
              Não abriu? Clique aqui.
            </a>
          </p>
        ) : null}
      </div>
    </form>
  );
}
