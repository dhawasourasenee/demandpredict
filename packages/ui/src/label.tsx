import type { LabelHTMLAttributes, ReactNode } from "react";

export function Label({ children, className = "", ...rest }: LabelHTMLAttributes<HTMLLabelElement> & { children: ReactNode }) {
  return (
    <label className={`text-sm font-medium text-zinc-700 ${className}`} {...rest}>
      {children}
    </label>
  );
}
