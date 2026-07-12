import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Script from "next/script";
import { Header } from "@/components/header";
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
  title: "Premium Minecraft Mods by Aguud",
  description:
    "Download premium Minecraft mods. Get 30-day access to exclusive content.",
  openGraph: {
    title: "Premium Minecraft Mods by Aguud",
    description:
      "Download premium Minecraft mods. Get 30-day access to exclusive content.",
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
      suppressHydrationWarning
    >
      <head>
        <Script
          src={
            process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.startsWith("SB-")
              ? "https://app.sandbox.midtrans.com/snap/snap.js"
              : "https://app.midtrans.com/snap/snap.js"
          }
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-neutral-100 transition-colors duration-300">
        <Header />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className:
              "bg-neutral-900 border-neutral-800 text-neutral-100",
          }}
        />
      </body>
    </html>
  );
}
