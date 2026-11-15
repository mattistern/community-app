"use client";

import { useEffect } from "react";
import { startPwaInstall } from "@/lib/pwa-install";

/** Runs once per page: catches the install event and registers the service worker. */
export function PwaSetup() {
  useEffect(() => {
    startPwaInstall();

    // Service workers need a secure context (https or localhost); on a plain
    // http LAN address the browser simply has none, and the app still works.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Not installable offline-wise; nothing to tell the person.
      });
    }
  }, []);

  return null;
}
