import type { Metadata } from "next";
import Link from "next/link";
import { listAnniversaries } from "@/lib/anniversaries";

export const metadata: Metadata = {
  title: "Kelola Surat | Tahun Pertama Kita",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const PREVIEW_LENGTH = 80;

function letterPreview(letter: string) {
  const flat = letter.replace(/\s+/g, " ").trim();
  return flat.length > PREVIEW_LENGTH ? `${flat.slice(0, PREVIEW_LENGTH)}…` : flat;
}

export default async function AdminPage() {
  const editions = await listAnniversaries();

  return (
    <main className="archive-page">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Kembali ke anniversary terbaru">T / K</Link>
        <p className="release-label">KELOLA SURAT</p>
        <form className="logout-form" action="/api/arsip/logout" method="post">
          <button className="date-label archive-nav archive-logout" type="submit">KELUAR</button>
        </form>
      </header>
      <section className="archive-content" aria-labelledby="admin-title">
        <p className="eyebrow">SURAT TIAP EDISI</p>
        <h1 id="admin-title">Pilih edisi<br /><em>yang suratnya diubah.</em></h1>
        {editions.length > 0 ? (
          <ol className="archive-list">
            {editions.map((edition) => (
              <li key={edition.slug}>
                <Link className="archive-item" href={`/admin/${edition.slug}/`}>
                  <span className="archive-year">{String(edition.year).padStart(2, "0")}</span>
                  <span className="archive-title">{edition.dateLabel}</span>
                  <span className="archive-description">{letterPreview(edition.letter)}</span>
                  <span className="archive-arrow" aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : <p className="archive-empty">Belum ada edisi yang tersimpan.</p>}
      </section>
      <footer className="footer">
        <p>DISIMPAN BERSAMA.</p>
        <div className="footer-links">
          <Link href="/arsip/">Buka arsip →</Link>
          <Link href="/">Kembali ke cerita terbaru ↑</Link>
        </div>
      </footer>
    </main>
  );
}
