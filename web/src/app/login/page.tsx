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
    <div className="flex min-h-screen items-center justify-center bg-[#f5f6f8] text-[#171d29] p-4 sm:p-6">
      <div className="w-full max-w-md rounded-[24px] border border-[#dce2e3] bg-white p-8 sm:p-10 shadow-xl">
        <Link href="/" className="inline-block mb-6 group">
          <img
            src="/brand/logo-dark.png"
            alt="Harizeon"
            className="h-9 w-auto object-contain"
          />
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171d29]">
          Log in
        </h1>
        <p className="mt-1 text-sm text-muted">
          Access your verified perimeter assets and scans
        </p>

        {created ? (
          <p className="mt-4 rounded-xl border border-[#02acc5]/30 bg-[#02acc5]/10 p-3 text-sm text-[#171d29]">
            Account created successfully. Log in to continue.
          </p>
        ) : null}

        <LoginForm />

        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-[#02acc5] hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
