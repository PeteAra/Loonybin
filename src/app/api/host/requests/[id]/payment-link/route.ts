import { isHost } from "@/lib/auth";
import { resendPaymentEmail } from "@/lib/bookings";
import { fail, json } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isHost())) return json({ error: "Sign in required." }, 401);
    const { id } = await context.params;
    const paymentUrl = await resendPaymentEmail(id);
    return json({ paymentUrl });
  } catch (error) {
    return fail(error);
  }
}
