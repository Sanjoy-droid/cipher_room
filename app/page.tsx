"use client";

import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const Page = () => {
  return (
    <Suspense>
      <Lobby />
    </Suspense>
  );
};

export default Page;

function Lobby() {
  const { username } = useUsername();
  const router = useRouter();

  const searchParams = useSearchParams();
  const wasDestroyed = searchParams.get("destroyed") === "true";
  const error = searchParams.get("error");

  const { mutate: createRoom } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();

      if (res.status === 200) {
        router.push(`/room/${res.data?.roomId}`);
      }
    },
  });

  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4 font-mono">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.08),transparent_55%)]" />

      <div className="w-full max-w-md space-y-8">
        {wasDestroyed && (
          <div className="flex items-start gap-3 rounded-md border border-red-900/60 bg-red-950/40 p-4 backdrop-blur-sm">
            <span className="text-lg">💥</span>
            <div>
              <p className="text-sm font-bold tracking-wider text-red-500">
                ROOM DESTROYED
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                All messages were permanently deleted.
              </p>
            </div>
          </div>
        )}
        {error === "room-not-found" && (
          <div className="flex items-start gap-3 rounded-md border border-red-900/60 bg-red-950/40 p-4 backdrop-blur-sm">
            <span className="text-lg">🔍</span>
            <div>
              <p className="text-sm font-bold tracking-wider text-red-500">
                ROOM NOT FOUND
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                This room may have expired or never existed.
              </p>
            </div>
          </div>
        )}
        {error === "room-full" && (
          <div className="flex items-start gap-3 rounded-md border border-red-900/60 bg-red-950/40 p-4 backdrop-blur-sm">
            <span className="text-lg">🚫</span>
            <div>
              <p className="text-sm font-bold tracking-wider text-red-500">
                ROOM FULL
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                This room is at maximum capacity.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3 text-center">
          <h1 className="bg-gradient-to-b from-green-300 to-green-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent drop-shadow-[0_0_25px_rgba(34,197,94,0.35)]">
            {"> "}cipher_room
          </h1>
          <p className="text-sm text-zinc-500">
            No logs. No history. Just a timer.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 shadow-2xl shadow-black/60 backdrop-blur-md">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/60 to-transparent" />

          <div className="space-y-5">
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Your Identity
            </label>

            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 p-3 font-mono text-sm text-zinc-300 shadow-inner shadow-black/50">
                {username}
              </div>
            </div>

            <button
              onClick={() => createRoom()}
              className="mt-2 w-full cursor-pointer rounded-md bg-green-500 p-3 text-sm font-bold tracking-widest text-black transition-all hover:bg-green-400 hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] active:scale-[0.98] disabled:opacity-50"
            >
              CREATE SECURE ROOM
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.2em] text-zinc-700">
          <span>Self-destructing</span>
          <span className="h-1 w-1 rounded-full bg-zinc-700" />
          <span>Realtime</span>
        </div>
      </div>
    </main>
  );
}
