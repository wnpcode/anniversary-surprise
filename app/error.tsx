"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="database-error">
      <p className="eyebrow">ARSIP SEDANG SULIT DIBUKA</p>
      <h1>Catatan kita<br /><em>sebentar lagi kembali.</em></h1>
      <p>Belum bisa mengambil cerita sekarang. Coba muat ulang halaman ini.</p>
      <button type="button" onClick={reset}>Coba lagi</button>
    </main>
  );
}
