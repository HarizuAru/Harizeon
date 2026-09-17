import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { NewAssetForm } from "@/components/new-asset-form";

export const metadata: Metadata = { title: "Add asset" };

export default function NewAssetPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Add asset" description="Harizeon can only scan what you prove you own." />
      <NewAssetForm />
    </div>
  );
}
