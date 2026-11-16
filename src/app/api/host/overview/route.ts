import { isHost } from "@/lib/auth";
import { getOverview } from "@/lib/bookings";
import { fail, json } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!(await isHost())) return json({ error: "Sign in required." }, 401);
    return json(await getOverview());
  } catch (error) {
    return fail(error);
  }
}
