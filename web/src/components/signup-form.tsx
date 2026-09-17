"use client";

import { useActionState } from "react";
import { signupAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/login-form";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, null);
  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className={labelClass}>
          Your name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Ada Lovelace"
          className={inputClass}
        />
      </div>
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
          Password (min 12 characters)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          placeholder="••••••••••••"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="orgName" className={labelClass}>
          Organization name
        </label>
        <input
          id="orgName"
          name="orgName"
          type="text"
          autoComplete="organization"
          required
          placeholder="Acme Sdn. Bhd."
          className={inputClass}
        />
      </div>
      {state?.error ? (
        <p role="alert" className="font-mono text-sm font-bold text-ink">
          ERROR: {state.error}
        </p>
      ) : null}
      <Button type="submit" size="md" className="mt-2 w-full" disabled={pending}>
        {pending ? "Creating account..." : "Create account"}
      </Button>
      <p className="font-mono text-xs text-faint">
        One account creates one organization. You will verify your email next.
      </p>
    </form>
  );
}
