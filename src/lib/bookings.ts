import crypto from "node:crypto";
import { cabin } from "@/content/cabin";
import { airbnbRanges, buildIcs, type DateRange } from "@/lib/airbnb";
import { getDatabase, type Database } from "@/lib/db";
import {
  addIsoDays,
  eachNight,
  isIsoDate,
  rangesOverlap,
  todayInCabinTz,
} from "@/lib/dates";
import { sendApprovedEmail, sendDeclinedEmail, sendPaidEmails, sendRequestEmails } from "@/lib/email";
import { quoteStay } from "@/lib/pricing";
import { siteUrl } from "@/lib/site";
import { getStripe } from "@/lib/stripe";
import { signToken } from "@/lib/tokens";
import type { Booking, BookingStatus, DateBlock } from "@/lib/booking-types";

export type { Booking, BookingStatus, DateBlock };

type Query = Database["query"];

export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type RequestInput = {
  checkIn: string;
  checkOut: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  message: string;
};

const nowIso = () => new Date().toISOString();

function mapBooking(row: Record<string, unknown>): Booking {
  return {
    id: String(row.id),
    checkIn: String(row.check_in),
    checkOut: String(row.check_out),
    guests: Number(row.guests),
    name: String(row.guest_name),
    email: String(row.email),
    phone: String(row.phone ?? ""),
    message: String(row.message ?? ""),
    status: String(row.status) as BookingStatus,
    amountCents: row.amount_cents == null ? null : Number(row.amount_cents),
    stripeSessionId: row.stripe_session_id ? String(row.stripe_session_id) : null,
    paymentUrl: row.payment_url ? String(row.payment_url) : null,
    holdExpiresAt: row.hold_expires_at ? String(row.hold_expires_at) : null,
    createdAt: String(row.created_at),
  };
}

function mapBlock(row: Record<string, unknown>): DateBlock {
  return {
    id: String(row.id),
    startDate: String(row.start_date),
    endDate: String(row.end_date),
    reason: String(row.reason ?? ""),
  };
}

async function expireHolds(query: Query) {
  await query(`UPDATE booking_requests SET status = 'expired' WHERE status = 'approved' AND hold_expires_at <= $1`, [
    nowIso(),
  ]);
}

async function localConflict(query: Query, checkIn: string, checkOut: string, exceptId = "") {
  const rows = await query(
    `SELECT id FROM booking_requests
     WHERE ($1 = '' OR id <> $1)
       AND (status = 'paid' OR (status = 'approved' AND hold_expires_at > $2))
       AND check_in < $4 AND check_out > $3
     UNION ALL
     SELECT id FROM date_blocks
     WHERE start_date < $4 AND end_date > $3
     LIMIT 1`,
    [exceptId, nowIso(), checkIn, checkOut],
  );
  return rows.length > 0;
}

async function outsideConflict(checkIn: string, checkOut: string) {
  const ranges = await airbnbRanges();
  return ranges.some((range) => rangesOverlap(checkIn, checkOut, range.start, range.end));
}

export function validateRequest(body: Partial<RequestInput>): RequestInput {
  const checkIn = String(body.checkIn ?? "");
  const checkOut = String(body.checkOut ?? "");
  const guests = Number(body.guests);
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) throw new HttpError("Choose check-in and check-out dates.");
  if (checkIn < todayInCabinTz()) throw new HttpError("Check-in can't be in the past.");
  if (!Number.isInteger(guests) || guests < 1 || guests > cabin.maxGuests) {
    throw new HttpError(`Requests can include up to ${cabin.maxGuests} guests.`);
  }
  if (name.length < 1 || name.length > 120) throw new HttpError("Add the name for the reservation.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) throw new HttpError("Add a valid email.");
  if (phone.replace(/\D/g, "").length < 7 || phone.length > 40) throw new HttpError("Add a phone number.");
  if (message.length > 2000) throw new HttpError("The note is too long.");
  quoteStay(checkIn, checkOut);
  return { checkIn, checkOut, guests, name, email, phone, message };
}

