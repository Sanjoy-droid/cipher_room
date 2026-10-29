import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { redis } from "./lib/redis";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const roomMatch = pathname.match(/^\/room\/([^/]+)$/);

  if (!roomMatch) return NextResponse.redirect(new URL("/", request.url));

  const roomId = roomMatch[1];

  const meta = await redis.hgetall<{ connected: string[]; createdAt: number }>(
    `meta:${roomId}`,
  );

  if (!meta) {
    return NextResponse.redirect(
      new URL("/?error=room-not-found", request.url),
    );
  }

  const existingToken = request.cookies.get("x-auth-token")?.value;

  // Allowed
  if (existingToken && meta.connected.includes(existingToken)) {
    return NextResponse.next();
  }

  // Not allowed
  if (meta.connected.length >= 2) {
    return NextResponse.redirect(new URL("/?error=room-full", request.url));
  }

  const response = NextResponse.next();

  const token = nanoid();

  response.cookies.set("x-auth-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  await redis.hset(`meta:${roomId}`, {
    connected: [...meta.connected, token],
  });

  return response;
}

export const config = {
  // Add any other protected paths here, e.g. "/settings/:path*"
  matcher: ["/room/:path*"],
};
