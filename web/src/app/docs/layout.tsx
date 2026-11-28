import type { ReactNode } from "react";
import { ConsoleOrPublicShell } from "@/components/console-or-public-shell";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <ConsoleOrPublicShell>{children}</ConsoleOrPublicShell>;
}
