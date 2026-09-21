"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface CloudShellDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeRegion: string;
}

interface CommandHistoryEntry {
  command: string;
  output: string;
  timestamp: string;
}

const INITIAL_GREETING = `Harizeon CloudShell v0.1.0
A read-only client over the control-plane REST API. Type 'help'.
`;

export function CloudShellDrawer({ isOpen, onClose, activeRegion }: CloudShellDrawerProps) {
  const [history, setHistory] = useState<CommandHistoryEntry[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [isOpen, history]);

  if (!isOpen) return null;

  const runCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    const ts = new Date().toLocaleTimeString();
    let output = "";

    const parts = cmd.split(/\s+/);
    const primary = parts[0].toLowerCase();
    const sub = parts[1]?.toLowerCase();

    if (primary === "clear") {
      setHistory([]);
      setInputVal("");
      return;
    }

    // Every data command reads the real API. This shell never invents rows.
    const list = async (path: string, row: (r: Record<string, unknown>) => string, empty: string) => {
      try {
        const res = await fetch(`/api/v1${path}`);
        if (!res.ok) return `error: HTTP ${res.status}`;
        const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
        const items = json.data ?? [];
        return items.length ? items.map(row).join("\n") : empty;
      } catch {
        return "error: cannot reach the API. Is it running?";
      }
    };

    if (primary === "help") {
      output = `HARIZEON CLI (hz) — read-only:
  hz assets     List perimeter assets and verification status
  hz findings   List open findings by severity
  hz scans      List recent scans and progress
  date          Print the current time
  clear         Clear the terminal
Write actions live in the console or the REST API (see /docs/api).`;
    } else if (primary === "hz" || primary === "harizeon") {
      if (sub === "assets") {
        output = await list("/assets?limit=50", (a) => `${a.id}  ${a.type}  ${a.verification_status}  ${a.value}`, "No assets registered.");
      } else if (sub === "findings") {
        output = await list("/findings?limit=50&status=open", (f) => `${f.id}  ${f.severity}  ${f.status}  ${f.asset_value ?? "-"}  ${f.title}`, "No open findings.");
      } else if (sub === "scans" || sub === "scan") {
        output = await list("/scans?limit=20", (s) => `${s.id}  ${s.profile}  ${s.status}  ${s.progress_pct}%`, "No scans yet.");
      } else {
        output = `Unknown hz subcommand: '${sub ?? ""}'. Type 'help'.`;
      }
    } else if (primary === "date") {
      output = new Date().toUTCString();
    } else {
      output = `command not found: ${primary}. Type 'help'.`;
    }

    setHistory((prev) => [...prev, { command: cmd, output, timestamp: ts }]);
    setInputVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runCommand(inputVal);
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col border-t-2 border-ink bg-canvas font-mono shadow-2xl transition-all duration-200 ${
        isMaximized ? "h-[80vh]" : "h-80"
      }`}
    >
      {/* CloudShell Header Bar (AWS style) */}
      <div className="flex h-10 items-center justify-between border-b border-line bg-subtle px-4 select-none">
        <div className="flex items-center gap-3">
          <span className="border border-ink bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-canvas">
            &gt;_ CloudShell
          </span>
          <span className="text-xs font-semibold text-ink">
            Harizeon CloudShell · {activeRegion}
          </span>
          <span className="hidden text-[11px] text-muted sm:inline">
            (bash environment with pre-authenticated &apos;hz&apos; CLI)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="border border-line bg-canvas px-2 py-0.5 text-muted hover:border-ink hover:text-ink"
            title={isMaximized ? "Restore size" : "Maximize"}
          >
            {isMaximized ? "🗗 Restore" : "🗖 Maximize"}
          </button>
          <button
            onClick={() => setHistory([])}
            className="border border-line bg-canvas px-2 py-0.5 text-muted hover:border-ink hover:text-ink"
            title="Clear terminal buffer"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="border border-line bg-canvas px-2.5 py-0.5 font-bold text-muted hover:border-ink hover:text-ink"
            title="Close CloudShell"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Quick Command Chips */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-canvas px-4 py-1.5 text-[11px]">
        <span className="text-faint uppercase tracking-wider text-[10px]">Shortcuts:</span>
        {[
          "hz status",
          "hz assets list",
          "hz scan list",
          "hz findings",
          "hz scan start --target example.com",
          "hz whoami",
          "help",
        ].map((chip) => (
          <button
            key={chip}
            onClick={() => runCommand(chip)}
            className="border border-line bg-subtle px-2 py-0.5 text-muted hover:border-ink hover:text-ink transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 overflow-y-auto p-4 text-xs leading-relaxed text-ink selection:bg-ink selection:text-canvas">
        <pre className="whitespace-pre-wrap font-mono text-faint mb-4">{INITIAL_GREETING}</pre>

        {history.map((entry, idx) => (
          <div key={idx} className="mb-3">
            <div className="flex items-center gap-2 text-muted">
              <span className="font-bold text-ink">hz@console [{activeRegion}]:~$</span>
              <span className="font-semibold text-ink">{entry.command}</span>
              <span className="ml-auto text-[10px] text-faint">{entry.timestamp}</span>
            </div>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-ink bg-subtle/50 p-2 border-l border-line">
              {entry.output}
            </pre>
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center gap-2 pt-1">
          <span className="font-bold text-ink shrink-0">hz@console [{activeRegion}]:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type 'help', 'hz status', or an 'hz' CLI command..."
            className="flex-1 bg-transparent font-mono text-xs text-ink outline-none placeholder:text-faint"
            autoFocus
          />
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Terminal Footer */}
      <div className="flex items-center justify-between border-t border-line bg-subtle px-4 py-1 text-[10px] text-faint">
        <div className="flex items-center gap-4">
          <span>Target Cluster: {activeRegion}</span>
          <span>Protocol: TLS 1.3 / gRPC Web</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/docs/api" className="hover:text-ink hover:underline">
            API Reference
          </Link>
          <span>·</span>
          <Link href="/docs/quickstart" className="hover:text-ink hover:underline">
            CLI Quickstart
          </Link>
        </div>
      </div>
    </div>
  );
}
