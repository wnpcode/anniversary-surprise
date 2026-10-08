"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SCREEN_CHANGE_EVENT, SCREEN_STORAGE_KEY } from "@/lib/remote";

function readFlag() {
  try {
    return window.localStorage.getItem(SCREEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function ScreenSetup() {
  const [active, setActive] = useState<boolean | null>(null);
  const [storageBlocked, setStorageBlocked] = useState(false);

  useEffect(() => {
    setActive(readFlag());
  }, []);

  function update(next: boolean) {
    try {
      if (next) window.localStorage.setItem(SCREEN_STORAGE_KEY, "1");
      else window.localStorage.removeItem(SCREEN_STORAGE_KEY);
      setStorageBlocked(false);
    } catch {
      setStorageBlocked(true);
      return;
    }
    setActive(next);
    window.dispatchEvent(new Event(SCREEN_CHANGE_EVENT));
  }

  const status = active === null ? "Memeriksa layar ini…" : active ? "Layar ini aktif" : "Layar ini belum aktif";

  return (
    <main className="login-page screen-page">
      <p className="eyebrow">MODE LAYAR</p>
      <h1>Jadikan laptop ini<br /><em>layar perayaan.</em></h1>
      <p className="login-message">
        {active
          ? "Biarkan tab ini terbuka di laptop atau TV. Perintah dari HP akan dijalankan di layar ini."
          : "Aktifkan di laptop atau TV yang sudah masuk, lalu kendalikan dari HP lewat halaman remote."}
      </p>
      <p className="screen-status" aria-live="polite">
        <span className={`status-dot${active ? "" : " status-dot-off"}`} aria-hidden="true" />
        {status}
      </p>
      {active !== null && (
        <button className="screen-button" type="button" onClick={() => update(!active)}>
          {active ? "Matikan mode layar" : "Jadikan layar ini"}
        </button>
      )}
      {storageBlocked && <p className="screen-error" role="alert">Browser ini menolak menyimpan pengaturan layar.</p>}
      {active && (
        <div className="screen-links">
          <Link className="text-link" href="/perayaan/pembuka/">Mulai dari pembuka <span aria-hidden="true">→</span></Link>
          <Link className="text-link" href="/">Buka catatan <span aria-hidden="true">→</span></Link>
        </div>
      )}
      <Link className="text-link screen-remote-link" href="/remote/">Buka remote di HP <span aria-hidden="true">↗</span></Link>
    </main>
  );
}
