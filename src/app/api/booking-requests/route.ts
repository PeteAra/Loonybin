import { createRequest, validateRequest } from "@/lib/bookings";
import { clientIp, fail, json } from "@/lib/http";

export const runtime = "nodejs";

const hits = new Map<string, number[]>();

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((time) => now - time < 60 * 60 * 1000);
    if (recent.length >= 8) return json({ error: "Too many requests. Try again in a little while." }, 429);
    recent.push(now);
    hits.set(ip, recent);

    const body = (await request.json()) as Record<string, unknown>;
    const booking = await createRequest(
      validateRequest({
        checkIn: String(body.checkIn ?? ""),
        checkOut: String(body.checkOut ?? ""),
        guests: Number(body.guests),
        name: String(body.name ?? ""),
        email: String(body.email ?? ""),
        phone: String(body.phone ?? ""),
        message: String(body.message ?? ""),
      }),
    );
    return json({ id: booking.id });
  } catch (error) {
    return fail(error);
  }
}
