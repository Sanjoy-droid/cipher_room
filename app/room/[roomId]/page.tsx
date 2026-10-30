"use client";

import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useRealtime } from "@/lib/realtime-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function formatTimeRemaining(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const RoomContent = () => {
  const params = useParams();
  const roomId = params.roomId as string;

  const router = useRouter();

  const { username } = useUsername();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [copyStatus, setCopyStatus] = useState("COPY");
  const [countdown, setCountdown] = useState<number | null>(null);

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({ query: { roomId } });
      return res.data;
    },
  });

  const timeRemaining = countdown ?? ttlData?.ttl ?? null;

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.get({
        query: { roomId },
      });
      return res.data;
    },
  });

  useEffect(() => {
    if (timeRemaining === null || timeRemaining < 0) return;
    if (timeRemaining === 0) {
      router.push("/?destroyed=true");
      return;
    }

    const interval = setInterval(() => {
      setCountdown(Math.max(0, timeRemaining - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, router]);

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await client.messages.post(
        { sender: username, text },
        { query: { roomId } },
      );

      setInput("");
    },
  });

  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy"],
    onData: ({ event }) => {
      if (event === "chat.message") {
        refetch();
      }
      if (event === "chat.destroy") {
        router.push("/?destroyed=true");
      }
    },
  });

  const { mutate: destroyRoom } = useMutation({
    mutationFn: async () => {
      await client.room.delete(null, { query: { roomId } });
    },
  });

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopyStatus("COPIED!");
    setTimeout(() => setCopyStatus("COPY"), 2000);
  };
  return (
    <main className="relative isolate flex h-screen max-h-screen flex-col overflow-hidden bg-black font-mono text-zinc-100">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.10),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.06),transparent_50%)]" />

      <header className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Room ID
            </span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="truncate text-sm font-bold text-green-500">
                {roomId.slice(0, 10) + "..."}
              </span>
              <button
                className="cursor-pointer rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-zinc-400 transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100 active:scale-95"
                onClick={copyLink}
              >
                {copyStatus}
              </button>
            </div>
          </div>

          <div className="h-9 w-px bg-gradient-to-b from-transparent via-zinc-700 to-transparent" />

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Self-Destruct
            </span>
            <span
              className={`flex w-fit items-center gap-2 rounded-md border px-2.5 py-0.5 text-sm font-bold tabular-nums transition-colors ${
                timeRemaining !== null && timeRemaining < 60
                  ? "animate-pulse border-red-900/60 bg-red-950/40 text-red-500"
                  : "border-amber-900/40 bg-amber-950/20 text-amber-500"
              }`}
            >
              {timeRemaining !== null
                ? formatTimeRemaining(timeRemaining)
                : "--:--"}
            </span>
          </div>
        </div>

        <button
          className="group flex cursor-pointer items-center gap-2 rounded-md border border-red-900/40 bg-red-950/20 px-3.5 py-2 text-xs font-bold tracking-wider text-red-400 transition-all hover:border-red-600 hover:bg-red-600 hover:text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.35)] active:scale-95 disabled:opacity-50"
          onClick={() => destroyRoom()}
        >
          <span className="group-hover:animate-pulse">💣</span>
          DESTROY NOW
        </button>
      </header>

      {/* MESSAGES */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5 scrollbar-thin">
        {messages?.messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/60 text-2xl">
              🔒
            </div>
            <p className="font-mono text-sm text-zinc-600">
              No messages yet, start the conversation.
            </p>
          </div>
        )}

        {messages?.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === username ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`group flex max-w-[80%] flex-col ${
                msg.sender === username ? "items-end" : "items-start"
              }`}
            >
              <div className="mb-1.5 flex items-baseline gap-3">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    msg.sender === username ? "text-green-500" : "text-blue-400"
                  }`}
                >
                  {msg.sender === username ? "YOU" : msg.sender}
                </span>

                <span className="text-[10px] tabular-nums text-zinc-600">
                  {format(msg.timestamp, "HH:mm")}
                </span>
              </div>

              <p
                className={`break-all rounded-lg border px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                  msg.sender === username
                    ? "rounded-tr-none border-green-500/25 bg-green-500/10 text-green-50"
                    : "rounded-tl-none border-zinc-800 bg-zinc-900/80 text-zinc-300"
                }`}
              >
                {msg.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-800/80 bg-zinc-950/80 p-4 backdrop-blur-md">
        <div className="flex gap-3">
          <div className="group relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 animate-pulse font-bold text-green-500">
              {">"}
            </span>
            <input
              autoFocus
              type="text"
              value={input}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  sendMessage({ text: input });
                  inputRef.current?.focus();
                }
              }}
              placeholder="Type message..."
              onChange={(e) => setInput(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-black py-3 pl-9 pr-4 text-sm text-zinc-100 transition-all placeholder:text-zinc-700 focus:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/15"
            />
          </div>

          <button
            onClick={() => {
              sendMessage({ text: input });
              inputRef.current?.focus();
            }}
            disabled={!input.trim() || isPending}
            className="cursor-pointer rounded-md bg-green-500 px-7 text-sm font-bold tracking-wider text-black transition-all hover:bg-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
          >
            SEND
          </button>
        </div>
      </div>
    </main>
  );
};

const Page = () => {
  return (
    <Suspense
      fallback={
        <main className="flex h-screen items-center justify-center bg-black font-mono text-sm text-zinc-600">
          <span className="animate-pulse">Loading room...</span>
        </main>
      }
    >
      <RoomContent />
    </Suspense>
  );
};

export default Page;
