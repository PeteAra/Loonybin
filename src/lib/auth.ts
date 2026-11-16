import crypto from "node:crypto";
import { cookies } from "next/headers";
import { signToken, verifyToken } from "@/lib/tokens";

const COOKIE = "loony_host";

export function hostPassword() {
  const value = process.env.HOST_PASSWORD;
  if (value) return value;
  if (process.env.NODE_ENV !== "production") return "loony-host";
  throw new Error("HOST_PASSWORD is required.");
}

function passwordsMatch(input: string, expected: string) {
  const actual = Buffer.from(input);
  const target = Buffer.from(expected);
  if (actual.length !== target.length) return false;
  return crypto.timingSafeEqual(actual, target);
}

export async function isHost() {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (!value) return false;
  try {
    return verifyToken(value).action === "session";
  } catch {
    return false;
  }
}

export async function startHostSession() {
  const jar = await cookies();
  jar.set(COOKIE, signToken({ id: "host", action: "session", exp: Date.now() + 14 * 24 * 60 * 60 * 1000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearHostSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function passwordIsValid(password: string) {
  return passwordsMatch(password, hostPassword());
}
