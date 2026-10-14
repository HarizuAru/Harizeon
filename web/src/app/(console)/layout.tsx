import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DEMO_MODE, SESSION_COOKIE } from "@/lib/api";

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE);

  // In production without demo mode, strictly enforce session redirect
  if (!session && !DEMO_MODE) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
