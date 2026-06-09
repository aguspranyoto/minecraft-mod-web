import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Minecraft Mods by Agus | Premium Resource Packs & Mods",
  description:
    "Download premium Minecraft mods and resource packs. Get 30-day access to exclusive content.",
  openGraph: {
    title: "Minecraft Mods by Agus",
    description:
      "Download premium Minecraft mods and resource packs. Get 30-day access to exclusive content.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-neutral-100">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#171717",
              border: "1px solid #333",
              color: "#ededed",
            },
          }}
        />
      </body>
    </html>
  );
}
