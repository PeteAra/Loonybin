"use client";

import { useState } from "react";
import { BrandLink } from "@/components/LoonMark";
import type { Booking } from "@/lib/booking-types";
import { formatLong } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";

export function DecidePanel({ booking, token, paymentUrl }: { booking: Booking; token: string; paymentUrl: string | null }) {
  const [error, setError] = useState("");
  const [link, setLink] = useState(paymentUrl);
  const [status, setStatus] = useState(booking.status);
  const [pending, setPending] = useState("");

  async function act(intent: "approve" | "decline") {
    setPending(intent);
    setError("");
    const response = await fetch(`/api/host/requests/${booking.id}/${intent}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = (await response.json()) as { error?: string; paymentUrl?: string; booking?: Booking };
    if (!response.ok) {
      setError(data.error || "That didn't work.");
      setPending("");
      return;
    }
    if (data.paymentUrl) setLink(data.paymentUrl);
    if (data.booking) setStatus(data.booking.status);
    else setStatus(intent === "approve" ? "approved" : "declined");
    setPending("");
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <BrandLink />
      <h1 className="mt-8 font-serif text-4xl">{booking.name}</h1>
      <p className="mt-3">
        {formatLong(booking.checkIn)} to {formatLong(booking.checkOut)} · party of {booking.guests}
      </p>
      <p className="text-sm text-bark/70">{booking.email} · {booking.phone}</p>
      {booking.amountCents != null ? <p className="mt-2">{formatMoney(booking.amountCents)}</p> : null}
      {booking.message ? <p className="mt-3">{booking.message}</p> : null}
      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-moss">{status}</p>
      {error ? <p className="mt-3 text-sm text-amber-deep">{error}</p> : null}
      {link ? (
        <p className="mt-4 break-all text-sm">
          Payment link: <a className="underline" href={link}>{link}</a>
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2">
        {status === "pending" || status === "approved" ? (
          <>
            {status === "pending" ? (
              <button type="button" className="rounded-full bg-green px-4 py-2 text-sm text-cream" disabled={pending !== ""} onClick={() => void act("approve")}>
                {pending === "approve" ? "Approving…" : "Approve and send payment link"}
              </button>
            ) : null}
            <button type="button" className="rounded-full border border-bark/20 px-4 py-2 text-sm" disabled={pending !== ""} onClick={() => void act("decline")}>
              {pending === "decline" ? "Declining…" : "Decline"}
            </button>
          </>
        ) : null}
      </div>
    </main>
  );
}
