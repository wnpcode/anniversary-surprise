import type { Metadata } from "next";
import { ScreenSetup } from "@/components/ScreenSetup";

export const metadata: Metadata = {
  title: "Mode Layar | Tahun Pertama Kita",
  robots: { index: false, follow: false },
};

export default function ScreenPage() {
  return <ScreenSetup />;
}
