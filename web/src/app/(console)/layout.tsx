import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  if (!store.get("hz_session")) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
