"use client";

import { useEffect, useRef } from "react";

interface ShortcutGroup {
  name: string;
  items: {
    keys: string[];
    description: string;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    name: "Global Navigation (Chords)",
    items: [
      { keys: ["g", "d"], description: "Go to Dashboard" },
      { keys: ["g", "f"], description: "Go to Findings" },
      { keys: ["g", "a"], description: "Go to Perimeter Assets" },
      { keys: ["g", "s"], description: "Go to Scans History" },
      { keys: ["g", "r"], description: "Go to Compliance Reports" },
      { keys: ["g", "c"], description: "Go to Scan Schedules" },
      { keys: ["g", "l"], description: "Go to Audit Trail & Logs" },
      { keys: ["g", "k"], description: "Go to API Credentials" },
      { keys: ["g", "n"], description: "Go to Notifications" },
    ],
  },
  {
    name: "Overlays & Tools",
    items: [
      { keys: ["/"], description: "Open unified search palette" },
      { keys: ["Alt", "S"], description: "Alternate search trigger" },
      { keys: ["`"], description: "Toggle CloudShell terminal drawer" },
      { keys: ["?"], description: "Toggle this keyboard shortcuts cheat-sheet" },
      { keys: ["Esc"], description: "Dismiss active overlay / drawer / modal" },
    ],
  },
  {
    name: "List & Table Navigation",
    items: [
      { keys: ["j"], description: "Move focus to next row in table" },
      { keys: ["k"], description: "Move focus to previous row in table" },
      { keys: ["Enter"], description: "Open detail page for focused row" },
      { keys: ["x"], description: "Toggle selection of focused row (if selectable)" },
    ],
  },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl border-2 border-ink bg-canvas p-6 text-ink shadow-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-muted">
              Harizeon · Keyboard-First Interface
            </span>
            <h2 id="shortcuts-modal-title" className="text-xl font-bold font-sans tracking-tight text-ink">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="border border-line bg-canvas px-2.5 py-1 font-mono text-xs text-muted hover:border-ink hover:text-ink transition-colors cursor-pointer"
            aria-label="Close shortcuts modal"
          >
            [Esc] Close
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-1">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.name} className="flex flex-col gap-2.5">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted border-b border-line pb-1">
                {group.name}
              </span>
              <ul className="flex flex-col gap-2">
                {group.items.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="text-muted font-sans">{item.description}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <span key={kIdx} className="flex items-center">
                          {kIdx > 0 && (
                            <span className="text-[10px] text-faint mx-0.5 font-mono">
                              +
                            </span>
                          )}
                          <kbd className="inline-flex min-w-[22px] items-center justify-center border border-line bg-subtle px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink shadow-none">
                            {k}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-6 border-t border-line pt-3 flex items-center justify-between font-mono text-[11px] text-faint">
          <span>Press &apos;?&apos; anytime to toggle this reference.</span>
          <span>HARIZEON INSTRUMENT v0.1</span>
        </div>
      </div>
    </div>
  );
}
