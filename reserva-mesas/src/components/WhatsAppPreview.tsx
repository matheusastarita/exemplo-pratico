import { SimulatedBadge } from "@/components/DemoNotice";
import { WhatsAppIcon } from "@/components/icons";

/** Prévia estilo WhatsApp da mensagem que o cliente receberia (simulada na demonstração). */
export function WhatsAppPreview({
  body,
  sender,
  time,
  simulated = true,
}: {
  body: string;
  sender: string;
  /** "HH:MM" exibido no canto da bolha. */
  time?: string;
  simulated?: boolean;
}) {
  // Quebra o texto em pedaços pra deixar links clicáveis sem dangerouslySetInnerHTML.
  const parts = body.split(/(https?:\/\/\S+|\/r\/[A-Z0-9]{8})/g);

  return (
    <div className="overflow-hidden rounded-card border border-stone-200 bg-white text-left">
      <div className="flex items-center justify-between gap-2 bg-[#075E54] px-4 py-2.5 text-white">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <WhatsAppIcon size={18} />
          <span className="truncate">{sender}</span>
        </span>
        {simulated && <SimulatedBadge label="Simulado" />}
      </div>
      <div className="bg-[#ECE5DD] px-3 py-4">
        <div className="relative max-w-[90%] rounded-xl rounded-tl-sm bg-white px-3 py-2 text-[14px] leading-relaxed text-stone-800 shadow-sm">
          <p className="whitespace-pre-wrap break-words">
            {parts.map((part, i) =>
              /^(https?:\/\/|\/r\/)/.test(part) ? (
                <a key={i} href={part} className="text-[#027eb5] underline">
                  {part}
                </a>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </p>
          {time && <span className="mt-1 block text-right text-[10px] text-stone-500">{time}</span>}
        </div>
      </div>
    </div>
  );
}
