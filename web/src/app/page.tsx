import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { BenchmarkSection } from "@/components/landing/BenchmarkSection";
import { PlatformSection } from "@/components/landing/PlatformSection";
import { ThreatVectorsSection } from "@/components/landing/ThreatVectorsSection";
import { ComplianceCarouselSection } from "@/components/landing/ComplianceCarouselSection";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { GuaranteesCarouselSection } from "@/components/landing/GuaranteesCarouselSection";
import { EnginesMatrixSection } from "@/components/landing/EnginesMatrixSection";
import { PricingCarouselSection } from "@/components/landing/PricingCarouselSection";
import { BottomCtaSection } from "@/components/landing/BottomCtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Harizeon · Security Infrastructure, Provisioned Like Cloud",
  description:
    "Scan, monitor, and prove the security of everything you own. Self-serve. Metered. No sales call.",
};

export default async function LandingPage() {
  const store = await cookies();
  const hasSession = !!store.get("hz_session");

  return (
    <div className="ps-landing relative flex min-h-screen flex-col bg-white text-[#171d29]">
      <LandingHeader hasSession={hasSession} />
      <main id="main" className="flex-1">
        <HeroSection />
        <StatsSection />
        <BenchmarkSection />
        <PlatformSection />
        <ThreatVectorsSection />
        <ComplianceCarouselSection />
        <WorkflowSection />
        <GuaranteesCarouselSection />
        <EnginesMatrixSection />
        <PricingCarouselSection />
        <BottomCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
