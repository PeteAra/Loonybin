import { passwordIsValid, startHostSession } from "@/lib/auth";
import { fail, json } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    if (!passwordIsValid(String(body.password ?? ""))) return json({ error: "That password didn't match." }, 401);
    await startHostSession();
    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
