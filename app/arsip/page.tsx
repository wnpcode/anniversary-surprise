import Link from "next/link";
import { listAnniversaries } from "@/lib/anniversaries";

export const metadata = { title: "Arsip Anniversary | Tahun Pertama Kita" };
export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const orderedEditions = await listAnniversaries();

  return (
    <main className="archive-page">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Kembali ke anniversary terbaru">T / K</Link>
        <p className="release-label">ARSIP KENANGAN</p>
        <form className="logout-form" action="/api/arsip/logout" method="post">
          <button className="date-label archive-nav archive-logout" type="submit">KELUAR</button>
        </form>
      </header>
      <section className="archive-content" aria-labelledby="archive-title">
        <p className="eyebrow">Cerita yang terus bertambah</p>
        <h1 id="archive-title">Tahun-tahun<br /><em>yang kita simpan.</em></h1>
        <p className="archive-intro">Satu halaman untuk tiap anniversary. Yang terbaru ada di depan; cerita sebelumnya tetap di sini.</p>
        {orderedEditions.length > 0 ? (
          <ol className="archive-list">
            {orderedEditions.map((edition) => (
              <li key={edition.slug}>
                <Link className="archive-item" href={`/arsip/${edition.slug}/`}>
                  <span className="archive-year">{String(edition.year).padStart(2, "0")}</span>
                  <span className="archive-title">{edition.dateLabel}</span>
                  <span className="archive-description">{edition.headlineLead}</span>
                  <span className="archive-arrow" aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : <p className="archive-empty">Belum ada cerita yang tersimpan.</p>}
      </section>
      <footer className="footer"><p>DISIMPAN BERSAMA.</p><Link href="/">Kembali ke cerita terbaru ↑</Link></footer>
    </main>
  );
}
