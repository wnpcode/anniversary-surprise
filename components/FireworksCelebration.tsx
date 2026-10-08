"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { SplitText } from "gsap/SplitText";
import { subscribeRemoteCommand } from "@/lib/remote";
import { CELEBRATION_DATE, CELEBRATION_DATE_ISO, type CelebrationMode } from "@/lib/celebration";

gsap.registerPlugin(useGSAP, Physics2DPlugin, SplitText);

type Phase = "playing" | "ended";
type Origin = { ox: number; oy: number };
type Budget = { sparksPerBurst: number; wingBursts: number; finaleColumns: number[] };
type View = { width: number; height: number; unit: number };

// ox/oy are normalised screen origins; dx/dy are Physics2D offsets in design units, scaled by View.unit.
// age runs 0 to 1 over the spark's life and is the only thing that decides visibility, so rewinding
// a timeline always leaves sparks invisible.
type Spark = {
  ox: number;
  oy: number;
  dx: number;
  dy: number;
  age: number;
  fades: boolean;
  size: number;
  color: string;
  px: number;
  py: number;
};

type FireworksCelebrationProps = { mode: CelebrationMode; onFinish?: () => void };

const PALETTE = ["#c8735a", "#d49a7f", "#e6c29f", "#f1e9da"];
const MAX_SPARKS = 1500;
const TRAIL_STRETCH = 2.5;
const DATE_SPACING = "0.22em";
const END_HOLD = 2;
const FADE_OUT = 0.6;
const AMBIENT_REPEATS = 18;
const AMBIENT_GAP = 1.8;
const PHONE_BUDGET: Budget = { sparksPerBurst: 45, wingBursts: 3, finaleColumns: [0.5, 0.17, 0.83] };
const DESKTOP_BUDGET: Budget = { sparksPerBurst: 80, wingBursts: 4, finaleColumns: [0.5, 0.17, 0.83, 0.33, 0.67] };

function upperOrigin(): Origin {
  return { ox: gsap.utils.random(0.2, 0.8), oy: gsap.utils.random(0.12, 0.38) };
}

function sideOrigin(side: "left" | "right"): Origin {
  const ox = side === "left" ? gsap.utils.random(0.07, 0.24) : gsap.utils.random(0.76, 0.93);
  return { ox, oy: gsap.utils.random(0.2, 0.6) };
}

function columnOrigin(column: number): Origin {
  const isSide = column < 0.25 || column > 0.75;
  return { ox: column, oy: isSide ? gsap.utils.random(0.2, 0.5) : gsap.utils.random(0.12, 0.3) };
}

function createSpark(sparks: Spark[], ox: number, oy: number, size: number, color: string, fades: boolean) {
  const spark: Spark = { ox, oy, dx: 0, dy: 0, age: 0, fades, size, color, px: NaN, py: NaN };
  sparks.push(spark);
  return spark;
}

function createBurst(sparks: Spark[], { ox, oy }: Origin, count: number, power = 1) {
  const burst = gsap.timeline();
  const pickColor = gsap.utils.random(PALETTE, true);
  const total = Math.min(count, MAX_SPARKS - sparks.length);

  for (let i = 0; i < total; i++) {
    const spark = createSpark(sparks, ox, oy, gsap.utils.random(1, 2.2), pickColor(), true);
    const life = gsap.utils.random(1.3, 2.1);
    burst
      .to(spark, {
        duration: life,
        ease: "none",
        physics2D: {
          velocity: gsap.utils.random(150, 300) * power,
          angle: (i / total) * 360 + gsap.utils.random(-6, 6),
          gravity: 160,
          friction: 0.035,
          xProp: "dx",
          yProp: "dy",
        },
      }, 0)
      .to(spark, { age: 1, duration: life, ease: "none" }, 0);
  }
  return burst;
}

function createRocket(sparks: Spark[], origin: Origin, count: number, power = 1) {
  const rocket = gsap.timeline();
  const streak = createSpark(sparks, origin.ox, 1.04, 2.2, "#f1e9da", false);
  rocket.to(streak, { oy: origin.oy, age: 1, duration: gsap.utils.random(0.9, 1.1), ease: "power2.out" });
  return rocket.add(createBurst(sparks, origin, count, power));
}