export async function createRequest(input: RequestInput) {
  const db = await getDatabase();
  const booking = await db.transaction(async (query) => {
    await query(`SELECT pg_advisory_xact_lock(482910)`);
    await expireHolds(query);
    if ((await localConflict(query, input.checkIn, input.checkOut)) || (await outsideConflict(input.checkIn, input.checkOut))) {
      throw new HttpError("Those nights are already taken.", 409);
    }
    const quote = quoteStay(input.checkIn, input.checkOut);
    const rows = await query(
      `INSERT INTO booking_requests
        (id, check_in, check_out, guests, guest_name, email, phone, message, status, amount_cents, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$9,$10)
       RETURNING *`,
      [
        crypto.randomUUID(),
        input.checkIn,
        input.checkOut,
        input.guests,
        input.name,
        input.email,
        input.phone,
        input.message,
        quote.totalCents,
        nowIso(),
      ],
    );
    return mapBooking(rows[0]);
  });

  const reviewUrl = `${siteUrl()}/host/decide?token=${encodeURIComponent(signToken({ id: booking.id, action: "review", exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }))}`;
  try {
    await sendRequestEmails({ ...booking, reviewUrl });
  } catch (error) {
    console.error("Request email failed", error);
  }
  return booking;
}

export async function getBooking(id: string) {
  const db = await getDatabase();
  const rows = await db.query(`SELECT * FROM booking_requests WHERE id = $1`, [id]);
  return rows[0] ? mapBooking(rows[0]) : null;
}

