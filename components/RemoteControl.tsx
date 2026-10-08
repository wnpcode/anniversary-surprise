"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { REMOTE_LABELS, type RemoteCommand } from "@/lib/remote";

const STATUS_INTERVAL = 2_000;
const STATUS_RETRY = 4_000;
const CONNECTED_WINDOW = 5_000;

type Status = { now: string; screen: { seenAt: string; path: string } | null };
type Feedback = { kind: "sent"; label: string; at: number } | { kind: "failed" } | null;

const GROUPS: { title: string; commands: RemoteCommand[]; solid?: RemoteCommand[] }[] = [
  { title: "PERAYAAN", commands: ["pembuka", "penutup", "kembang-lewati", "kembang-ulang"], solid: ["pembuka", "penutup"] },
  { title: "CATATAN", commands: ["catatan", "gulir-atas", "gulir-catatan", "gulir-pertanyaan", "gulir-surat", "gulir-album"] },
  { title: "SURAT", commands: ["surat-buka", "surat-tutup"] },
  { title: "ALBUM", commands: ["album-buka", "album-tutup", "album-sebelumnya", "album-berikutnya"] },
];

function isStatus(value: unknown): value is Status {
  return typeof value === "object" && value !== null && "screen" in value && typeof (value as Status).now === "string";
}

function elapsedLabel(since: number, now: number) {
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  if (seconds < 2) return "baru saja";
  if (seconds < 60) return `${seconds} detik lalu`;
  return `${Math.floor(seconds / 60)} menit lalu`;
}

export function RemoteControl() {
  const [status, setStatus] = useState<Status | null>(null);
  const [statusFailed, setStatusFailed] = useState(false);
  const [expired, setExpired] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (expired) return;

    let cancelled = false;
    let timer: number | undefined;
    let inFlight = false;
    const controller = new AbortController();

    function schedule(delay: number) {
      window.clearTimeout(timer);
      if (!cancelled) timer = window.setTimeout(poll, delay);
    }

    async function poll() {
      if (cancelled || inFlight || document.hidden) return;
      inFlight = true;
      let delay = STATUS_INTERVAL;
      try {
        const response = await fetch("/api/remote/", { cache: "no-store", signal: controller.signal });
        if (cancelled) return;
        if (response.status === 401) {
          setExpired(true);
          return;
        }
        const data: unknown = response.ok ? await response.json() : null;
        if (cancelled) return;
        if (isStatus(data)) {
          setStatus(data);
          setStatusFailed(false);
        } else {
          setStatusFailed(true);
          delay = STATUS_RETRY;
        }
        setNow(Date.now());
      } catch {
        if (cancelled) return;
        setStatusFailed(true);
        delay = STATUS_RETRY;
      } finally {
        inFlight = false;
      }
      schedule(delay);
    }

    function handleVisibility() {
      if (document.hidden) window.clearTimeout(timer);
      else schedule(0);
    }

    document.addEventListener("visibilitychange", handleVisibility);
    poll();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [expired]);

  useEffect(() => {
    if (feedback?.kind !== "sent") return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [feedback]);

  const send = useCallback(async (command: RemoteCommand) => {
    try {
      const response = await fetch("/api/remote/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
        cache: "no-store",
      });
      if (response.status === 401) {
        setExpired(true);
        return;
      }
      if (!response.ok) throw new Error(`Remote responded with ${response.status}`);
      setNow(Date.now());
      setFeedback({ kind: "sent", label: REMOTE_LABELS[command], at: Date.now() });
    } catch {
      setFeedback({ kind: "failed" });
    }
  }, []);

  const screen = status?.screen ?? null;
  const connected = screen !== null && status !== null && Date.parse(status.now) - Date.parse(screen.seenAt) <= CONNECTED_WINDOW;
  const statusText = statusFailed
    ? "Status layar belum terbaca"
    : status === null
      ? "Memeriksa layar…"
      : connected
        ? `Layar terhubung · ${screen?.path}`
        : "Layar tidak aktif — buka /layar/ di laptop";

  return (
    <main className="remote-page">
      <header className="remote-header">
        <span className="wordmark" aria-hidden="true">T / K</span>
        <p className="remote-label">REMOTE · LAYAR</p>
      </header>
      <p className="remote-status" aria-live="polite">
        <span className={`status-dot${connected && !expired ? "" : " status-dot-off"}`} aria-hidden="true" />
        {expired ? <>Sesi habis, <Link href="/masuk/?next=/remote/">masuk lagi</Link></> : statusText}
      </p>
      {GROUPS.map((group) => (
        <section className="remote-group" key={group.title} aria-labelledby={`remote-${group.title}`}>
          <h2 className="remote-group-title" id={`remote-${group.title}`}>{group.title}</h2>
          <div className="remote-grid">
            {group.commands.map((command) => (
              <button
                className={`remote-button${group.solid?.includes(command) ? " remote-button-primary" : ""}`}
                type="button"
                key={command}
                onClick={() => send(command)}
              >
                {REMOTE_LABELS[command]}
              </button>
            ))}
          </div>
        </section>
      ))}
      <p className="remote-feedback" role="status" aria-live="polite">
        {feedback?.kind === "sent" && `Terkirim: ${feedback.label} · ${elapsedLabel(feedback.at, now)}`}
        {feedback?.kind === "failed" && "Gagal mengirim, coba lagi"}
      </p>
    </main>
  );
}
