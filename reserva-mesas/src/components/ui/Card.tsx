import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md";
};

const PADDING = { none: "", sm: "p-4", md: "p-5" };

export function Card({ className = "", padding = "md", ...props }: CardProps) {
  return (
    <div
      className={`rounded-card border border-stone-200/70 bg-white shadow-card ${PADDING[padding]} ${className}`}
      {...props}
    />
  );
}
