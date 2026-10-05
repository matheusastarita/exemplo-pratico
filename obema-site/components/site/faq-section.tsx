import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faq } from "@/lib/content";
import { cn } from "@/lib/utils";

export function FaqSection({
  className,
  items = faq,
  title = "Perguntas que sempre aparecem.",
}: {
  className?: string;
  items?: { q: string; a: string }[];
  title?: string;
}) {
  return (
    <section className={cn("py-24 md:py-32", className)} aria-labelledby="faq-title">
      <div className="wrap grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <p className="eyebrow">Dúvidas</p>
          <h2 id="faq-title" className="mt-5 text-display font-bold tracking-[-0.035em]">
            {title}
          </h2>
          <p className="mt-6 max-w-[40ch] text-lede text-muted-foreground">
            Não achou a sua? Manda no WhatsApp. Em horário comercial, a resposta costuma sair no mesmo dia.
          </p>
        </div>
        <Accordion type="single" collapsible className="border-t border-border">
          {items.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger className="font-display text-lg font-bold tracking-tight md:text-xl">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="max-w-[60ch] text-base text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
