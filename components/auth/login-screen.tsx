"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Megaphone } from "lucide-react";
import { OTP_LENGTH, checkPhone, isValidOtp } from "@/lib/auth";
import { getWhitelist } from "@/lib/local-whitelist";
import { signIn } from "@/lib/local-session";
import type { WhitelistRole } from "@/lib/whitelist";

const inputClass =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-lg text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
const buttonClass =
  "h-12 w-full rounded-xl bg-blue-600 text-base font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

interface Verified {
  phone: string;
  role: WhitelistRole;
}

/** Phone number → (mock) code. Whitelisted numbers only. */
export function LoginScreen() {
  const [phoneInput, setPhoneInput] = useState("");
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState<Verified | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submitPhone(event: FormEvent) {
    event.preventDefault();
    const result = checkPhone(getWhitelist(), phoneInput);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    // Real SMS goes here later; for now the code is a fixed mock.
    console.info("[mock OTP] code for", result.phone, "is 1234");
    setVerified({ phone: result.phone, role: result.role });
  }

  function submitCode(event: FormEvent) {
    event.preventDefault();
    if (!verified) return;
    if (!isValidOtp(code)) {
      setError("הקוד שגוי. נסו שוב.");
      return;
    }
    signIn(verified);
  }

  function backToPhone() {
    setVerified(null);
    setCode("");
    setError(null);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center bg-slate-50 px-6 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-blue-600 text-white">
          <Megaphone aria-hidden className="size-8" />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          קול הקהילה
        </h1>
        <p className="text-sm text-slate-600">
          {verified
            ? `שלחנו קוד אימות למספר ${verified.phone}`
            : "הזינו את מספר הנייד שלכם כדי להיכנס"}
        </p>
      </div>

      {verified ? (
        <form onSubmit={submitCode} className="space-y-4" noValidate>
          <div>
            <label htmlFor="otp" className="mb-1.5 block text-sm font-semibold text-slate-900">
              קוד אימות
            </label>
            <input
              id="otp"
              dir="ltr"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={OTP_LENGTH}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
              className={`${inputClass} text-center tracking-[0.5em]`}
            />
          </div>
          {error && (
            <p id="login-error" role="alert" className="text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <button type="submit" className={buttonClass}>
            כניסה
          </button>
          <button
            type="button"
            onClick={backToPhone}
            className="flex h-11 w-full items-center justify-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowRight aria-hidden className="size-4" />
            החלפת מספר
          </button>
          <p className="text-center text-xs text-slate-500">
            גרסת ניסוי: קוד האימות הוא 1234
          </p>
        </form>
      ) : (
        <form onSubmit={submitPhone} className="space-y-4" noValidate>
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-slate-900">
              מספר נייד
            </label>
            <input
              id="phone"
              type="tel"
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="05X-XXXXXXX"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
              className={`${inputClass} text-start`}
            />
          </div>
          {error && (
            <p id="login-error" role="alert" className="text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <button type="submit" className={buttonClass}>
            שלח קוד
          </button>
        </form>
      )}
    </div>
  );
}
