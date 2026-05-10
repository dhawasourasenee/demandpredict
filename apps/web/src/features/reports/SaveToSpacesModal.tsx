import { useEffect, useState } from "react";

type Row = {
  id: string;
  label: string;
  icon: "folderPlus" | "folderIn";
  accent?: boolean;
};

const rows: Row[] = [
  { id: "new", label: "Create New", icon: "folderPlus", accent: true },
  { id: "bookmarks", label: "My bookmarks", icon: "folderIn" },
  { id: "untitled", label: "Untitled", icon: "folderIn" },
  { id: "aw", label: "A/W Jackets", icon: "folderIn" },
];

function FolderIcon({ variant }: { variant: Row["icon"] }) {
  if (variant === "folderPlus") {
    return (
      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path d="M3 7h5l2 2h11v11H3V7z" />
        <path d="M12 13h8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
      <path d="M3 7h6l2 2h12v11H3V7z" />
      <path d="M14 13l3-3 3 3" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  defaultUserId?: string;
  onSaved: () => void;
  createSpaceAttach: (name: string, userId: string) => Promise<void>;
};

export default function SaveToSpacesModal({
  open,
  onClose,
  defaultUserId = "demo-user",
  onSaved,
  createSpaceAttach,
}: Props) {
  const [selected, setSelected] = useState("new");
  const [spaceName, setSpaceName] = useState("New space");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelected("new");
    setHint(null);
    setBusy(false);
  }, [open]);

  if (!open) return null;

  async function onSave() {
    setHint(null);
    if (selected !== "new") {
      setHint("Spaces list sync is preview-only — choose Create New to save.");
      return;
    }
    const name = spaceName.trim() || "New space";
    setBusy(true);
    try {
      await createSpaceAttach(name, defaultUserId);
      onSaved();
      onClose();
    } catch (e) {
      setHint((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-md rounded-lg bg-white shadow-modal">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Save to Spaces</h2>
          <button type="button" className="text-xl leading-none text-neutral-500 hover:text-neutral-900" onClick={onClose}>
            ×
          </button>
        </div>
        <ul className="max-h-[280px] overflow-y-auto py-1">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setSelected(r.id)}
                className={`flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-neutral-50 ${selected === r.id ? "bg-neutral-100" : ""}`}
              >
                <FolderIcon variant={r.icon} />
                <span className={`flex-1 ${r.accent ? "font-medium text-blue-600" : "text-neutral-900"}`}>{r.label}</span>
                <span className="text-neutral-400">›</span>
              </button>
            </li>
          ))}
        </ul>
        {selected === "new" && (
          <div className="border-t border-neutral-100 px-5 py-3">
            <label className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Space name</label>
            <input
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
            />
          </div>
        )}
        {hint && <p className="border-t border-amber-100 bg-amber-50 px-5 py-2 text-xs text-amber-900">{hint}</p>}
        <div className="flex items-center justify-end gap-6 border-t border-neutral-100 px-5 py-4">
          <button type="button" className="text-sm text-neutral-500 hover:text-neutral-800" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6 2h11l5 5v13a3 3 0 01-3 3H6a3 3 0 01-3-3V5a3 3 0 013-3zm8 0v6h7M8 17h9v4H8v-4z" />
            </svg>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
