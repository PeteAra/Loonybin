import crypto from "node:crypto";

export type TokenPayload = {
  id: string;
  action: "session" | "review" | "pay";
  exp: number;
};

function secret() {
  const value = process.env.HOST_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV !== "production") return "dev-host-secret";
  throw new Error("HOST_SECRET is required.");
}

export function signToken(payload: TokenPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload {
  const [body, signature] = token.split(".");
  if (!body || !signature) throw new Error("This link is not valid.");
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error("This link is not valid.");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload;
  if (!payload.exp || payload.exp < Date.now()) throw new Error("This link has expired.");
  return payload;
}
