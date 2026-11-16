"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { cabin } from "@/content/cabin";
import { dateFromIso, eachNight, formatIsoFromDate, formatLong, todayInCabinTz } from "@/lib/dates";
import { formatMoney, quoteStay, type Quote } from "@/lib/pricing";

type Sent = { checkIn: string; checkOut: string };

export function BookingPanel() {
  const today = todayInCabinTz();
  const [booked, setBooked] = useState<string[]>([]);
  const [loadError, setLoadError] = useState("");
  const [months, setMonths] = useState(1);
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const apply = () => setMonths(media.matches ? 2 : 1);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const from = today;
    const to = new Date();
    to.setMonth(to.getMonth() + 18);
    const end = formatIsoFromDate(to);
    void fetch(`/api/availability?from=${from}&to=${end}`)
      .then(async (response) => {
        const data = (await response.json()) as { booked?: string[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Availability couldn't be loaded.");
        setBooked(data.booked ?? []);
      })
      .catch((error: Error) => setLoadError(error.message));
  }, [today]);

  const checkIn = range?.from ? formatIsoFromDate(range.from) : "";
  const checkOut = range?.to ? formatIsoFromDate(range.to) : "";
  const taken = useMemo(() => new Set(booked), [booked]);

  let quote: Quote | null = null;
  if (checkIn && checkOut && checkOut > checkIn && !eachNight(checkIn, checkOut).some((night) => taken.has(night))) {
    try {
      quote = quoteStay(checkIn, checkOut);
    } catch (error) {
      quote = null;
      if (!notice && error instanceof Error) {
        // The picker notice is set in onSelect. This guards a stale range.
      }
    }
  }

  function onSelect(next: DateRange | undefined) {
    setFormError("");
    if (!next?.from) {
      setRange(undefined);
      setNotice("");
      return;
    }
    const from = formatIsoFromDate(next.from);
    if (from < today || taken.has(from)) {
      setRange(undefined);
      setNotice("That night is already taken.");
      return;
    }
    if (!next.to || formatIsoFromDate(next.to) === from) {
      setRange({ from: next.from });
      setNotice("");
      return;
    }
    const to = formatIsoFromDate(next.to);
    if (eachNight(from, to).some((night) => taken.has(night))) {
      setRange({ from: next.from });
      setNotice("Those nights include a booked date. You can still check out on a taken morning.");
      return;
    }
    try {
      quoteStay(from, to);
      setNotice("");
      setRange(next);
    } catch (error) {
      setRange(next);
      setNotice(error instanceof Error ? error.message : "Those dates don't work.");
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quote || !checkIn || !checkOut) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          checkIn,
          checkOut,
          guests,
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          message: form.get("message"),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "The request didn't go through.");
      setSent({ checkIn, checkOut });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "The request didn't go through.");
    } finally {
      setSubmitting(false);
    }
  }

  const summary = quote
    ? `${quote.nights} night${quote.nights === 1 ? "" : "s"} · ${formatMoney(quote.totalCents)}`
    : checkIn
      ? "Choose a checkout date"
      : "Select dates";

  return (
    <section id="book" className="section-anchor bg-paper px-5 py-16 pb-28 md:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.22em] text-moss">Book</p>
        <h2 className="mt-3 max-w-2xl font-serif text-4xl leading-tight md:text-6xl">Check the lake calendar.</h2>
        <p className="mt-4 max-w-xl text-lg text-bark/80">
          Open nights are paper. Taken nights are marked. Ask for the dates you want. We confirm, then you pay.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-bark/70">
          <span className="inline-flex items-center gap-2"><i className="h-3 w-3 bg-paper ring-1 ring-bark/20" /> Open</span>
          <span className="inline-flex items-center gap-2"><i className="h-3 w-3 bg-[#ead9c4]" /> Taken</span>
          <span className="inline-flex items-center gap-2"><i className="h-3 w-3 bg-amber-deep" /> Your stay</span>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[auto_minmax(0,24rem)]">
          <div className="overflow-x-auto border border-bark/10 bg-cream p-3 md:p-5">
            {loadError ? <p className="p-4 text-sm">{loadError}</p> : null}
            <DayPicker
              mode="range"
              selected={range}
              onSelect={onSelect}
              resetOnSelect
              numberOfMonths={months}
              disabled={{ before: dateFromIso(today) }}
              excludeDisabled
              modifiers={{ booked: booked.map(dateFromIso) }}
              modifiersClassNames={{ booked: "day-booked" }}
              className="cabin-calendar"
              startMonth={dateFromIso(today)}
            />
          </div>

          <div className="border border-bark/10 bg-cream p-5 md:p-6">
            {sent ? (
              <div>
                <h3 className="font-serif text-3xl">Request sent.</h3>
                <p className="mt-3 text-bark/80">
                  {formatLong(sent.checkIn)} to {formatLong(sent.checkOut)}. Nothing is charged yet. If the dates work, you'll get a payment link.
                </p>
              </div>
            ) : (
              <form id="request-form" onSubmit={onSubmit} className="space-y-4">
                <div>
                  <p className="font-serif text-3xl">{summary}</p>
                  <p className="mt-1 text-sm text-bark/65">
                    {checkIn && checkOut ? `${formatLong(checkIn)} to ${formatLong(checkOut)}` : "Check-in and the morning you leave."}
                  </p>
                </div>
                {quote ? <PriceLines quote={quote} /> : null}
                {notice ? <p className="text-sm text-amber-deep">{notice}</p> : null}
                <div>
                  <div className="flex items-center justify-between">
                    <span id="guests-label" className="text-sm">Guests</span>
                    <div className="flex items-center gap-3">
                      <button type="button" className="h-9 w-9 border border-bark/20" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>–</button>
                      <span aria-live="polite" aria-labelledby="guests-label">{guests}</span>
                      <button type="button" className="h-9 w-9 border border-bark/20 disabled:opacity-40" aria-label="More guests" disabled={guests >= cabin.maxGuests} onClick={() => setGuests((count) => Math.min(cabin.maxGuests, count + 1))}>+</button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-bark/60">Requests are for up to {cabin.maxGuests} guests.</p>
                </div>
                <Field label="Name" name="name" autoComplete="name" required />
                <Field label="Email" name="email" type="email" autoComplete="email" required />
                <Field label="Phone" name="phone" type="tel" autoComplete="tel" required />
                <label className="block text-sm">
                  Note
                  <textarea name="message" rows={3} className="mt-1 w-full border border-bark/15 bg-paper px-3 py-2" />
                </label>
                {formError ? <p className="text-sm text-amber-deep">{formError}</p> : null}
                <button type="submit" disabled={!quote || submitting} className="w-full rounded-full bg-green px-5 py-3 text-sm text-cream disabled:opacity-40">
                  {submitting ? "Sending…" : "Request these dates"}
                </button>
                <p className="text-xs leading-relaxed text-bark/60">
                  Sample pricing and a {cabin.stay.minNights}-night minimum. Both are confirmed before you pay.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bark/10 bg-paper/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">{sent ? "Request sent" : summary}</p>
          {sent ? null : (
            <button type="submit" form="request-form" disabled={!quote || submitting} className="rounded-full bg-green px-4 py-2 text-sm text-cream disabled:opacity-40">
              Request
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function PriceLines({ quote }: { quote: Quote }) {
  return (
    <dl className="space-y-1 border-y border-bark/10 py-3 text-sm">
      <Row label={`${quote.nights} nights × ${formatMoney(quote.nightlyCents)}`} value={formatMoney(quote.nightlyCents * quote.nights)} />
      <Row label="Cleaning" value={formatMoney(quote.cleaningCents)} />
      <Row label="Tax" value={formatMoney(quote.taxCents)} />
      <Row label="Estimate" value={formatMoney(quote.totalCents)} strong />
      {quote.placeholder ? <p className="pt-1 text-xs text-bark/60">Sample rate, cleaning fee, and tax.</p> : null}
    </dl>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-medium" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Field({ label, name, type = "text", autoComplete, required = false }: { label: string; name: string; type?: string; autoComplete?: string; required?: boolean }) {
  return (
    <label className="block text-sm">
      {label}
      <input name={name} type={type} autoComplete={autoComplete} required={required} className="mt-1 w-full border border-bark/15 bg-paper px-3 py-2" />
    </label>
  );
}
