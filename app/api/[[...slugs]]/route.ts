import { redis } from "@/lib/redis";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";

const ROOT_TTL_SECONDS = 60 * 10;

const rooms = new Elysia({ prefix: "/room" }).post("/create", async () => {
  const roomId = nanoid();

  await redis.hset(`meta:${roomId}`, {
    connected: [],
    createAt: Date.now(),
  });

  await redis.expire(`meta:${roomId}`, ROOT_TTL_SECONDS);

  return { roomId };
});

export const app = new Elysia({ prefix: "/api" })
  .get("/user", {
    user: { name: "John Bruce" },
  })
  .use(rooms);

export const GET = app.fetch;
export const POST = app.fetch;
