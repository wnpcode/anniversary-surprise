import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnniversaryBySlug, getLatestAnniversary } from "@/lib/anniversaries";

export const metadata: Metadata = {
  title: "Kelola Surat | Tahun Pertama Kita",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const SAVED_MESSAGE = "Surat tersimpan. Perubahan langsung tampil di halaman.";
const ERROR_MESSAGES: Record<string, string> = {
  empty: "Surat dan penutup tidak boleh kosong.",
  long: "Surat maksimal 5000 karakter dan penutup maksimal 120 karakter.",
  notfound: "Edisi tidak ditemukan.",
  unavailable: "Surat belum bisa disimpan. Coba lagi sebentar lagi.",
};
const DEFAULT_MESSAGE = "Ubah isi surat lalu simpan. Baris baru menjadi paragraf baru.";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminEditionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [edition, latest] = await Promise.all([getAnniversaryBySlug(slug), getLatestAnniversary()]);
  if (!edition) notFound();

  const error = firstValue(query.error);
  const saved = firstValue(query.saved) === "1";
  const errorMessage = !saved && error && Object.hasOwn(ERROR_MESSAGES, error) ? ERROR_MESSAGES[error] : undefined;
  const message = saved ? SAVED_MESSAGE : errorMessage ?? DEFAULT_MESSAGE;
  const viewHref = latest?.slug === edition.slug ? "/" : `/arsip/${edition.slug}/`;

  return (
    <main className="archive-page">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Kembali ke anniversary terbaru">T / K</Link>
        <p className="release-label">KELOLA SURAT</p>
        <form className="logout-form" action="/api/arsip/logout" method="post">
          <button className="date-label archive-nav archive-logout" type="submit">KELUAR</button>
        </form>
      </header>
      <section className="archive-content admin-content" aria-labelledby="admin-title">
        <p className="eyebrow">SURAT · TAHUN KE-{String(edition.year).padStart(2, "0")}</p>
        <h1 id="admin-title">Pesan kecil,<br /><em>ditulis ulang.</em></h1>
        <p className={errorMessage ? "admin-message admin-message-error" : "admin-message"} aria-live="polite">{message}</p>
        <form className="admin-form" action="/api/admin/surat/" method="post">
          <input type="hidden" name="slug" value={edition.slug} />
          <label htmlFor="admin-letter">Surat</label>
          <textarea id="admin-letter" name="letter" rows={12} maxLength={5000} required defaultValue={edition.letter} />
          <label htmlFor="admin-signoff">Penutup</label>
          <input id="admin-signoff" name="signoff" type="text" maxLength={120} required defaultValue={edition.signoff} />
          <button type="submit">Simpan surat <span aria-hidden="true">→</span></button>
        </form>
        <div className="admin-links">
          <a className="text-link" href={viewHref}>Lihat di halaman <span aria-hidden="true">↗</span></a>
          <Link className="text-link" href="/admin/">Semua edisi <span aria-hidden="true">↗</span></Link>
        </div>
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
