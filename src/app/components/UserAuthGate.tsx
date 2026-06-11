"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import Breadcrumb from "./Breadcrumb";

const STORAGE_KEY = "academy.user.reauth";

export default function UserAuthGate({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") setAuthed(true);
    } catch {
      // ignore
    }
    setChecked(true);
  }, []);

  if (!checked) return null;

  if (authed) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { valid: boolean };
      if (data.valid) {
        try {
          sessionStorage.setItem(STORAGE_KEY, "1");
        } catch {
          // ignore
        }
        setAuthed(true);
      } else {
        setError("Incorrect password. Try again.");
        setPassword("");
      }
    } catch {
      setError("Couldn't verify right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-md mx-auto px-6 pt-16 pb-10">
        <Breadcrumb
          items={[
            { label: "Home", href: "/home" },
            { label: "Academy", href: "/academy" },
            { label: "Ebright Class Syllabus", href: "/academy/ebright-class-syllabus" },
            { label: "User" },
          ]}
        />

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-700 mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 text-center">USER section</h2>
          <p className="text-sm text-slate-600 text-center mt-1 mb-6">
            This area is locked. Confirm your password to continue.
          </p>

          <form onSubmit={handleSubmit}>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2 mb-4 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed"
            />
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              placeholder="Enter your account password"
              className="w-full px-3 py-2 mb-3 rounded-lg border border-slate-200 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            {error && (
              <p className="text-sm text-rose-600 mb-3">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting || !password.trim()}
              className="w-full inline-flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-bold transition-colors"
            >
              <Lock className="w-4 h-4" />
              {submitting ? "Verifying…" : "Unlock USER"}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-5">
            This unlock lasts until you close the browser tab.
          </p>
        </div>
      </div>
    </div>
  );
}
