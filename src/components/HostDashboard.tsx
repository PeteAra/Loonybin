"use client";

import { useState } from "react";
import { BrandLink } from "@/components/LoonMark";
import type { Booking, DateBlock } from "@/lib/booking-types";
import { addIsoDays, formatLong, formatTimestamp } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";

type Overview = {
  requests: Booking[];
  blocks: DateBlock[];
  pricingPlaceholder: boolean;
};

export function HostDashboard({ initial }: { initial: Overview }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");

  async function refresh() {
    const response = await fetch("/api/host/overview");
    const body = (await response.json()) as Overview & { error?: string };
    if (!response.ok) throw new Error(body.error || "Couldn't refresh.");
    setData(body);
  }

  async function act(path: string, id: string) {
    setPendingId(id);
    setError("");
    try {
      const response = await fetch(path, { method: "POST" });
      const body = (await response.json()) as { error?: string; paymentUrl?: string };
      if (!response.ok) throw new Error(body.error || "That didn't work.");
      if (body.paymentUrl) await navigator.clipboard.writeText(body.paymentUrl).catch(() => undefined);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That didn't work.");
    } finally {
      setPendingId("");
    }
  }

  async function addBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    const response = await fetch("/api/host/blocks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        firstNight: form.get("firstNight"),
        lastNight: form.get("lastNight"),
        reason: form.get("reason"),
      }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error || "Couldn't block those nights.");
      return;
    }
    event.currentTarget.reset();
    await refresh();
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-center justify-between gap-4">
        <BrandLink />
        <button
          type="button"
          className="text-sm underline"
          onClick={() => {
            void fetch("/api/host/logout", { method: "POST" }).then(() => {
              window.location.href = "/host";
            });
          }}
        >
          Sign out
        </button>
      </div>
      <h1 className="mt-8 font-serif text-5xl">Requests</h1>
      {data.pricingPlaceholder ? (
        <p className="mt-3 max-w-2xl text-sm text-bark/70">Amounts use the sample nightly rate, cleaning fee, and tax until you replace them in the content file.</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-amber-deep">{error}</p> : null}

      <div className="mt-8 space-y-4">
        {data.requests.length === 0 ? <p className="text-bark/70">No requests yet.</p> : null}
        {data.requests.map((request) => (
          <article key={request.id} className="border border-bark/10 bg-paper p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-2xl">{request.name}</h2>
              <span className="text-xs uppercase tracking-[0.16em] text-moss">{label(request.status)}</span>
            </div>
            <p className="mt-1 text-sm">
              {formatLong(request.checkIn)} to {formatLong(request.checkOut)} · party of {request.guests}
              {request.amountCents != null ? ` · ${formatMoney(request.amountCents)}` : ""}
            </p>
            <p className="text-sm text-bark/70">{request.email} · {request.phone}</p>
            {request.message ? <p className="mt-2 text-sm">{request.message}</p> : null}
            {request.holdExpiresAt && request.status === "approved" ? (
              <p className="mt-2 text-sm text-bark/70">Hold until {formatTimestamp(request.holdExpiresAt)}</p>
            ) : null}
            {request.paymentUrl ? (
              <p className="mt-2 break-all text-sm">
                <a className="underline" href={request.paymentUrl}>{request.paymentUrl}</a>
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {request.status === "pending" ? (
                <button type="button" className="rounded-full bg-green px-4 py-2 text-sm text-cream" disabled={pendingId === request.id} onClick={() => void act(`/api/host/requests/${request.id}/approve`, request.id)}>
                  Approve
                </button>
              ) : null}
              {request.status === "approved" ? (
                <button type="button" className="rounded-full border border-bark/20 px-4 py-2 text-sm" disabled={pendingId === request.id} onClick={() => void act(`/api/host/requests/${request.id}/payment-link`, request.id)}>
                  Email the payment link
                </button>
              ) : null}
              {request.status === "pending" || request.status === "approved" ? (
                <button type="button" className="rounded-full border border-bark/20 px-4 py-2 text-sm" disabled={pendingId === request.id} onClick={() => void act(`/api/host/requests/${request.id}/decline`, request.id)}>
                  Decline
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <h2 className="mt-14 font-serif text-4xl">Blocked nights</h2>
      <form onSubmit={addBlock} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
        <label className="text-sm">First night<input name="firstNight" type="date" required className="mt-1 w-full border border-bark/15 bg-paper px-3 py-2" /></label>
        <label className="text-sm">Last night<input name="lastNight" type="date" required className="mt-1 w-full border border-bark/15 bg-paper px-3 py-2" /></label>
        <label className="text-sm">Reason<input name="reason" className="mt-1 w-full border border-bark/15 bg-paper px-3 py-2" /></label>
        <button type="submit" className="rounded-full bg-bark px-4 py-2 text-sm text-cream">Block</button>
      </form>
      <ul className="mt-4 space-y-2">
        {data.blocks.map((block) => (
          <li key={block.id} className="flex items-center justify-between gap-3 border border-bark/10 bg-paper px-3 py-2 text-sm">
            <span>
              {formatLong(block.startDate)} – {formatLong(addIsoDays(block.endDate, -1))}
              {block.reason ? ` · ${block.reason}` : ""}
            </span>
            <button type="button" className="underline" onClick={() => void fetch(`/api/host/blocks/${block.id}`, { method: "DELETE" }).then(() => refresh())}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-bark/60">
        Confirmed stays and blocks are at <a className="underline" href="/calendar.ics">/calendar.ics</a> for Airbnb to import.
      </p>
    </main>
  );
}

function label(status: Booking["status"]) {
  if (status === "pending") return "Awaiting you";
  if (status === "approved") return "Hold, unpaid";
  if (status === "paid") return "Booked";
  if (status === "expired") return "Hold expired";
  return "Declined";
}
