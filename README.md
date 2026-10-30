# >cipher_room\

A private, self-destructing chat room. Create a room, share the link, chat in realtime. When the timer hits zero (or someone hits **DESTROY NOW**), everything is deleted.

## Features

- One-click room creation with a unique ID
- Realtime messaging
- Auto-expiring rooms (10 min TTL) with a live countdown
- Destroy a room instantly, wiping all messages
- Token-based access per room, with room-full and room-not-found handling
- Responsive terminal-style UI

## Tech Stack

- **Next.js** (App Router)
- **Elysia** (API, mounted at `/api`)
- **Eden Treaty** (end-to-end typed API client)
- **TanStack Query** (data fetching and mutations)
- **Upstash Redis** (rooms, messages, TTL)
- **Upstash Realtime** (live message and destroy events)
- **Tailwind CSS**, **Zod**, **nanoid**, **date-fns**

## Getting Started

```bash
git clone <your-repo-url>
cd cipher_room_
bun install
```

Create `.env.local`:

```env
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Run:

```bash
bun dev
```

Open <http://localhost:3000>.

## Scripts

| Command         | Description          |
| --------------- | -------------------- |
| `bun dev`       | Start dev server     |
| `bun run build` | Production build     |
| `bun start`     | Run production build |
| `bun run lint`  | Lint                 |

## Project Structure

```
app/
  page.tsx                      # Lobby (create room)
  room/[roomId]/page.tsx        # Chat room
  api/[[...slugs]]/route.ts     # Elysia API (room, messages)
  api/[[...slugs]]/auth.ts      # Auth middleware
hooks/use-username.ts           # Anonymous identity
lib/
  client.ts                     # Eden Treaty client
  redis.ts                      # Upstash Redis client
  realtime.ts                   # Realtime server
  realtime-client.ts            # Realtime hook
```

## How It Works

1. `POST /api/room/create` creates a `meta:<roomId>` hash in Redis with a 10 minute TTL.
2. Messages are pushed to `messages:<roomId>`, and their TTL follows the room's remaining time.
3. Each message emits a realtime `chat.message` event, and clients refetch via TanStack Query.
4. On expiry or destroy, a `chat.destroy` event redirects everyone to the lobby.

## Deploy

Deploy on [Vercel](https://vercel.com) and add the same env vars in project settings.

## License

MIT