function drawSparks(ctx: CanvasRenderingContext2D, sparks: Spark[], { width, height, unit }: View) {
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  for (const spark of sparks) {
    if (spark.age <= 0 || spark.age >= 1) {
      spark.px = NaN;
      continue;
    }
    const x = spark.ox * width + spark.dx * unit;
    const y = spark.oy * height + spark.dy * unit;
    if (!Number.isNaN(spark.px)) {
      ctx.globalAlpha = spark.fades ? 1 - spark.age * spark.age : 1;
      ctx.strokeStyle = spark.color;
      ctx.lineWidth = spark.size;
      ctx.beginPath();
      ctx.moveTo(x + (spark.px - x) * TRAIL_STRETCH, y + (spark.py - y) * TRAIL_STRETCH);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    spark.px = x;
    spark.py = y;
  }
  ctx.globalAlpha = 1;
}

function buildShow(sparks: Spark[], budget: Budget, chars: Element[], date: Element) {
  const show = gsap.timeline();
  const count = () => Math.round(budget.sparksPerBurst * gsap.utils.random(0.9, 1.1));
  show.addLabel("roket", 0.3).addLabel("teks", 2).addLabel("sayap", 3).addLabel("puncak", 5.6);

  [0.32, 0.68, 0.5].forEach((column, i) => {
    const origin = { ox: column + gsap.utils.random(-0.04, 0.04), oy: upperOrigin().oy };
    show.add(createRocket(sparks, origin, count()), `roket+=${i * 0.35}`);
  });

  show.from(chars, {
    yPercent: 70,
    autoAlpha: 0,
    rotate: () => gsap.utils.random(-8, 8),
    duration: 0.9,
    ease: "power3.out",
    stagger: { each: 0.045, from: "center" },
  }, "teks");
  show.fromTo(date, { autoAlpha: 0, letterSpacing: "0.5em" }, {
    autoAlpha: 1,
    letterSpacing: DATE_SPACING,
    duration: 1,
    ease: "power2.out",
  }, "teks+=0.6");

  for (let i = 0; i < budget.wingBursts; i++) {
    show.add(createBurst(sparks, sideOrigin(i % 2 === 0 ? "left" : "right"), count()), `sayap+=${i * 0.6}`);
  }

  budget.finaleColumns.forEach((column, i) => {
    show.add(createRocket(sparks, columnOrigin(column), count(), 1.2), `puncak+=${i * 0.22}`);
  });

  return show.addLabel("akhir", show.duration());
}

function buildAmbient(sparks: Spark[], budget: Budget) {
  const ambient = gsap.timeline({ paused: true, repeat: AMBIENT_REPEATS, repeatDelay: AMBIENT_GAP });
  const count = Math.round(budget.sparksPerBurst * 0.45);
  const origins = [sideOrigin("left"), upperOrigin(), sideOrigin("right")];
  origins.forEach((origin, i) => ambient.add(createBurst(sparks, origin, count, 0.7), i * 1.1));
  return ambient;
}

export function FireworksCelebration({ mode, onFinish }: FireworksCelebrationProps) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const dateRef = useRef<HTMLParagraphElement>(null);
  const controlsRef = useRef<HTMLElement>(null);
  const entryLink = useRef<HTMLAnchorElement>(null);
  const skipButton = useRef<HTMLButtonElement>(null);
  const replayButton = useRef<HTMLButtonElement>(null);
  const showRef = useRef<gsap.core.Timeline | null>(null);
  const ambientRef = useRef<gsap.core.Timeline | null>(null);
  const focusNext = useRef<"end" | "replay" | null>(null);
  const leaving = useRef(false);
  const onFinishRef = useRef(onFinish);
  const [phase, setPhase] = useState<Phase>("playing");

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const next = focusNext.current;
    focusNext.current = null;
    const target = next === "end" ? entryLink.current ?? replayButton.current : next === "replay" ? skipButton.current : null;
    target?.focus({ preventScroll: true });
  }, [phase]);

  function leave() {
    if (leaving.current) return;
    leaving.current = true;
    if (onFinishRef.current) onFinishRef.current();
    else router.push("/");
  }

  useGSAP(() => {
    const rootEl = root.current;
    const canvasEl = canvasRef.current;
    const textEl = textRef.current;
    const titleEl = titleRef.current;
    const dateEl = dateRef.current;
    const controlsEl = controlsRef.current;
    if (!rootEl || !canvasEl || !textEl || !titleEl || !dateEl || !controlsEl) return;

    const media = gsap.matchMedia();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (mode === "pembuka") leave();
      else showRef.current?.progress(1);
    }
    window.addEventListener("keydown", handleKeyDown);

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = canvasEl.getContext("2d");
      if (!ctx) return;

      setPhase("playing");
      const sparks: Spark[] = [];
      const view: View = { width: 0, height: 0, unit: 1 };

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        view.width = rootEl.clientWidth;
        view.height = rootEl.clientHeight;
        view.unit = Math.sqrt(view.width * view.height) / 1000;
        canvasEl.width = Math.round(view.width * dpr);
        canvasEl.height = Math.round(view.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      const draw = () => drawSparks(ctx, sparks, view);
      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(rootEl);
      gsap.ticker.add(draw);

      // Read once: gsap.matchMedia would rebuild and restart the show when a phone rotates.
      const budget = window.matchMedia("(max-width: 600px), (pointer: coarse)").matches ? PHONE_BUDGET : DESKTOP_BUDGET;

      const split = SplitText.create(titleEl, {
        type: "words,chars",
        tag: "span",
        wordsClass: "celebration__word",
        charsClass: "celebration__char",
      });
      const show = buildShow(sparks, budget, split.chars, dateEl);
      const ambient = mode === "penutup" ? buildAmbient(sparks, budget) : null;
      showRef.current = show;
      ambientRef.current = ambient;

      const enterEnd = () => {
        focusNext.current = "end";
        setPhase("ended");
        ambient?.restart();
      };
      show.call(enterEnd, [], "akhir");
      if (mode === "pembuka") {
        show
          .to([canvasEl, textEl, controlsEl], { opacity: 0, duration: FADE_OUT, ease: "power1.inOut" }, `akhir+=${END_HOLD}`)
          .call(leave, [], ">");
      }
      gsap.set(textEl, { visibility: "visible" });

      return () => {
        gsap.ticker.remove(draw);
        observer.disconnect();
        showRef.current = null;
        ambientRef.current = null;
        sparks.length = 0;
        ctx.clearRect(0, 0, view.width, view.height);
      };
    });

    media.add("(prefers-reduced-motion: reduce)", () => {
      setPhase("ended");
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      media.revert();
    };
  }, { scope: root });

  function skip() {
    showRef.current?.progress(1);
  }

  function replay() {
    ambientRef.current?.pause(0);
    showRef.current?.restart();
    focusNext.current = "replay";
    setPhase("playing");
  }

  const remoteHandlers = useRef({ skip, replay });
  useEffect(() => {
    remoteHandlers.current = { skip, replay };
  });

  useEffect(() => subscribeRemoteCommand((command) => {
    if (command === "kembang-lewati") remoteHandlers.current.skip();
    else if (command === "kembang-ulang") {
      if (mode === "penutup") remoteHandlers.current.replay();
      else if (!leaving.current) showRef.current?.restart();
    }
  }), [mode]);

  return (
    <div className="celebration" data-mode={mode} ref={root}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="celebration__text" lang="en" ref={textRef}>
        <h1 className="celebration__title" ref={titleRef}>1st <em>anniversary</em></h1>
        <p className="celebration__date" ref={dateRef}><time dateTime={CELEBRATION_DATE_ISO}>{CELEBRATION_DATE}</time></p>
      </div>
      <nav className="celebration__controls" aria-label="Kontrol perayaan" ref={controlsRef}>
        {mode === "pembuka" ? (
          <Link className="celebration__control" href="/" ref={entryLink}>
            {phase === "ended" ? "Masuk ke catatan →" : "Lewati →"}
          </Link>
        ) : (
          <>
            <Link className="celebration__control" href="/">Kembali ke catatan</Link>
            {phase === "playing" ? (
              <button className="celebration__control celebration__skip" type="button" onClick={skip} ref={skipButton}>Lewati</button>
            ) : (
              <button className="celebration__control celebration__replay" type="button" onClick={replay} ref={replayButton}>Putar lagi</button>
            )}
          </>
        )}
      </nav>
    </div>
  );
}
