import { cn } from "@/lib/utils";

/** Moldura de celular em CSS para prints de perfil. */
export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[739/1600] w-full max-w-[300px] rounded-[2.6rem] border-[10px] border-ink bg-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6),0_0_0_1px_rgba(238,242,247,0.12)]",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="absolute top-2.5 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-ink"
      />
      <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-white">{children}</div>
    </div>
  );
}
