"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { subscribeRemoteCommand } from "@/lib/remote";

gsap.registerPlugin(useGSAP);

export function LetterReveal({ letter, signoff }: { letter: string; signoff: string }) {
  const root = useRef<HTMLDivElement>(null);
  const letterContent = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeRemoteCommand((command) => {
    if (command === "surat-buka") setOpen(true);
    if (command === "surat-tutup") setOpen(false);
  }), []);

  useGSAP(() => {
    if (!open) return;

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(letterContent.current, { y: 12, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        duration: 0.55,
        ease: "power2.out",
      });
    });

    return () => media.revert();
  }, { scope: root, dependencies: [open], revertOnUpdate: true });

  return (
    <div className="letter-wrap" ref={root}>
      <div className="letter-seal" aria-hidden="true">01</div>
      <p className="letter-hint" id="letter-hint">
        {open ? "Semoga ada banyak lagi yang bisa kutulis untukmu." : "Buka kalau kita sudah duduk berdua."}
      </p>
      <button
        className="reveal-button"
        id="reveal-letter"
        type="button"
        aria-expanded={open}
        aria-controls="letter-content"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="button-label">{open ? "Tutup suratnya" : "Buka suratnya"}</span>
        <span className="button-mark" aria-hidden="true">↗</span>
      </button>
      <div ref={letterContent} className="letter-content" id="letter-content" hidden={!open} aria-live="polite">
        <p>{letter}</p>
        <p className="letter-signoff">{signoff}</p>
      </div>
    </div>
  );
}
