import { completeDevPayment } from "@/lib/bookings";
import { fail, json } from "@/lib/http";
import { verifyToken } from "@/lib/tokens";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { token?: string };
    const payload = verifyToken(String(body.token ?? ""));
    if (payload.action !== "pay" || payload.id !== id) return json({ error: "This payment link is not valid." }, 403);
    await completeDevPayment(id);
    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
