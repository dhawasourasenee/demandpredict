import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  children: ReactNode;
};

export function Button({ variant = "default", className = "", ...rest }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 " +
    "disabled:pointer-events-none disabled:opacity-50";
  const styles =
    variant === "outline"
      ? "border border-zinc-300 bg-white hover:bg-zinc-50"
      : variant === "ghost"
        ? "hover:bg-zinc-100"
        : "bg-zinc-900 text-white hover:bg-zinc-800";
  return (
    <button type="button" className={`${base} px-4 py-2 ${styles} ${className}`} {...rest} />
  );
}