export async function approveBooking(id: string) {
  const db = await getDatabase();
  const result = await db.transaction(async (query) => {
    await query(`SELECT pg_advisory_xact_lock(482910)`);
    await expireHolds(query);
    const rows = await query(`SELECT * FROM booking_requests WHERE id = $1`, [id]);
    const existing = rows[0] ? mapBooking(rows[0]) : null;
    if (!existing) throw new HttpError("Request not found.", 404);
    if (existing.status === "paid") throw new HttpError("This stay is already paid.", 409);
    if (existing.status === "declined" || existing.status === "expired") {
      throw new HttpError("This request is closed.", 409);
    }
    if (existing.status === "approved") return { booking: existing, created: false };
    if ((await localConflict(query, existing.checkIn, existing.checkOut, existing.id)) || (await outsideConflict(existing.checkIn, existing.checkOut))) {
      throw new HttpError("Those nights were just taken.", 409);
    }
    const quote = quoteStay(existing.checkIn, existing.checkOut);
    const hold = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const updated = await query(
      `UPDATE booking_requests
       SET status = 'approved', amount_cents = $2, hold_expires_at = $3, stripe_session_id = NULL, payment_url = NULL
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id, quote.totalCents, hold],
    );
    if (!updated[0]) throw new HttpError("This request changed. Refresh and try again.", 409);
    return { booking: mapBooking(updated[0]), created: true };
  });

  const paymentUrl = await ensurePaymentLink(result.booking);
  if (result.created) {
    try {
      await sendApprovedEmail({ ...result.booking, amountCents: result.booking.amountCents, paymentUrl });
    } catch (error) {
      console.error("Approval email failed", error);
    }
  }
  return { booking: { ...result.booking, paymentUrl }, paymentUrl };
}

export async function declineBooking(id: string) {
  const db = await getDatabase();
  const booking = await db.transaction(async (query) => {
    await query(`SELECT pg_advisory_xact_lock(482910)`);
    const rows = await query(`SELECT * FROM booking_requests WHERE id = $1`, [id]);
    const existing = rows[0] ? mapBooking(rows[0]) : null;
    if (!existing) throw new HttpError("Request not found.", 404);
    if (existing.status === "paid") throw new HttpError("This stay is already paid.", 409);
    if (existing.status === "declined") return existing;
    const updated = await query(
      `UPDATE booking_requests
       SET status = 'declined', payment_url = NULL
       WHERE id = $1 AND status IN ('pending', 'approved')
       RETURNING *`,
      [id],
    );
    if (!updated[0]) throw new HttpError("This request is closed.", 409);
    return { previous: existing, booking: mapBooking(updated[0]) };
  });

  if ("previous" in booking) {
    await expireStripeSession(booking.previous.stripeSessionId);
    try {
      await sendDeclinedEmail({
        email: booking.booking.email,
        checkIn: booking.booking.checkIn,
        checkOut: booking.booking.checkOut,
        guests: booking.booking.guests,
        hadHold: booking.previous.status === "approved",
      });
    } catch (error) {
      console.error("Decline email failed", error);
    }
    return booking.booking;
  }
  return booking;
}

async function expireStripeSession(sessionId: string | null) {
  if (!sessionId) return;
  const stripe = getStripe();
  if (!stripe) return;
  try {
    await stripe.checkout.sessions.expire(sessionId);
  } catch (error) {
    console.error("Stripe session expire failed", error);
  }
}

export async function ensurePaymentLink(booking: Booking) {
  const fresh = (await getBooking(booking.id)) ?? booking;
  if (fresh.status === "paid") throw new HttpError("This stay is already paid.", 409);
  if (fresh.status !== "approved") throw new HttpError("This request is not awaiting payment.", 409);
  if (!fresh.holdExpiresAt || fresh.holdExpiresAt <= nowIso()) {
    throw new HttpError("The hold on these nights has expired.", 409);
  }
  const stripe = getStripe();
  if (!stripe) {
    if (fresh.paymentUrl) return fresh.paymentUrl;
    const url = `${siteUrl()}/booking/pay/${fresh.id}?token=${encodeURIComponent(signToken({ id: fresh.id, action: "pay", exp: Date.parse(fresh.holdExpiresAt) }))}`;
    await savePayment(fresh.id, null, url);
    return url;
  }
  if (fresh.stripeSessionId) {
    const session = await stripe.checkout.sessions.retrieve(fresh.stripeSessionId);
    if (session.status === "open" && session.url) return session.url;
    if (session.payment_status === "paid") {
      await markPaid(fresh.id);
      throw new HttpError("This stay is already paid.", 409);
    }
  }
  const holdMs = Date.parse(fresh.holdExpiresAt);
  const latest = Date.now() + 23 * 60 * 60 * 1000;
  const expiresAt = Math.floor(Math.min(holdMs, latest) / 1000);
  if (expiresAt < Math.floor(Date.now() / 1000) + 30 * 60) {
    throw new HttpError("The hold is almost over. Ask the guest to request the dates again.", 409);
  }
  const nights = quoteStay(fresh.checkIn, fresh.checkOut).nights;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: fresh.email,
    expires_at: expiresAt,
    success_url: `${siteUrl()}/booking/confirmed?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/booking/cancelled`,
    metadata: { bookingId: fresh.id },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: fresh.amountCents ?? quoteStay(fresh.checkIn, fresh.checkOut).totalCents,
          product_data: {
            name: `The Loony'Bin · ${fresh.checkIn} to ${fresh.checkOut}`,
            description: `${nights} nights, party of ${fresh.guests}`,
          },
        },
      },
    ],
  });
  if (!session.url) throw new HttpError("Stripe did not return a payment link.", 502);
  await savePayment(fresh.id, session.id, session.url);
  return session.url;
}

async function savePayment(id: string, sessionId: string | null, url: string) {
  const db = await getDatabase();
  await db.query(`UPDATE booking_requests SET stripe_session_id = $2, payment_url = $3 WHERE id = $1 AND status = 'approved'`, [
    id,
    sessionId,
    url,
  ]);
}

export async function resendPaymentEmail(id: string) {
  const booking = await getBooking(id);
  if (!booking) throw new HttpError("Request not found.", 404);
  const paymentUrl = await ensurePaymentLink(booking);
  await sendApprovedEmail({ ...booking, paymentUrl });
  return paymentUrl;
}

export async function markPaid(id: string) {
  const db = await getDatabase();
  const rows = await db.query(
    `UPDATE booking_requests
     SET status = 'paid', receipt_sent = 1
     WHERE id = $1 AND status = 'approved' AND receipt_sent = 0
     RETURNING *`,
    [id],
  );
  if (!rows[0]) {
    const existing = await getBooking(id);
    if (existing?.status === "paid") return existing;
    throw new HttpError("This stay can't be marked paid.", 409);
  }
  const booking = mapBooking(rows[0]);
  try {
    await sendPaidEmails(booking);
  } catch (error) {
    console.error("Paid email failed", error);
  }
  return booking;
}

