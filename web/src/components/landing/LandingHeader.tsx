"use client";

import { PublicHeader } from "@/components/public-header";

export function LandingHeader({ hasSession }: { hasSession?: boolean }) {
  return <PublicHeader hasSession={hasSession} variant="transparent" />;
}
