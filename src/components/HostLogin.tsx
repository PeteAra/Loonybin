"use client";

import { useState } from "react";
import { BrandLink } from "@/components/LoonMark";

export function HostLogin({ showDevHint }: { showDevHint: boolean }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const response = await fetch("/api/host/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setError("That password didn't match.");
      setPending(false);
      return;
    }
    window.location.href = "/host";
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-5">
      <BrandLink />
      <h1 className="mt-8 font-serif text-4xl">Host sign-in</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          Password
          <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full border border-bark/15 bg-paper px-3 py-2" />
        </label>
        {error ? <p className="text-sm text-amber-deep">{error}</p> : null}
        <button type="submit" disabled={pending} className="rounded-full bg-green px-5 py-3 text-sm text-cream">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      {showDevHint ? <p className="mt-4 text-sm text-bark/60">Local password: loony-host</p> : null}
    </main>
  );
}
