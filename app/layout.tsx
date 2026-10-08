import type { Metadata } from "next";
import { RemoteScreen } from "@/components/RemoteScreen";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tahun Pertama Kita",
  description: "Catatan kecil untuk merayakan tahun pertama kita.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        {children}
        <RemoteScreen />
      </body>
    </html>
  );
}
