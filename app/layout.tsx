import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "cipher_room | Private, self-destructing chat",
    template: "%s | cipher_room",
  },
  description:
    "Private, self-destructing realtime chat rooms. Create a room, share the link, and everything is deleted when the timer hits zero.",
  applicationName: "cipher_room",
  keywords: [
    "private chat",
    "self-destructing chat",
    "ephemeral messaging",
    "realtime chat",
    "anonymous chat",
    "Next.js",
    "Elysia",
    "Upstash",
  ],
  openGraph: {
    title: "cipher_room",
    description: "Private, self-destructing realtime chat rooms.",
    siteName: "cipher_room",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "cipher_room",
    description: "Private, self-destructing realtime chat rooms.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-black">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
