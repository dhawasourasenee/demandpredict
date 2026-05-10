/** Decorative SVG chrome — pen-drawn line weight, editorial accent color */
export function EditorialDoodleStrip() {
  return (
    <div className="editorial-doodle-strip" aria-hidden>
      <svg
        className="editorial-doodle-svg"
        viewBox="0 0 720 56"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>decoration</title>
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 38c12-18 28-22 44-14s24 28 40 22 18-32 34-28 30 24 46 18 22-26 38-20 28 20 44 14 30-8 46-2 34 18 50 12 24-24 40-18 28 14 44 8 32-12 48-6 36 16 52 10 28-20 44-14 32 12 48 6 36-8 52-2 40 14 56 8" />
          <circle cx="52" cy="22" r="3.2" />
          <circle cx="118" cy="30" r="2.4" />
          <circle cx="186" cy="18" r="2.8" />
          <circle cx="248" cy="26" r="2.2" />
          <circle cx="312" cy="16" r="3" />
          <circle cx="378" cy="28" r="2.5" />
          <circle cx="442" cy="20" r="2.7" />
          <circle cx="508" cy="24" r="2.3" />
          <circle cx="574" cy="18" r="3.1" />
          <circle cx="640" cy="26" r="2.6" />
          <circle cx="702" cy="22" r="2.4" />
          <path d="M24 14c4-6 10-8 16-4s8 12 4 16-12 4-16-2-2-12 4-14" />
          <path d="M160 12c3-5 8-7 13-4s6 10 3 13-9 3-13-1-1-10 4-12" />
          <path d="M296 10c5-7 12-9 18-5s9 14 5 18-14 5-18-2-3-14 5-17" />
          <path d="M432 14c4-6 9-8 15-5s7 11 4 15-11 4-15-2-2-11 4-13" />
          <path d="M568 12c3-5 9-7 14-4s7 10 3 14-10 4-14-1-1-10 4-12" />
          <path d="M88 44l6-10 6 10M252 42l5-9 5 9M416 44l6-10 6 10M580 42l5-9 5 9" />
        </g>
      </svg>
    </div>
  );
}

export function EditorialDocMark({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "editorial-mark"}
      viewBox="0 0 40 48"
      width="40"
      height="48"
      aria-hidden
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 6h14l8 8v26a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z" />
        <path d="M24 6v8h8M14 22h16M14 28h12M14 34h16" />
      </g>
    </svg>
  );
}
