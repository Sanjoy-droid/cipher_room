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
    <main className="relative isolate flex h-dvh max-h-dvh flex-col overflow-hidden bg-black font-mono text-zinc-100">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.10),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.06),transparent_50%)]" />

      <header className="flex items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-950/80 px-3 py-2.5 backdrop-blur-md sm:px-5 sm:py-3">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500 sm:text-[10px]">
              Room ID
            </span>
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="min-w-0 truncate text-xs font-bold text-green-500 sm:text-sm">
                {roomId.slice(0, 10) + "..."}
              </span>
              <button
                className="w-[68px] shrink-0 cursor-pointer rounded border border-zinc-800 bg-zinc-900 py-0.5 text-center text-[10px] font-semibold tracking-wider text-zinc-400 transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100 active:scale-95"
                onClick={copyLink}
              >
                {copyStatus}
              </button>
            </div>
          </div>

          <div className="h-9 w-px shrink-0 bg-gradient-to-b from-transparent via-zinc-700 to-transparent" />

          <div className="flex shrink-0 flex-col gap-1">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500 sm:text-[10px]">
              <span className="sm:hidden">Timer</span>
              <span className="hidden sm:inline">Self-Destruct</span>
            </span>
            <span
              className={`flex w-fit items-center gap-2 rounded-md border px-2 py-0.5 text-xs font-bold tabular-nums transition-colors sm:px-2.5 sm:text-sm ${
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
          aria-label="Destroy room now"
          className="group flex shrink-0 cursor-pointer items-center gap-2 rounded-md border border-red-900/40 bg-red-950/20 px-2.5 py-2 text-xs font-bold tracking-wider text-red-400 transition-all hover:border-red-600 hover:bg-red-600 hover:text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.35)] active:scale-95 disabled:opacity-50 sm:px-3.5"
          onClick={() => destroyRoom()}
        >
          <span className="group-hover:animate-pulse">💣</span>
          <span className="hidden sm:inline">DESTROY NOW</span>
        </button>
      </header>

      {/* MESSAGES */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 scrollbar-thin sm:space-y-5 sm:p-5">
        {messages?.messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/60 text-xl sm:h-14 sm:w-14 sm:text-2xl">
              🔒
            </div>
            <p className="font-mono text-xs text-zinc-600 sm:text-sm">
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
              className={`group flex max-w-[88%] flex-col sm:max-w-[80%] lg:max-w-[65%] ${
                msg.sender === username ? "items-end" : "items-start"
              }`}
            >
              <div className="mb-1 flex items-baseline gap-2 sm:mb-1.5 sm:gap-3">
                <span
                  className={`max-w-[40vw] truncate text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${
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
                className={`break-all rounded-lg border px-3 py-1.5 text-[13px] leading-relaxed shadow-sm sm:px-3.5 sm:py-2 sm:text-sm ${
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

      <div className="border-t border-zinc-800/80 bg-zinc-950/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2 sm:gap-3">
          <div className="group relative min-w-0 flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 animate-pulse font-bold text-green-500 sm:left-4">
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
              className="w-full rounded-md border border-zinc-800 bg-black py-3 pl-9 pr-3 text-base text-zinc-100 transition-all placeholder:text-zinc-700 focus:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/15 sm:pr-4 sm:text-sm"
            />
          </div>

          <button
            onClick={() => {
              sendMessage({ text: input });
              inputRef.current?.focus();
            }}
            disabled={!input.trim() || isPending}
            className="shrink-0 cursor-pointer rounded-md bg-green-500 px-4 text-xs font-bold tracking-wider text-black transition-all hover:bg-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none sm:px-7 sm:text-sm"
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
