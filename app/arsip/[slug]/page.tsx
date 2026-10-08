import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnniversaryExperience } from "@/components/AnniversaryExperience";
import { getAnniversaryBySlug } from "@/lib/anniversaries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const edition = await getAnniversaryBySlug(slug);
  return { title: edition ? `${edition.dateLabel} | Tahun Pertama Kita` : "Arsip tidak ditemukan" };
}

export default async function ArchiveEditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const edition = await getAnniversaryBySlug(slug);
  if (!edition) notFound();
  return <AnniversaryExperience edition={edition} archiveMode />;
}
