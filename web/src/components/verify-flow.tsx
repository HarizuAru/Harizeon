"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  initiateVerificationAction,
  checkVerificationAction,
  type VerificationResult,
} from "@/lib/asset-actions";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cx } from "@/lib/cx";

type Props = {
  assetId: string;
  assetValue: string;
  assetType: string;
  initial: { method: string; status: string; token: string; verified_at: string | null } | null;
};

type Method = "dns_txt" | "http_file";

function dnsInstructions(assetValue: string, token: string) {
  return {
    host: `_harizeon-verify.${assetValue}`,
    type: "TXT",
    value: `harizeon-site-verification=${token}`,
  };
}

function httpInstructions(assetValue: string, assetType: string, token: string) {
  const url =
    assetType === "url"
      ? new URL(assetValue).origin + "/.well-known/harizeon-verification.txt"
      : `http://${assetValue}/.well-known/harizeon-verification.txt`;
  return { url, path: "/.well-known/harizeon-verification.txt", content: token };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — the block below is text-selectable
    }
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="h-8 shrink-0 border border-line px-2 font-mono text-xs uppercase tracking-[0.08em] text-muted transition-colors duration-200 hover:bg-subtle hover:text-ink"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function RecordRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">{k}</p>
        <p className="break-all font-mono text-sm text-ink">{v}</p>
      </div>
      <CopyButton text={v} />
    </div>
  );
}

export function VerifyFlow({ assetId, assetValue, assetType, initial }: Props) {
  const dnsAllowed = assetType === "domain" || assetType === "subdomain";
  const [method, setMethod] = useState<Method>(dnsAllowed ? "dns_txt" : "http_file");
  const [verification, setVerification] = useState<VerificationResult | null>(
    initial && initial.status === "pending"
      ? { method: initial.method, status: "pending", token: initial.token }
      : initial?.status === "verified"
        ? { method: initial.method, status: "verified", verified_at: initial.verified_at }
        : null,
  );
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const doCheck = useCallback(async () => {
    setChecking(true);
    try {
      const res = await checkVerificationAction(assetId);
      if ("error" in res) {
        setError(res.error);
      } else {
        setError(null);
        setVerification((prev) => ({ ...(prev ?? { method }), ...res }));
        if (res.status === "verified" && timer.current) {
          clearInterval(timer.current);
          timer.current = null;
        }
      }
    } finally {
      setChecking(false);
    }
  }, [assetId, method]);

  useEffect(() => {
    if (verification?.status !== "pending") return;
    timer.current = setInterval(() => {
      void doCheck();
    }, 10_000);
    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [verification?.status, doCheck]);

  async function start(m: Method) {
    setMethod(m);
    setError(null);
    const res = await initiateVerificationAction(assetId, m);
    if ("error" in res) {
      setError(res.error);
    } else {
      setVerification(res);
      void doCheck();
    }
  }

  if (verification?.status === "verified") {
    return (
      <div className="flex flex-col gap-4 border border-line bg-canvas p-6">
        <StatusBadge>Verified</StatusBadge>
        <p className="text-sm text-muted">
          Ownership proven via {verification.method === "dns_txt" ? "DNS TXT record" : "HTTP file"}.
          {verification.verified_at ? ` Verified at ${verification.verified_at}.` : ""}
        </p>
        <p className="font-mono text-xs text-faint">
          Keep the record in place — ownership is re-checked periodically, and scanning pauses if it disappears.
        </p>
        <div>
          <Link href={`/assets/${assetId}`} className="text-sm font-medium text-ink underline">
            Back to asset
          </Link>
        </div>
      </div>
    );
  }

  if (assetType === "ip") {
    return (
      <div className="flex max-w-2xl flex-col gap-4 border border-line bg-canvas p-6">
        <StatusBadge>Manual review required</StatusBadge>
        <p className="text-sm text-muted">
          IP assets are not verified automatically. Authorizing an IP needs reverse DNS plus a
          signed authorization form, reviewed by a human — so an automated verification request
          for this asset is rejected.
        </p>
        <p className="font-mono text-xs text-faint">
          To authorize this IP, contact support@harizeon.com with proof of control.
        </p>
        <div>
          <Link href={`/assets/${assetId}`} className="text-sm font-medium text-ink underline">
            Back to asset
          </Link>
        </div>
      </div>
    );
  }

  const token = verification && "token" in verification ? (verification.token as string | undefined) : undefined;
  const showInstructions = verification?.status === "pending" && token;
  const instructions =
    showInstructions && verification.method === "dns_txt"
      ? dnsInstructions(assetValue, token)
      : showInstructions
        ? httpInstructions(assetValue, assetType, token)
        : null;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <p className="text-sm text-muted">We only scan assets you can prove you control.</p>

      <div className="flex gap-2" role="tablist" aria-label="Verification method">
        {dnsAllowed ? (
          <button
            type="button"
            role="tab"
            aria-selected={method === "dns_txt"}
            onClick={() => void start("dns_txt")}
            className={cx(
              "h-10 border px-4 text-sm font-medium transition-colors duration-200",
              method === "dns_txt"
                ? "border-accent bg-accent text-accent-ink"
                : "border-line bg-canvas text-muted hover:bg-subtle hover:text-ink",
            )}
          >
            DNS TXT (recommended)
          </button>
        ) : null}
        <button
          type="button"
          role="tab"
          aria-selected={method === "http_file"}
          onClick={() => void start("http_file")}
          className={cx(
            "h-10 border px-4 text-sm font-medium transition-colors duration-200",
            method === "http_file"
              ? "border-accent bg-accent text-accent-ink"
              : "border-line bg-canvas text-muted hover:bg-subtle hover:text-ink",
          )}
        >
          HTTP file
        </button>
      </div>

      {error ? (
        <p role="alert" className="font-mono text-sm font-bold text-ink">
          ERROR: {error}
        </p>
      ) : null}

      {instructions && verification && verification.method === "dns_txt" ? (
        <div className="flex flex-col gap-3 border border-line bg-canvas p-4">
          <RecordRow k="Host" v={(instructions as { host: string }).host} />
          <RecordRow k="Type" v="TXT" />
          <RecordRow k="Value" v={(instructions as { value: string }).value} />
        </div>
      ) : null}
      {instructions && verification && verification.method === "http_file" ? (
        <div className="flex flex-col gap-3 border border-line bg-canvas p-4">
          <RecordRow k="URL" v={(instructions as { url: string }).url} />
          <RecordRow k="File content" v={(instructions as { content: string }).content} />
        </div>
      ) : null}

      {!verification ? (
        <div>
          <Button onClick={() => void start(method)} size="md">
            Start verification
          </Button>
        </div>
      ) : null}

      {verification?.status === "pending" ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void doCheck()} size="md" disabled={checking}>
            {checking ? "Checking..." : "Check now"}
          </Button>
          <p className="font-mono text-xs text-faint">
            {checking
              ? "Checking..."
              : verification && "message" in verification && verification.message
                ? verification.message
                : "Not found yet. Auto-checks every 10 seconds."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
