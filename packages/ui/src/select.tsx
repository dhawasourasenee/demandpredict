import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={
        `flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm ` +
        `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${className}`
      }
      {...props}
    >
      {children}
    </select>
  );
}
