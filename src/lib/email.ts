import { cabin } from "@/content/cabin";
import { formatLong, formatTimestamp, nightsBetween } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import { Resend } from "resend";

type Mail = { to: string; subject: string; html: string };

function shell(title: string, body: string) {
  return `<div style="background:#f3eee4;color:#24170f;padding:32px;font-family:Georgia,serif;">
    <p style="letter-spacing:.16em;text-transform:uppercase;font-size:12px;font-family:Arial,sans-serif;">The Loony'Bin</p>
    <h1 style="font-weight:normal;font-size:32px;line-height:1.1;">${title}</h1>
    <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;">${body}</div>
  </div>`;
}

function button(href: string, label: string) {
  return `<p><a href="${href}" style="display:inline-block;background:#24352b;color:#f3eee4;padding:12px 18px;text-decoration:none;">${label}</a></p>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stayLine(checkIn: string, checkOut: string, guests: number) {
  const nights = nightsBetween(checkIn, checkOut);
  return `<p>${escapeHtml(formatLong(checkIn))} to ${escapeHtml(formatLong(checkOut))} · ${nights} night${nights === 1 ? "" : "s"} · party of ${guests}</p>`;
}

function priceNote(cents: number | null) {
  if (cents == null) return "";
  const sample = cabin.pricing.placeholder ? " This amount is a sample until the host replaces the rate and fees." : "";
  return `<p><strong>${formatMoney(cents)}</strong>${sample}</p>`;
}

export async function sendMail(message: Mail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`\n[email skipped]\nTo: ${message.to}\nSubject: ${message.subject}\n`);
    return;
  }
  const resend = new Resend(key);
  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM || "The Loony'Bin <onboarding@resend.dev>",
    to: message.to,
    subject: message.subject,
    html: message.html,
  });
  if (result.error) throw new Error(result.error.message);
}

export async function sendRequestEmails(booking: {
  name: string;
  email: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  amountCents: number | null;
  message: string;
  reviewUrl: string;
}) {
  await sendMail({
    to: booking.email,
    subject: "We have your request for The Loony'Bin",
    html: shell(
      "Request received",
      `${stayLine(booking.checkIn, booking.checkOut, booking.guests)}
      ${priceNote(booking.amountCents)}
      <p>Nothing is charged yet. If the dates work, we'll send a payment link. The nights stay open until then.</p>`,
    ),
  });
  const host = process.env.HOST_EMAIL;
  if (!host) {
    console.info(`[host review link] ${booking.reviewUrl}`);
    return;
  }
  await sendMail({
    to: host,
    subject: `New request · ${formatLong(booking.checkIn)}`,
    html: shell(
      escapeHtml(booking.name),
      `${stayLine(booking.checkIn, booking.checkOut, booking.guests)}
      ${priceNote(booking.amountCents)}
      <p>${escapeHtml(booking.email)}</p>
      ${booking.message ? `<p>${escapeHtml(booking.message)}</p>` : ""}
      ${button(booking.reviewUrl, "Approve or decline")}`,
    ),
  });
}

export async function sendApprovedEmail(booking: {
  email: string;
  name: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  amountCents: number | null;
  holdExpiresAt: string | null;
  paymentUrl: string;
}) {
  const until = booking.holdExpiresAt ? ` The link and the hold last until ${escapeHtml(formatTimestamp(booking.holdExpiresAt))}.` : "";
  await sendMail({
    to: booking.email,
    subject: "Your Loony'Bin dates are held",
    html: shell(
      `You're held, ${escapeHtml(booking.name.split(" ")[0] || "there")}`,
      `${stayLine(booking.checkIn, booking.checkOut, booking.guests)}
      ${priceNote(booking.amountCents)}
      <p>Pay from this link to book the stay.${until} If the link expires, the nights open back up.</p>
      ${button(booking.paymentUrl, "Pay and book")}`,
    ),
  });
}

export async function sendDeclinedEmail(booking: {
  email: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  hadHold: boolean;
}) {
  const detail = booking.hadHold
    ? "The hold on those nights has been released. No payment is due."
    : "We can't host those dates. Nothing was charged.";
  await sendMail({
    to: booking.email,
    subject: "About your Loony'Bin request",
    html: shell("Those dates won't work", `${stayLine(booking.checkIn, booking.checkOut, booking.guests)}<p>${detail}</p>`),
  });
}

export async function sendPaidEmails(booking: {
  email: string;
  name: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  amountCents: number | null;
}) {
  const times = cabin.stay.timesArePlaceholder
    ? `<p>Sample times for now: check-in ${escapeHtml(cabin.stay.checkIn)}, check-out ${escapeHtml(cabin.stay.checkOut)}. The host will confirm the real times.</p>`
    : `<p>Check-in ${escapeHtml(cabin.stay.checkIn)}. Check-out ${escapeHtml(cabin.stay.checkOut)}.</p>`;
  await sendMail({
    to: booking.email,
    subject: "You're booked at The Loony'Bin",
    html: shell(
      "The nights are yours",
      `<p>${escapeHtml(booking.name)}, the stay is booked.</p>
      ${stayLine(booking.checkIn, booking.checkOut, booking.guests)}
      ${priceNote(booking.amountCents)}
      ${times}
      <p>Lake Minnewawa, near McGregor. We'll be in touch before you arrive.</p>`,
    ),
  });
  const host = process.env.HOST_EMAIL;
  if (!host) return;
  await sendMail({
    to: host,
    subject: `Paid · ${formatLong(booking.checkIn)}`,
    html: shell(
      "Payment received",
      `${stayLine(booking.checkIn, booking.checkOut, booking.guests)}
      <p>${escapeHtml(booking.name)} · ${escapeHtml(booking.email)}</p>
      ${priceNote(booking.amountCents)}`,
    ),
  });
}
