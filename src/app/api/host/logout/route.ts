import { clearHostSession } from "@/lib/auth";
import { json } from "@/lib/http";

export const runtime = "nodejs";

export async function POST() {
  await clearHostSession();
  return json({ ok: true });
}
