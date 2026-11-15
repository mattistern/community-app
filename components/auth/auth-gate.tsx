"use client";

import { useEffect, type ReactNode } from "react";
import { LoginScreen } from "@/components/auth/login-screen";
import { refreshSessionCookie, useSessionState } from "@/lib/local-session";

/** Shows the login screen unless a session exists; renders a blank page while loading. */
export function AuthGate({ children }: { children: ReactNode }) {
  const state = useSessionState();
  const signedIn = state?.session != null;

  // Rolling 365-day cookie: every visit pushes the expiry forward.
  useEffect(() => {
    if (signedIn) refreshSessionCookie();
  }, [signedIn]);

  if (state === null) return <div className="min-h-dvh bg-slate-50" />;
  if (!signedIn) return <LoginScreen />;
  return <>{children}</>;
}
