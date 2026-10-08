import Link from "next/link";
import type { Anniversary } from "@/data/anniversaries";
import { AlbumGallery } from "@/components/AlbumGallery";
import { LetterReveal } from "@/components/LetterReveal";
import { MotionEffects } from "@/components/MotionEffects";

export function AnniversaryExperience({ edition, archiveMode = false }: { edition: Anniversary; archiveMode?: boolean }) {
  return (
    <MotionEffects>
      <a className="skip-link" href="#isi">Langsung ke isi</a>
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Tahun pertama kita, ke atas">T / K</Link>
        <p className="release-label"><span className="status-dot" aria-hidden="true" /> CATATAN PRIBADI · VERSI {String(edition.year).padStart(2, "0")}</p>
        {archiveMode ? (
          <form className="logout-form" action="/api/arsip/logout" method="post">
            <button className="date-label archive-nav archive-logout" type="submit">KELUAR</button>
          </form>
        ) : <Link className="date-label archive-nav" href="/arsip/" prefetch={false}>ARSIP</Link>}
      </header>

      <main id="isi">
        <section className="opening" id="atas" aria-labelledby="headline">
          <div className="opening-copy">
            <p className="eyebrow" data-motion="hero-eyebrow">{edition.eyebrow}</p>
            <h1 id="headline" className="hero-title" data-motion="hero-title">
              {edition.headlineLead}{" "}<em>{edition.headlineEmphasis}</em>
            </h1>
            <p className="intro" data-motion="hero-intro">{edition.intro}</p>
            <a className="text-link" href="#catatan">Lihat catatannya <span aria-hidden="true">↓</span></a>
          </div>

          <div className="cover" data-motion="cover" role="img" aria-label={`Sampul kenangan anniversary tahun ke-${edition.year}`}>
            <div className="cover-topline"><span>ARSIP KITA</span><span>{String(edition.year).padStart(2, "0")} / 01</span></div>
            <div className="cover-art" aria-hidden="true">
              <span className="orbit orbit-one" /><span className="orbit orbit-two" />
              <span className="sun" /><span className="horizon" />
              <span className="cover-caption">hari pertama<br />dan semua sesudahnya</span>
            </div>
            <p className="cover-foot"><span>DISIMPAN DENGAN SAYANG</span><span aria-hidden="true">✳</span></p>
          </div>
          <span className="margin-note" aria-hidden="true">commit: memilih satu sama lain</span>
        </section>

        <section className="memory-section" id="catatan" aria-labelledby="memory-title">
          <div className="section-heading">
            <p className="eyebrow">Perubahan yang paling kusuka</p>
            <h2 id="memory-title">Bukan fitur baru.{" "}<em>Hari-hari kecil yang jadi milik kita.</em></h2>
          </div>
          <div className="memory-list" role="list" aria-label="Catatan kenangan">
            {edition.memories.map((memory, index) => (
              <article className="memory-entry" data-motion="memory" role="listitem" key={`${edition.slug}-${memory.label}`}>
                <p className="memory-number">{String(index + 1).padStart(2, "0")} / NOTE</p>
                <h3>{memory.label}</h3>
                <p>{memory.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="conversation" id="pertanyaan" aria-labelledby="conversation-title">
          <p className="eyebrow">Biar malam ini punya cerita lagi</p>
          <h2 id="conversation-title">Satu pertanyaan untuk{" "}<em>kita jawab bersama.</em></h2>
          <div className="question-slip" data-motion="conversation">
            <span className="slip-index">01</span>
            <p>{edition.conversationPrompt}</p>
            <span className="slip-caption">nggak ada jawaban salah</span>
          </div>
        </section>

        <section className="letter-section" id="surat" aria-labelledby="letter-title">
          <div className="letter-intro">
            <p className="eyebrow">Ada satu hal lagi</p>
            <h2 id="letter-title">Pesan kecil,{" "}<em>disimpan di sini.</em></h2>
          </div>
          <LetterReveal letter={edition.letter} signoff={edition.signoff} />
        </section>

        <section className="album-section" id="album" aria-labelledby="album-title" data-motion="album">
          <div className="album-heading">
            <p className="album-index">ALBUM KITA · {String(edition.year).padStart(2, "0")}</p>
            <p className="eyebrow">Potongan hari yang ingin kusimpan</p>
            <h2 id="album-title">Hari-hari yang ingin kita ingat.</h2>
          </div>
          {edition.photos.length > 0 ? <AlbumGallery photos={edition.photos} year={edition.year} /> : (
            <p className="album-empty">Foto-foto dari awal kita sampai hari ini akan disimpan di sini.</p>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>DIRANGKAI DENGAN SENGAJA, DISIMPAN BERSAMA.</p>
        <div className="footer-links">
          {!archiveMode && <Link href="/perayaan/penutup/">Tutup dengan kembang api →</Link>}
          <Link href="/arsip/" prefetch={false}>Buka arsip →</Link>
        </div>
      </footer>
    </MotionEffects>
  );
}
