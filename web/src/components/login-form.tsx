"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/lib/ui";

export function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(loginAction, null);

  const handleInstantDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof document !== "undefined") {
      const token = `mock-session-demo-${Date.now()}`;
      document.cookie = `hz_session=${token}; path=/; max-age=2592000; SameSite=None; Secure`;
      document.cookie = `hz_session=${token}; path=/; max-age=2592000; SameSite=Lax`;
    }
    router.push("/dashboard");
  };

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue="admin@harizeon.local"
          placeholder="admin@harizeon.local"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          defaultValue="HarizeonPass123!"
          placeholder="••••••••"
          className={inputClass}
        />
      </div>
      {state?.error ? (
        <p role="alert" className="font-mono text-sm font-bold text-ink">
          ERROR: {state.error}
        </p>
      ) : null}
      <Button type="submit" size="md" className="mt-2 w-full" disabled={pending}>
        {pending ? "Logging in..." : "Log in"}
      </Button>

      <div className="relative my-2 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <span className="relative bg-canvas px-2 font-mono text-[10px] text-faint uppercase">
          or demo access
        </span>
      </div>

      <button
        type="button"
        onClick={handleInstantDemo}
        className="border border-line bg-subtle py-2.5 text-center font-mono text-xs uppercase tracking-wider text-ink hover:border-ink hover:bg-canvas transition-colors cursor-pointer"
      >
        ⚡ Instant Console Access (1-Click Demo)
      </button>
    </form>
  );
}
