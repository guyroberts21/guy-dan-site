"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("gd_tweaks") : null;
    if (stored) {
      try {
        const t = JSON.parse(stored);
        if (t.theme) document.documentElement.setAttribute("data-theme", t.theme);
      } catch {}
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error || "Login failed.");
        setBusy(false);
        return;
      }
      router.replace(from);
    } catch {
      setErr("Network error.");
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Guy <em style={{ fontStyle: "italic", color: "var(--ink-3)" }}>&</em> Dan</h1>
        <p>Shared password to enter.</p>
        <form onSubmit={submit}>
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button className="btn" type="submit" disabled={busy || !password}>
            {busy ? "…" : "Enter"}
          </button>
          <div className="err">{err}</div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
