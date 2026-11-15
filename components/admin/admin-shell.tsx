"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Lock, Megaphone } from "lucide-react";
import { DemoTools } from "@/components/demo/demo-tools";
import { AuthGate } from "@/components/auth/auth-gate";
import { useSessionState } from "@/lib/local-session";
import { AdminNav } from "./admin-nav";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white">
        <Megaphone aria-hidden className="size-5" />
      </span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        ניהול הקהילה
      </span>
    </div>
  );
}

/** What a resident sees at /admin. */
function NotAuthorized() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <Lock aria-hidden className="size-7" />
      </span>
      <h1 className="text-xl font-extrabold text-slate-900">
        אין לך הרשאה לצפות בדף הזה
      </h1>
      <p className="text-sm text-slate-600">
        אזור הניהול זמין למנהלי הקהילה בלבד.
      </p>
      <div className="flex w-full flex-col gap-2">
        <Link
          href="/"
          className="grid h-12 place-items-center rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          חזרה לפיד הקהילה
        </Link>
      </div>
    </main>
  );
}

/** Shown for the instant before the browser knows who is looking. */
function Loading() {
  return (
    <div role="status" className="grid min-h-dvh place-items-center">
      <span className="sr-only">טוען…</span>
      <div
        aria-hidden
        className="h-2 w-40 animate-pulse rounded-full bg-slate-200 motion-reduce:animate-none"
      />
    </div>
  );
}

/**
 * The admin area's frame (DESIGN.md §1, §3C): a sidebar on desktop, a compact
 * top bar with a scrolling menu on phones. Signing in is required, and only
 * numbers the whitelist marks as admin get past it.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <AdminFrame>{children}</AdminFrame>
    </AuthGate>
  );
}

function AdminFrame({ children }: { children: ReactNode }) {
  const role = useSessionState()?.session?.role;

  if (role === undefined) return <Loading />;
  if (role !== "admin") return <NotAuthorized />;

  return (
    <div className="min-h-dvh bg-slate-50 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden border-e border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-4">
          <Brand />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <AdminNav layout="sidebar" />
        </div>
        <div className="shrink-0 space-y-1 border-t border-slate-200 p-3">
          <Link
            href="/"
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <ArrowRight aria-hidden className="size-5" />
            חזרה לפיד הקהילה
          </Link>
          <DemoTools variant="row" />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between ps-4 pe-2">
            <Brand />
            <div className="flex items-center">
              <Link
                href="/"
                aria-label="חזרה לפיד הקהילה"
                title="חזרה לפיד הקהילה"
                className="grid size-11 place-items-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <ArrowRight aria-hidden className="size-5" />
              </Link>
              <DemoTools variant="icon" />
            </div>
          </div>
          <div className="px-4 pb-3">
            <AdminNav layout="pills" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
