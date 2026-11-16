import { isHost } from "@/lib/auth";
import { declineBooking } from "@/lib/bookings";
import { fail, json } from "@/lib/http";
import { verifyToken } from "@/lib/tokens";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { token?: string };
    const tokenOk = body.token ? verifyToken(body.token).action === "review" && verifyToken(body.token).id === id : false;
    if (!tokenOk && !(await isHost())) return json({ error: "Sign in required." }, 401);
    const booking = await declineBooking(id);
    return json({ booking });
  } catch (error) {
    return fail(error);
  }
}
