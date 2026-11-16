import { isHost } from "@/lib/auth";
import { approveBooking } from "@/lib/bookings";
import { fail, json } from "@/lib/http";
import { verifyToken } from "@/lib/tokens";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!(await allowed(request, id))) return json({ error: "Sign in required." }, 401);
    const result = await approveBooking(id);
    return json(result);
  } catch (error) {
    return fail(error);
  }
}

async function allowed(request: Request, id: string) {
  const body = (await request.json().catch(() => ({}))) as { token?: string };
  if (body.token) {
    const payload = verifyToken(body.token);
    return payload.action === "review" && payload.id === id;
  }
  return isHost();
}
