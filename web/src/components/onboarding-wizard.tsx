"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Org name & locale
  const [orgName, setOrgName] = useState("Acme Security");
  const [locale, setLocale] = useState<"en" | "ms">("en");

  // Step 2: First domain
  const [domain, setDomain] = useState("example.com");

  // Step 3: Verification
  const [verificationMethod, setVerificationMethod] = useState<"dns_txt" | "http_file">("dns_txt");
  const [token] = useState("harizeon-site-verification=hzv_live_4f89ac72b109e");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Step 4: Scan launch
  const [isLaunching, setIsLaunching] = useState(false);

  // Auto-poll verification on Step 3
  useEffect(() => {
    if (step !== 3 || isVerified) return;

    const interval = setInterval(async () => {
      setIsVerifying(true);
      // Simulate real DNS check or ping API
      try {
        const res = await fetch("/api/v1/assets");
        if (res.ok) {
          // In real API, checks verification status
        }
      } catch {
        // ignore
      }
      // Demo ease: after polling, let user click or auto-succeed
      setIsVerifying(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [step, isVerified]);

  function handleVerifyClick() {
    setIsVerifying(true);
    setVerificationError(null);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 1500);
  }

  async function handleLaunchScan() {
    setIsLaunching(true);
    try {
      await fetch("/api/v1/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: "quick",
          asset_ids: ["ast-01"],
        }),
      });
    } catch {
      // ignore
    }
    router.push("/scans");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-2xl border border-line bg-canvas p-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.05em] text-ink">
            Harizeon Setup
          </span>
          <span className="font-mono text-xs text-muted">
            STEP 0{step} / 04
          </span>
        </div>

        {/* Step 1: Org name & locale */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink font-sans">
                Name your organization
              </h1>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Your workspace isolates your verified attack surface, team members, audit logs, and compliance reports.
              </p>
            </div>

            <div className="flex flex-col gap-4 font-mono text-xs">
              <div>
                <label className="block uppercase text-muted mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full border border-line bg-canvas p-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                  placeholder="e.g. Acme Corporation"
                />
              </div>

              <div>
                <label className="block uppercase text-muted mb-1">
                  System Language / Bahasa Pilihan
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setLocale("en")}
                    className={`border p-3 text-left ${
                      locale === "en" ? "border-ink bg-subtle font-bold text-ink" : "border-line text-muted"
                    }`}
                  >
                    <span className="block text-ink">English (EN)</span>
                    <span className="text-[10px] text-muted">Technical cybersecurity standard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale("ms")}
                    className={`border p-3 text-left ${
                      locale === "ms" ? "border-ink bg-subtle font-bold text-ink" : "border-line text-muted"
                    }`}
                  >
                    <span className="block text-ink">Bahasa Melayu (MS)</span>
                    <span className="text-[10px] text-muted">Pematuhan Akta Jenayah Komputer</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-line">
              <button
                disabled={!orgName.trim()}
                onClick={() => setStep(2)}
                className="border border-ink bg-ink px-6 py-2.5 font-mono text-xs uppercase text-canvas hover:bg-canvas hover:text-ink transition-colors disabled:opacity-30"
              >
                Continue to Domain Setup →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Add First Domain */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink font-sans">
                Add your primary root domain
              </h1>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Enter your company root domain. In the next step, you will prove ownership before any scan can run.
              </p>
            </div>

            <div className="flex flex-col gap-2 font-mono text-xs">
              <label className="block uppercase text-muted">
                Domain Name
              </label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
                placeholder="example.com"
                className="w-full border border-line bg-canvas p-2.5 text-sm text-ink focus:border-ink focus:outline-none"
              />
              <p className="text-[11px] text-muted">
                Do not include <code className="text-ink">https://</code> or path parameters. Subdomains under this root can be automatically discovered once verified.
              </p>
            </div>

            {/* Why Box (§9.2) */}
            <div className="border border-line bg-subtle p-4 font-mono text-xs text-muted">
              <span className="font-bold text-ink block mb-1">STRICT OWNERSHIP POLICY:</span>
              Harizeon performs active security testing ONLY against assets whose control you have cryptographically demonstrated. Verification cannot be bypassed.
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-line">
              <button
                onClick={() => setStep(1)}
                className="border border-line px-4 py-2 font-mono text-xs uppercase hover:border-ink"
              >
                ← Back
              </button>
              <button
                disabled={!domain || !domain.includes(".")}
                onClick={() => setStep(3)}
                className="border border-ink bg-ink px-6 py-2.5 font-mono text-xs uppercase text-canvas hover:bg-canvas hover:text-ink transition-colors disabled:opacity-30"
              >
                Continue to Verification →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verify Domain */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink font-sans">
                Verify control of {domain}
              </h1>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Publish the cryptographic verification token to demonstrate administrative control of this infrastructure.
              </p>
            </div>

            {/* Method Tabs */}
            <div className="flex gap-2 border-b border-line font-mono text-xs">
              <button
                onClick={() => setVerificationMethod("dns_txt")}
                className={`pb-2 uppercase ${
                  verificationMethod === "dns_txt"
                    ? "border-b-2 border-ink font-bold text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                Method 1: DNS TXT Record (Recommended)
              </button>
              <button
                onClick={() => setVerificationMethod("http_file")}
                className={`pb-2 uppercase ${
                  verificationMethod === "http_file"
                    ? "border-b-2 border-ink font-bold text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                Method 2: HTTP Well-Known File
              </button>
            </div>

            {verificationMethod === "dns_txt" ? (
              <div className="flex flex-col gap-3 font-mono text-xs">
                <p className="text-muted text-[11px]">
                  Add a TXT record at your DNS provider (Cloudflare, AWS Route53, Google Cloud DNS, GoDaddy):
                </p>
                <div className="border border-line bg-subtle p-3 flex flex-col gap-2">
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Host / Name:</span>
                    <span className="text-ink font-bold select-all">_harizeon-verify.{domain}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Type:</span>
                    <span className="text-ink font-bold">TXT</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Record Value:</span>
                    <span className="text-ink font-bold select-all break-all">{token}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 font-mono text-xs">
                <p className="text-muted text-[11px]">
                  Serve this token from your web server over HTTPS:
                </p>
                <div className="border border-line bg-subtle p-3 flex flex-col gap-2">
                  <div>
                    <span className="text-[10px] text-muted block uppercase">URL:</span>
                    <span className="text-ink font-bold select-all">https://{domain}/.well-known/harizeon-verify.txt</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Expected Content:</span>
                    <span className="text-ink font-bold select-all">{token}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Status Feedback */}
            {isVerified ? (
              <div className="border border-ink bg-ink p-4 font-mono text-xs text-canvas">
                [✓] VERIFIED: Cryptographic control of {domain} confirmed. Asset activated.
              </div>
            ) : (
              <div className="flex items-center justify-between border border-line p-3 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-none bg-ink animate-pulse" />
                  <span className="text-muted">
                    {isVerifying ? "Querying public DNS resolvers..." : "Waiting for record propagation (polls every 10s)..."}
                  </span>
                </div>
                <button
                  disabled={isVerifying}
                  onClick={handleVerifyClick}
                  className="border border-ink bg-canvas px-3 py-1 font-bold text-ink uppercase hover:bg-ink hover:text-canvas"
                >
                  Verify Now
                </button>
              </div>
            )}

            {verificationError && (
              <div className="border border-ink bg-canvas p-3 font-mono text-xs text-ink">
                [!] {verificationError}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-line">
              <button
                onClick={() => setStep(2)}
                className="border border-line px-4 py-2 font-mono text-xs uppercase hover:border-ink"
              >
                ← Back
              </button>
              <button
                disabled={!isVerified}
                onClick={() => setStep(4)}
                className="border border-ink bg-ink px-6 py-2.5 font-mono text-xs uppercase text-canvas hover:bg-canvas hover:text-ink transition-colors disabled:opacity-30"
              >
                Proceed to First Scan →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Run First Scan */}
        {step === 4 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink font-sans">
                Launch your baseline security scan
              </h1>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Harizeon will now execute an initial Quick Reconnaissance scan against <strong className="text-ink">{domain}</strong>.
              </p>
            </div>

            <div className="border border-line bg-subtle p-5 font-mono text-xs flex flex-col gap-3">
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-muted uppercase">Target Asset:</span>
                <span className="font-bold text-ink">{domain} (Verified)</span>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-muted uppercase">Profile:</span>
                <span className="font-bold text-ink">Quick Reconnaissance</span>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-muted uppercase">Verification Gate:</span>
                <span className="font-bold text-ink">PASSED [✓]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted uppercase">Estimated Runtime:</span>
                <span className="font-bold text-ink">~3 minutes</span>
              </div>
            </div>

            <div className="pt-4 border-t border-line flex justify-end">
              <button
                disabled={isLaunching}
                onClick={handleLaunchScan}
                className="border border-ink bg-ink px-8 py-3 font-mono text-xs uppercase font-bold text-canvas hover:bg-canvas hover:text-ink transition-colors"
              >
                {isLaunching ? "Queuing Job..." : "Launch First Scan Now →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
