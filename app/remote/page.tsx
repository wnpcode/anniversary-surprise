import type { Metadata } from "next";
import { RemoteControl } from "@/components/RemoteControl";

export const metadata: Metadata = {
  title: "Remote | Tahun Pertama Kita",
  robots: { index: false, follow: false },
};

export default function RemotePage() {
  return <RemoteControl />;
}
