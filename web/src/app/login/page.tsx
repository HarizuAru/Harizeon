import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-sm border border-line bg-canvas p-6">
        <p className="font-mono text-sm font-bold uppercase tracking-[0.05em] text-ink">Harizeon</p>
        <h1 className="mt-4 text-[2rem] font-bold leading-tight tracking-[-0.02em] text-ink">Log in</h1>
        {created ? (
          <p className="mt-3 border border-line bg-subtle p-3 text-sm text-ink">
            Account created. Log in to continue.
          </p>
        ) : null}
        <LoginForm />
        <p className="mt-4 text-sm text-muted">
          No account?{" "}
          <Link href="/signup" className="font-medium text-ink underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
