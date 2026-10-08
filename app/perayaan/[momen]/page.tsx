import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { FireworksCelebration } from "@/components/FireworksCelebration";
import {
  CELEBRATION_DATE,
  CELEBRATION_MODES,
  CELEBRATION_TITLE,
  isCelebrationMode,
  type CelebrationMode,
} from "@/lib/celebration";

export const dynamicParams = false;

export const viewport: Viewport = {
  themeColor: "#17231d",
  colorScheme: "dark",
  viewportFit: "cover",
};

const DESCRIPTIONS: Record<CelebrationMode, string> = {
  pembuka: "Sebelum masuk ke catatan, ada kembang api kecil dulu.",
  penutup: "Penutup catatan, dengan kembang api kecil.",
};

type CelebrationPageProps = { params: Promise<{ momen: string }> };

export function generateStaticParams() {
  return CELEBRATION_MODES.map((momen) => ({ momen }));
}

export async function generateMetadata({ params }: CelebrationPageProps): Promise<Metadata> {
  const { momen } = await params;
  if (!isCelebrationMode(momen)) return {};
  return { title: `${CELEBRATION_TITLE} | ${CELEBRATION_DATE}`, description: DESCRIPTIONS[momen] };
}

export default async function CelebrationPage({ params }: CelebrationPageProps) {
  const { momen } = await params;
  if (!isCelebrationMode(momen)) notFound();
  return (
    <main>
      <noscript>
        <style>{".celebration__text { visibility: visible !important; }"}</style>
      </noscript>
      <FireworksCelebration key={momen} mode={momen} />
    </main>
  );
}
