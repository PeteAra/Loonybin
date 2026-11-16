import { isHost } from "@/lib/auth";
import { removeBlock } from "@/lib/bookings";
import { fail, json } from "@/lib/http";

export const runtime = "nodejs";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isHost())) return json({ error: "Sign in required." }, 401);
    const { id } = await context.params;
    await removeBlock(id);
    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
