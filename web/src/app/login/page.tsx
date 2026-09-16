"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

const inputClass =
  "h-10 w-full border border-line bg-canvas px-3 text-sm text-ink placeholder:text-faint focus:border-ink";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-sm border border-line bg-canvas p-6">
        <p className="font-mono text-sm font-bold uppercase tracking-[0.05em] text-ink">
          Harizeon
        </p>
        <h1 className="mt-4 text-[2rem] font-bold leading-tight tracking-[-0.02em] text-ink">
          Log in
        </h1>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-xs font-medium uppercase tracking-[0.08em] text-muted"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-xs font-medium uppercase tracking-[0.08em] text-muted"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          <Button type="submit" size="md" className="mt-2 w-full">
            Log in
          </Button>
        </form>

        <p className="mt-4 font-mono text-xs text-faint">
          Demo shell — authentication is implemented in milestone W02.
        </p>
      </div>
    </div>
  );
}
