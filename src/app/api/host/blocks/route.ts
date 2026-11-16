import { isHost } from "@/lib/auth";
import { addBlock } from "@/lib/bookings";
import { fail, json } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!(await isHost())) return json({ error: "Sign in required." }, 401);
    const body = (await request.json()) as { firstNight?: string; lastNight?: string; reason?: string };
    const block = await addBlock(String(body.firstNight ?? ""), String(body.lastNight ?? ""), String(body.reason ?? ""));
    return json({ block });
  } catch (error) {
    return fail(error);
  }
}
