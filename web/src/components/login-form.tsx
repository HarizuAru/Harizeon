"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/lib/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
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
          placeholder="you@company.com"
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
    </form>
  );
}
