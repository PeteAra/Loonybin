import { bookedNights } from "@/lib/bookings";
import { addIsoDays, isIsoDate } from "@/lib/dates";
import { fail, json } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    if (!isIsoDate(from) || !isIsoDate(to) || to <= from || to > addIsoDays(from, 800)) {
      return json({ error: "That date window is not valid." }, 400);
    }
    return json({ booked: await bookedNights(from, to) });
  } catch (error) {
    return fail(error);
  }
}
