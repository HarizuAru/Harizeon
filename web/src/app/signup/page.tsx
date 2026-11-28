import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
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
          Create Account
        </h1>
        <p className="mt-1 text-sm text-muted">
          Start defending your perimeter with automated continuous scans
        </p>

        <SignupForm />

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#02acc5] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
