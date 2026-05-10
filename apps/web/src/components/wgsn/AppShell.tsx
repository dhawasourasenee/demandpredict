import type { ReactNode } from "react";

const topBlack = [
  "MyWGSN",
  "Insight",
  "Fashion",
  "Beauty",
  "Food & Drink",
  "Interiors",
  "Consumer Tech",
  "Sports & Out",
];

const topCalc = [
  "Market",
  "Season",
  "Research & Planning",
  "Development",
  "In-Season & Hindsight",
  "Director's Intelligence",
];

const subWhite = ["Home", "Future Strategies", "Market", "Season", "Research & Create", "Category", "Buying"];

function NavChevron() {
  return (
    <svg className="ml-0.5 inline h-3 w-3 opacity-70" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <path d="M2.5 4.5 L6 8 L9.5 4.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

type ShellProps = {
  children: ReactNode;
  /** Use alternate top nav labelling to match reference frames */
  navVariant?: "wgsn" | "calculator";
};

export function AppShell({ children, navVariant = "wgsn" }: ShellProps) {
  const top = navVariant === "calculator" ? topCalc : topBlack;
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <nav className="flex h-9 items-center gap-5 overflow-x-auto border-b border-neutral-800 bg-wgsn-nav px-4 text-[11px] font-medium text-white">
        {navVariant === "wgsn" && <span className="shrink-0 pr-4 font-bold tracking-tight">WGSN</span>}
        {top.map((item) => (
          <button
            key={item}
            type="button"
            className="flex shrink-0 items-center whitespace-nowrap text-white/95 hover:text-white"
          >
            {item}
            <NavChevron />
          </button>
        ))}
      </nav>
      <nav className="flex h-10 items-center gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-3 text-[11px] text-neutral-900">
        {subWhite.map((item, i) => (
          <span key={item} className="flex shrink-0 items-center">
            {i === 0 ? (
              <span className="px-2 py-1 font-medium">{item}</span>
            ) : (
              <>
                {i === 1 && <span className="mx-1 h-4 w-px bg-neutral-300" />}
                <button
                  type="button"
                  className="flex shrink-0 items-center rounded px-2 py-1 text-neutral-800 hover:bg-neutral-100"
                >
                  {item}
                  <NavChevron />
                </button>
              </>
            )}
          </span>
        ))}
      </nav>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-neutral-200 bg-neutral-900 py-3 text-center text-[10px] text-white/80">
        Opportunity Calculator · enterprise dashboard styling reference layout
      </footer>
    </div>
  );
}

export function CalcIconCircle({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-wgsn-green ${className}`}
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
