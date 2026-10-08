"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  NAVIGATION_TARGETS,
  SCREEN_CHANGE_EVENT,
  SCREEN_STORAGE_KEY,
  SCROLL_TARGETS,
  dispatchRemoteCommand,
  isRemoteCommand,
  type RemoteCommand,
} from "@/lib/remote";

const POLL_INTERVAL = 700;
const RETRY_INTERVAL = 3_000;

type ScreenResponse = { seq: number; commands: { seq: number; command: string }[] };

function readScreenFlag() {
  try {
    return window.localStorage.getItem(SCREEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function clearScreenFlag() {
  try {
    window.localStorage.removeItem(SCREEN_STORAGE_KEY);
  } catch {
    // Storage can be blocked; the loop is already stopping.
  }
}

function isScreenResponse(value: unknown): value is ScreenResponse {
  if (typeof value !== "object" || value === null) return false;
  const { seq, commands } = value as Partial<ScreenResponse>;
  return typeof seq === "number" && Array.isArray(commands);
}

export function RemoteScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const pathRef = useRef(pathname);
  const routerRef = useRef(router);

  useEffect(() => {
    pathRef.current = pathname;
    routerRef.current = router;
  }, [pathname, router]);

  useEffect(() => {
    const sync = () => setActive(readScreenFlag());
    sync();
    window.addEventListener(SCREEN_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SCREEN_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let timer: number | undefined;
    let controller: AbortController | undefined;
    let inFlight = false;
    let since: number | null = null;

    function run(command: RemoteCommand) {
      if (command in NAVIGATION_TARGETS) {
        routerRef.current.push(NAVIGATION_TARGETS[command as keyof typeof NAVIGATION_TARGETS]);
        return;
      }
      if (command in SCROLL_TARGETS) {
        const id = SCROLL_TARGETS[command as keyof typeof SCROLL_TARGETS];
        if (pathRef.current !== "/") routerRef.current.push(`/#${id}`);
        else if (id === "atas") window.scrollTo({ top: 0, behavior: "smooth" });
        else document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      dispatchRemoteCommand(command);
    }

    function schedule(delay: number) {
      window.clearTimeout(timer);
      if (cancelled) return;
      timer = window.setTimeout(tick, delay);
    }

    async function tick() {
      if (cancelled || inFlight) return;
      if (document.hidden) return;

      inFlight = true;
      controller = new AbortController();
      let delay = POLL_INTERVAL;
      try {
        const response = await fetch("/api/remote/layar/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ since, path: window.location.pathname }),
          cache: "no-store",
          signal: controller.signal,
        });
        if (cancelled) return;

        if (response.status === 401) {
          clearScreenFlag();
          setActive(false);
          return;
        }

        const data: unknown = response.ok ? await response.json() : null;
        if (cancelled) return;
        if (!isScreenResponse(data)) {
          delay = RETRY_INTERVAL;
        } else if (since === null || data.seq < since) {
          since = data.seq;
        } else {
          const pending = data.commands
            .filter((entry) => entry.seq > since!)
            .sort((a, b) => a.seq - b.seq);
          for (const entry of pending) {
            since = entry.seq;
            if (isRemoteCommand(entry.command)) run(entry.command);
          }
        }
      } catch {
        if (cancelled) return;
        delay = RETRY_INTERVAL;
      } finally {
        inFlight = false;
      }
      schedule(delay);
    }

    function handleVisibility() {
      if (document.hidden) {
        window.clearTimeout(timer);
        return;
      }
      schedule(0);
    }

    document.addEventListener("visibilitychange", handleVisibility);
    tick();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [active]);

  return null;
}
