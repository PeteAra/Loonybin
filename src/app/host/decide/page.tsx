import { BrandLink } from "@/components/LoonMark";
import { DecidePanel } from "@/components/DecidePanel";
import { ensurePaymentLink, getBooking } from "@/lib/bookings";
import { verifyToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export default async function DecidePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) return <Note>This link is missing its token.</Note>;
  try {
    const payload = verifyToken(token);
    if (payload.action !== "review") return <Note>This link can't review a request.</Note>;
    const booking = await getBooking(payload.id);
    if (!booking) return <Note>That request wasn't found.</Note>;
    let paymentUrl: string | null = null;
    if (booking.status === "approved") {
      try {
        paymentUrl = await ensurePaymentLink(booking);
      } catch {
        paymentUrl = booking.paymentUrl;
      }
    }
    return <DecidePanel booking={booking} token={token} paymentUrl={paymentUrl} />;
  } catch (error) {
    return <Note>{error instanceof Error ? error.message : "This link is not valid."}</Note>;
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
