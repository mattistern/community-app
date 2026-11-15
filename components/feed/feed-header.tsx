"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, Megaphone } from "lucide-react";
import { DemoTools } from "@/components/demo/demo-tools";
import { InstallButton } from "@/components/pwa/install-button";
import { signOut, useSessionState } from "@/lib/local-session";

/**
 * Top bar: app title, the admin panel link for admins only, and (prototype
 * only) the demo tools that switch between resident and admin.
 */
export function FeedHeader() {
  const role = useSessionState()?.session?.role;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white">
          <Megaphone aria-hidden className="size-5" />
        </span>
        <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
          קול הקהילה
        </h1>
      </div>
      <div className="flex items-center">
        {role === "admin" && (
          <Link
            href="/admin"
            // Admin-only and rarely opened: don't prefetch it on every feed load.
            prefetch={false}
            aria-label="לוח ניהול"
            title="לוח ניהול"
            className="grid size-11 place-items-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <LayoutDashboard aria-hidden className="size-5" />
          </Link>
        )}
        <InstallButton />
        <DemoTools variant="icon" />
        <button
          type="button"
          onClick={signOut}
          aria-label="התנתקות"
          title="התנתקות"
          className="grid size-11 place-items-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <LogOut aria-hidden className="size-5" />
        </button>
      </div>
    </header>
  );
}
