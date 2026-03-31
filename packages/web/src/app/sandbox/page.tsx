import type { Metadata } from "next";
import SectionPlaceholder from "@/components/layout/SectionPlaceholder";
import { getNavigationItemBySlug } from "@/lib/site";

const section = getNavigationItemBySlug("sandbox");

export const metadata: Metadata = {
  title: section?.label,
  description: section?.description,
};

export default function SandboxPage() {
  if (!section) {
    return null;
  }

  return (
    <SectionPlaceholder
      description={section.description}
      plannedFeatures={section.plannedFeatures}
      title={section.label}
    />
  );
}
