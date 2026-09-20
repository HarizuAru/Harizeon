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

const INITIAL_GREETING = `Harizeon CloudShell v0.1.0-prod (x86_64-unknown-linux-musl)
Connected to scanner cluster: ap-southeast-1 | Node: hz-worker-edge-04
Authenticated as: hariziskandar0504@gmail.com (Role: SecurityAdmin, Org: hz-org-production)
Type 'help' for available CLI commands, or click the quick action chips below.
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

  const runCommand = (rawCmd: string) => {
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

    if (primary === "help") {
      output = `HARIZEON SECURITY CLI (hz) — Reference Guide:
  hz assets list                  List verified perimeter assets and monitoring status
  hz scan list                    Show recent scans, active phases, and progress
  hz scan start --target <asset>  Enqueue an immediate vulnerability scan
  hz findings                     Display active security findings and severity
  hz status                       Query health of Fastify API, Redis Streams, & Workers
  hz whoami                       Display active IAM session, role, and organization
  hz regions                      List operational scanning cluster regions
  clear                           Clear terminal buffer`;
    } else if (primary === "hz" || primary === "harizeon") {
      if (sub === "assets") {
        output = `ID        TYPE       STATUS    VERIFIED  TARGET VALUE
ast-001   domain     active    yes       example.com
ast-002   subdomain  active    yes       api.example.com
ast-003   ip         active    yes       203.0.113.10
(3 assets monitored, 100% verified ownership)`;
      } else if (sub === "scan") {
        if (parts[2] === "start") {
          const target = parts[4] || "example.com";
          const scanSuffix = (history.length + 1).toString(16).padStart(6, "0");
          output = `[+] Enqueuing scan for target: ${target}
[+] Profile: standard (port recon, TLS handshake, HTTP security headers)
[+] Region cluster: ${activeRegion}
[+] Scan ID issued: scn-${scanSuffix}
[i] Worker stream received job payload. Status: RUNNING. Check console at /scans.`;
        } else {
          output = `SCAN ID        PROFILE   STATUS     DURATION  FINDINGS  CREATED
scn-7b89f012   standard  completed  42s       3 new     2026-09-19 06:00:00
scn-3c11a098   quick     completed  14s       0 new     2026-09-18 12:00:00
scn-1f99d872   deep      completed  2m 18s    1 new     2026-09-17 02:00:00`;
        }
      } else if (sub === "findings") {
        output = `ID       SEVERITY  STATUS  CATEGORY         ASSET            TITLE
fnd-101  CRITICAL  OPEN    tls              example.com      TLS 1.0/1.1 enabled on public gateway
fnd-102  HIGH      OPEN    headers          example.com      Missing Content-Security-Policy header
fnd-103  MEDIUM    OPEN    exposed_service  203.0.113.10     Exposed Redis port on public interface
(3 open findings active. Total security score penalty: -13 pts)`;
      } else if (sub === "status") {
        output = `SYSTEM COMPONENT          STATUS       LATENCY   METRICS
Fastify Control Plane     OPERATIONAL  14ms      API v1 active
Redis Stream Workers      OPERATIONAL  1ms       Queue depth: 0, 4 consumers
Discovery Engines (CT)    OPERATIONAL  180ms     crt.sh & RDAP reachable
Probing Fleet (${activeRegion})  OPERATIONAL  24ms      Egress IP: 146.190.88.21`;
      } else if (sub === "whoami") {
        output = `User:           hariziskandar0504@gmail.com
Account ID:     9073-7530-3530
Role:           SecurityAdmin (Full RLS bypass on org assets)
Organization:   Harizeon SecOps (ID: org-prod-01)
Active Region:  ${activeRegion}`;
      } else if (sub === "regions") {
        output = `CLUSTER REGION              STATUS        LATENCY  FLEET SIZE
● ap-southeast-1 (Singapore) OPERATIONAL   18ms     4 workers (Current)
○ us-east-1 (N. Virginia)    OPERATIONAL   82ms     6 workers
○ eu-west-1 (Ireland)        OPERATIONAL   110ms    4 workers
○ ap-northeast-1 (Tokyo)     OPERATIONAL   64ms     4 workers`;
      } else {
        output = `Unknown hz subcommand: '${sub || ""}'. Type 'help' for command manual.`;
      }
    } else if (primary === "whoami") {
      output = `hariziskandar0504@gmail.com (Role: SecurityAdmin, Org: hz-org-production)`;
    } else if (primary === "date") {
      output = new Date().toUTCString();
    } else {
      output = `bash: ${primary}: command not found. Try 'hz status' or 'help'.`;
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