export async function completeDevPayment(id: string) {
  if (process.env.STRIPE_SECRET_KEY) throw new HttpError("Payments go through Stripe.", 400);
  const booking = await getBooking(id);
  if (!booking || booking.status !== "approved") throw new HttpError("This link is no longer payable.", 409);
  if (!booking.holdExpiresAt || booking.holdExpiresAt <= nowIso()) {
    throw new HttpError("The hold on these nights has expired.", 409);
  }
  return markPaid(id);
}

export async function bookedNights(from: string, to: string) {
  if (!isIsoDate(from) || !isIsoDate(to) || from >= to) throw new HttpError("That date window is not valid.");
  const db = await getDatabase();
  await expireHolds(db.query.bind(db));
  const stays = await db.query(
    `SELECT check_in, check_out FROM booking_requests
     WHERE (status = 'paid' OR (status = 'approved' AND hold_expires_at > $1))
       AND check_in < $3 AND check_out > $2`,
    [nowIso(), from, to],
  );
  const blocks = await db.query(
    `SELECT start_date, end_date FROM date_blocks WHERE start_date < $2 AND end_date > $1`,
    [from, to],
  );
  const external = await airbnbRanges();
  const nights = new Set<string>();
  const add = (start: string, end: string) => {
    for (const night of eachNight(start > from ? start : from, end < to ? end : to)) nights.add(night);
  };
  for (const row of stays) add(String(row.check_in), String(row.check_out));
  for (const row of blocks) add(String(row.start_date), String(row.end_date));
  for (const range of external) add(range.start, range.end);
  return [...nights].sort();
}

export async function calendarFeed() {
  const db = await getDatabase();
  await expireHolds(db.query.bind(db));
  const stays = await db.query(`SELECT id, check_in, check_out FROM booking_requests WHERE status = 'paid'`);
  const blocks = await db.query(`SELECT id, start_date, end_date, reason FROM date_blocks`);
  return buildIcs([
    ...stays.map((row) => ({
      id: String(row.id),
      start: String(row.check_in),
      end: String(row.check_out),
      summary: "Booked",
    })),
    ...blocks.map((row) => ({
      id: String(row.id),
      start: String(row.start_date),
      end: String(row.end_date),
      summary: String(row.reason || "Blocked"),
    })),
  ]);
}

export async function getOverview() {
  const db = await getDatabase();
  await expireHolds(db.query.bind(db));
  const requests = await db.query(`SELECT * FROM booking_requests ORDER BY created_at DESC`);
  const blocks = await db.query(`SELECT * FROM date_blocks ORDER BY start_date`);
  return {
    requests: requests.map(mapBooking),
    blocks: blocks.map(mapBlock),
    pricingPlaceholder: cabin.pricing.placeholder,
  };
}

export async function addBlock(firstNight: string, lastNight: string, reason: string) {
  if (!isIsoDate(firstNight) || !isIsoDate(lastNight)) throw new HttpError("Choose the first and last night.");
  if (lastNight < firstNight) throw new HttpError("The last night has to be on or after the first night.");
  const end = addIsoDays(lastNight, 1);
  const note = reason.trim().slice(0, 200);
  const db = await getDatabase();
  return db.transaction(async (query) => {
    await query(`SELECT pg_advisory_xact_lock(482910)`);
    await expireHolds(query);
    if (await localConflict(query, firstNight, end)) {
      throw new HttpError("Those nights include a paid stay or an open hold.", 409);
    }
    const rows = await query(
      `INSERT INTO date_blocks (id, start_date, end_date, reason, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [crypto.randomUUID(), firstNight, end, note, nowIso()],
    );
    return mapBlock(rows[0]);
  });
}

export async function removeBlock(id: string) {
  const db = await getDatabase();
  await db.query(`DELETE FROM date_blocks WHERE id = $1`, [id]);
}

export function clearStripeSession(bookingId: string, sessionId: string) {
  return getDatabase().then((db) =>
    db.query(
      `UPDATE booking_requests SET stripe_session_id = NULL, payment_url = NULL
       WHERE id = $1 AND stripe_session_id = $2 AND status = 'approved'`,
      [bookingId, sessionId],
    ),
  );
}

export type { DateRange };
