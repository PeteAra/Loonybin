import { clearStripeSession, markPaid } from "@/lib/bookings";
import { fail, json } from "@/lib/http";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) return json({ error: "Stripe webhook is not configured." }, 500);
    const signature = request.headers.get("stripe-signature");
    if (!signature) return json({ error: "Missing signature." }, 400);
    const event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      if (bookingId && session.payment_status === "paid") await markPaid(bookingId);
    }
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      if (bookingId) await clearStripeSession(bookingId, session.id);
    }
    return json({ received: true });
  } catch (error) {
    return fail(error);
  }
}
