"use client";

import { useState } from "react";

export function PayButton({ id, token }: { id: string; token: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function pay() {
    setPending(true);
    setError("");
    const response = await fetch(`/api/bookings/${id}/pay`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "Payment didn't go through.");
      setPending(false);
      return;
    }
    window.location.href = `/booking/confirmed?booking=${id}`;
  }

  return (
    <div>
      <button type="button" onClick={() => void pay()} disabled={pending} className="rounded-full bg-green px-5 py-3 text-sm text-cream">
        {pending ? "Booking…" : "Pay and book"}
      </button>
      {error ? <p className="mt-3 text-sm text-amber-deep">{error}</p> : null}
      <p className="mt-4 text-sm text-bark/60">This stand-in is only used when Stripe isn't configured. With a Stripe key, the email links to Stripe Checkout instead.</p>
    </div>
  );
}
