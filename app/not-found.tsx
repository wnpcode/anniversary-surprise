import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">CATATAN TIDAK DITEMUKAN</p>
      <h1>Halaman ini<br /><em>belum jadi kenangan.</em></h1>
      <Link className="text-link" href="/arsip/">Kembali ke arsip <span aria-hidden="true">→</span></Link>
    </main>
  );
}
