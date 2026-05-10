import type { ReactNode } from "react";

/** Minimal chrome: no faux product navigation; content-focused layout only. */
export function PageFrame({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-white">{children}</div>;
}

export function CalcIconCircle({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-green ${className}`}
      aria-hidden
    >
      <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <path d="M8 7h3M13 7h3M8 11h8M8 15h5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function InfoTip({ label }: { label: string }) {
  return (
    <span className="relative inline-flex cursor-help items-center" title={label}>
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-400 text-[9px] font-semibold text-neutral-500">
        i
      </span>
    </span>
  );
}
