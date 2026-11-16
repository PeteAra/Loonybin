import { BrandLink } from "@/components/LoonMark";
import { getBooking, markPaid } from "@/lib/bookings";
import { formatLong, nightsBetween } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; booking?: string }>;
}) {
  const params = await searchParams;
  let bookingId = params.booking ?? "";
  if (params.session_id) {
    const stripe = getStripe();
    if (stripe) {
      const session = await stripe.checkout.sessions.retrieve(params.session_id);
      bookingId = session.metadata?.bookingId ?? "";
      if (bookingId && session.payment_status === "paid") {
        try {
          await markPaid(bookingId);
        } catch {
          // Already paid, or the webhook won the race.
        }
      }
    }
  }

  const booking = bookingId ? await getBooking(bookingId) : null;
  const paid = booking?.status === "paid";

  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <BrandLink />
      <h1 className="mt-8 font-serif text-5xl">{paid ? "You're booked." : "We're still confirming payment."}</h1>
      {booking ? (
        <p className="mt-4 text-lg">
          {formatLong(booking.checkIn)} to {formatLong(booking.checkOut)} · {nightsBetween(booking.checkIn, booking.checkOut)} nights
          {booking.amountCents != null ? ` · ${formatMoney(booking.amountCents)}` : ""}
        </p>
      ) : (
        <p className="mt-4">We couldn't find that stay.</p>
      )}
      {paid ? <p className="mt-4 text-bark/75">A confirmation is on its way. Lake Minnewawa will be there when you are.</p> : null}
      <a href="/" className="mt-8 inline-block text-sm underline">Back to the cabin</a>
    </main>
  );
}
