import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-sm border border-line bg-canvas p-6">
        <p className="font-mono text-sm font-bold uppercase tracking-[0.05em] text-ink">Harizeon</p>
        <h1 className="mt-4 text-[2rem] font-bold leading-tight tracking-[-0.02em] text-ink">Sign up</h1>
        <SignupForm />
        <p className="mt-4 text-sm text-muted">
          Have an account?{" "}
          <Link href="/login" className="font-medium text-ink underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
