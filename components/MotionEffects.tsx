"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function MotionEffects({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const intro = gsap.timeline({ defaults: { ease: "power2.out" } });
      intro
        .from("[data-motion='hero-eyebrow']", { y: 12, autoAlpha: 0, duration: 0.55 })
        .from("[data-motion='hero-title']", { y: 24, autoAlpha: 0, duration: 0.8 }, "-=0.25")
        .from("[data-motion='hero-intro']", { y: 14, autoAlpha: 0, duration: 0.6 }, "-=0.3")
        .from("[data-motion='cover']", { y: 26, rotate: 7, autoAlpha: 0, duration: 0.9 }, "-=0.25");

      gsap.from("[data-motion='memory']", {
        y: 24,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.14,
        ease: "power2.out",
        scrollTrigger: { trigger: ".memory-list", start: "top 82%", once: true },
      });

      gsap.from("[data-motion='conversation']", {
        y: 20,
        rotate: -2,
        autoAlpha: 0,
        duration: 0.75,
        ease: "power2.out",
        scrollTrigger: { trigger: ".conversation", start: "top 78%", once: true },
      });

      gsap.from("[data-motion='album']", {
        y: 18,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: ".album-section", start: "top 86%", once: true },
      });

      gsap.to(".orbit-one", {
        rotate: 360,
        transformOrigin: "50% 50%",
        duration: 52,
        ease: "none",
        repeat: -1,
      });
    });

    return () => media.revert();
  }, { scope: root });

  return <div ref={root}>{children}</div>;
}
