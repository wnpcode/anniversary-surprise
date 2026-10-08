"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import type { AlbumPhoto } from "@/data/anniversaries";
import { subscribeRemoteCommand } from "@/lib/remote";

const PAGE_SIZE = 12;

function photoNumber(src: string) {
  return Number(src.split("/").pop()?.match(/^(\d+)/)?.[1] ?? 0);
}

function AlbumImage({ photo, sizes, loading = "lazy" }: { photo: AlbumPhoto; sizes: string; loading?: "lazy" | "eager" }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && !failed && (
        <span className="album-image-loading" role={loading === "eager" ? "status" : undefined} aria-hidden={loading === "lazy"}>
          <span className="album-loading-spinner" aria-hidden="true" />
          Memuat foto…
        </span>
      )}
      {failed ? (
        <span className="album-image-error" role="status">Foto belum bisa dimuat.</span>
      ) : (
        <Image
          className={`album-image${loaded ? " is-loaded" : ""}`}
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          loading={loading}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </>
  );
}

export function AlbumGallery({ photos, year }: { photos: AlbumPhoto[]; year: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const gallery = useRef<HTMLUListElement>(null);
  const nextFocus = useRef<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const orderedPhotos = useMemo(() => [...photos].sort((a, b) => photoNumber(a.src) - photoNumber(b.src)), [photos]);
  const activePhoto = activeIndex === null ? null : orderedPhotos[activeIndex];
  const isOpen = Boolean(activePhoto);
  const shown = Math.min(visibleCount, orderedPhotos.length);

  useEffect(() => {
    if (nextFocus.current === null) return;
    gallery.current?.querySelectorAll<HTMLButtonElement>("button")[nextFocus.current]?.focus();
    nextFocus.current = null;
  }, [visibleCount]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!isOpen) {
      if (element.open) element.close();
      return;
    }
    if (!element.open) element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (element.open) element.close();
    };
  }, [isOpen]);

  function movePhoto(direction: -1 | 1) {
    setActiveIndex((current) => current === null ? null : (current + direction + orderedPhotos.length) % orderedPhotos.length);
  }

  useEffect(() => subscribeRemoteCommand((command) => {
    const total = orderedPhotos.length;
    const step = (direction: -1 | 1) => setActiveIndex((current) => current === null ? null : (current + direction + total) % total);
    if (command === "album-buka" && total > 0) setActiveIndex(0);
    else if (command === "album-sebelumnya") step(-1);
    else if (command === "album-berikutnya") step(1);
    else if (command === "album-tutup") setActiveIndex(null);
  }), [orderedPhotos.length]);

  function handleViewerKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      movePhoto(event.key === "ArrowLeft" ? -1 : 1);
    }
  }

  function finishSwipe(event: TouchEvent<HTMLDivElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) movePhoto(dx < 0 ? 1 : -1);
  }

  return (
    <div className="album-collection">
      <div className="album-collection-bar">
        <span>{orderedPhotos.length} foto · Tahun ke-{year}</span>
        <span>Ketuk foto untuk melihat lebih dekat ↗</span>
      </div>
      <ul className="album-gallery" ref={gallery} aria-label={`Album anniversary tahun ke-${year}`}>
        {orderedPhotos.slice(0, shown).map((photo, index) => (
          <li className={`album-item${index === 0 ? " album-item-featured" : ""}`} key={photo.src}>
            <button className="album-thumbnail" type="button" aria-haspopup="dialog"
              aria-label={`Buka foto ${index + 1}: ${photo.caption ?? photo.alt}`} onClick={() => setActiveIndex(index)}>
              <span className="album-photo-window">
                <AlbumImage photo={photo} sizes={index === 0 ? "(max-width: 600px) 88vw, 45vw" : "(max-width: 600px) 43vw, (max-width: 900px) 28vw, 23vw"} />
                <span className="album-photo-open" aria-hidden="true">↗</span>
              </span>
              <span className="album-thumbnail-caption">
                <span className="album-photo-number">{String(index + 1).padStart(2, "0")} / {String(orderedPhotos.length).padStart(2, "0")}</span>
                {index === 0 && <span className="album-feature-title">Satu foto,<br /><em>banyak cerita.</em></span>}
                <span className="album-photo-label">{photo.caption ?? `Kenangan ${index + 1}`}</span>
                {index === 0 && <span className="album-feature-invite">Buka album kita <span aria-hidden="true">↗</span></span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="album-pagination">
        <p aria-live="polite">{shown} dari {orderedPhotos.length} foto</p>
        <div className="album-progress" aria-hidden="true"><span style={{ width: `${orderedPhotos.length ? shown / orderedPhotos.length * 100 : 0}%` }} /></div>
        {shown < orderedPhotos.length ? (
          <button type="button" onClick={() => { nextFocus.current = shown; setVisibleCount((count) => count + PAGE_SIZE); }}>Lihat {Math.min(PAGE_SIZE, orderedPhotos.length - shown)} foto berikutnya <span aria-hidden="true">↓</span></button>
        ) : <p className="album-end-note">Sampai di sini dulu. Ceritanya masih berlanjut.</p>}
      </div>
      <dialog className="album-viewer" ref={dialog} aria-label="Penampil foto album"
        onClose={() => setActiveIndex(null)} onKeyDown={handleViewerKeyDown}
        onClick={(event) => { if (event.target === event.currentTarget) setActiveIndex(null); }}>
        {activePhoto && activeIndex !== null && (
          <>
            <div className="album-viewer-toolbar">
              <span>ALBUM KITA <span className="album-viewer-count" aria-live="polite">{String(activeIndex + 1).padStart(2, "0")} / {orderedPhotos.length}</span></span>
              <button className="album-viewer-close" type="button" aria-label="Tutup penampil foto" autoFocus onClick={() => setActiveIndex(null)}>×</button>
            </div>
            <div className="album-viewer-image"
              onTouchStart={(event) => { touchStart.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }}
              onTouchEnd={finishSwipe} onTouchCancel={() => { touchStart.current = null; }}>
              <AlbumImage key={activePhoto.src} photo={activePhoto} sizes="92vw" loading="eager" />
            </div>
            <div className="album-viewer-footer">
              <button type="button" disabled={orderedPhotos.length < 2} onClick={() => movePhoto(-1)} aria-label="Foto sebelumnya">← <span>Sebelumnya</span></button>
              <p aria-live="polite">{activePhoto.caption ?? activePhoto.alt}<span className="album-viewer-hint">Geser foto atau gunakan tombol panah</span></p>
              <button type="button" disabled={orderedPhotos.length < 2} onClick={() => movePhoto(1)} aria-label="Foto berikutnya"><span>Berikutnya</span> →</button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
