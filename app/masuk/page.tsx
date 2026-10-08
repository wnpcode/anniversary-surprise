import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buka Arsip | Tahun Pertama Kita",
  robots: { index: false, follow: false },
};

export default async function ArchiveLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextParam = params.next;
  const next = Array.isArray(nextParam) ? nextParam[0] ?? "/arsip/" : nextParam ?? "/arsip/";
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const message = error === "invalid"
    ? "Username atau password belum cocok."
    : error === "setup"
      ? "Akses arsip belum dikonfigurasi (ARCHIVE_USERNAME, ARCHIVE_PASSWORD, ARCHIVE_SESSION_SECRET)."
      : error === "secret"
        ? "Session secret arsip kurang dari 32 byte. Buat ulang dengan openssl rand -base64 32."
        : "Masukkan kredensial untuk membuka arsip kita.";

  return (
    <main className="login-page">
      <p className="eyebrow">ARSIP KENANGAN</p>
      <h1>Buka cerita<br /><em>yang kita simpan.</em></h1>
      <p className="login-message" aria-live="polite">{message}</p>
      <form className="login-form" action="/api/arsip/login" method="post">
        <input type="hidden" name="next" value={next} />
        <label htmlFor="archive-username">Username</label>
        <input
          id="archive-username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={256}
          required
        />
        <label htmlFor="archive-password">Password</label>
        <input
          id="archive-password"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={1024}
          required
        />
        <button type="submit">Buka arsip <span aria-hidden="true">→</span></button>
      </form>
      <a className="text-link" href="/">Kembali ke halaman utama <span aria-hidden="true">↗</span></a>
    </main>
  );
}
