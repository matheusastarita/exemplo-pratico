import type { InputHTMLAttributes } from "react";
import { SearchIcon } from "@/components/icons";

export function SearchInput({
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <div className={`relative ${className}`}>
      <SearchIcon
        size={18}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
      />
      <input
        type="search"
        className="w-full rounded-control border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-900 transition-colors placeholder:text-stone-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
        {...props}
      />
    </div>
  );
}
