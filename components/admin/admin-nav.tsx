"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Download,
  LayoutDashboard,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

/** DESIGN.md §3C sidebar items. */
const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "סקירה כללית", icon: LayoutDashboard },
  { href: "/admin/issues", label: "ניהול פניות", icon: ClipboardList },
  { href: "/admin/whitelist", label: "ניהול מורשים - Whitelist", icon: ShieldCheck },
  { href: "/admin/export", label: "ייצוא נתונים", icon: Download },
];

interface AdminNavProps {
  /** "sidebar": a vertical menu for desktop. "pills": a scrolling row for phones. */
  layout: "sidebar" | "pills";
}

export function AdminNav({ layout }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="ניווט ניהול"
      className={
        layout === "sidebar"
          ? "flex flex-col gap-1"
          : // py-1 / -my-1 leave room for the focus ring, which the scroller would clip.
            "-mx-4 -my-1 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      }
    >
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
              layout === "sidebar"
                ? "h-11 gap-3 rounded-xl px-3 text-sm"
                : "h-10 shrink-0 gap-2 rounded-full border px-4 text-sm",
              layout === "sidebar" &&
                (active
                  ? "bg-blue-50 font-semibold text-blue-700"
                  : "font-medium text-slate-600 hover:bg-slate-100"),
              layout === "pills" &&
                (active
                  ? "border-slate-900 bg-slate-900 font-semibold text-white"
                  : "border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-100"),
            )}
          >
            <Icon aria-hidden className="size-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
