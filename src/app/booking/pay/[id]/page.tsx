import { BrandLink } from "@/components/LoonMark";
import { PayButton } from "@/components/PayButton";
import { getBooking } from "@/lib/bookings";
import { formatLong, formatTimestamp, nightsBetween } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import { verifyToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  if (process.env.STRIPE_SECRET_KEY) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <BrandLink />
        <p className="mt-8 text-lg">Payments for this cabin run through Stripe. Use the link in your email.</p>
      </main>
    );
  }
  if (!token) return <Note>This payment link is missing its token.</Note>;
  try {
    const payload = verifyToken(token);
    if (payload.action !== "pay" || payload.id !== id) return <Note>This payment link is not valid.</Note>;
    const booking = await getBooking(id);
    if (!booking || booking.status !== "approved") return <Note>This link is no longer payable.</Note>;
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <BrandLink />
        <p className="mt-8 text-xs uppercase tracking-[0.18em] text-amber-deep">Sample checkout</p>
        <h1 className="mt-3 font-serif text-5xl">Pay and book</h1>
        <p className="mt-4 text-lg">
          {formatLong(booking.checkIn)} to {formatLong(booking.checkOut)} · {nightsBetween(booking.checkIn, booking.checkOut)} nights · party of {booking.guests}
        </p>
        {booking.amountCents != null ? <p className="mt-2 font-serif text-3xl">{formatMoney(booking.amountCents)}</p> : null}
        <p className="mt-2 text-sm text-bark/70">
          {booking.holdExpiresAt ? `Held until ${formatTimestamp(booking.holdExpiresAt)}.` : ""} Sample pricing until the host sets the real rate and fees.
        </p>
        <div className="mt-6">
          <PayButton id={id} token={token} />
        </div>
      </main>
    );
  } catch (error) {
    return <Note>{error instanceof Error ? error.message : "This payment link is not valid."}</Note>;
  }
}

function Note({ children }: { children: string }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <BrandLink />
      <p className="mt-8 text-lg">{children}</p>
    </main>
  );
}
