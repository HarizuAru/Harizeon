import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { DEMO_MODE, SESSION_COOKIE } from "@/lib/api";

export async function ConsoleOrPublicShell({ children }: { children: ReactNode }) {
  const store = await cookies();
  const hasSession = Boolean(store.get(SESSION_COOKIE)?.value) || DEMO_MODE;

  if (hasSession) {
    return (
      <AppShell>
        <div className="py-2">{children}</div>
      </AppShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f8] text-[#171d29]">
      <PublicHeader />
      <main className="flex-1 py-16 px-4 sm:px-6">{children}</main>
      <PublicFooter />
    </div>
  );
}
