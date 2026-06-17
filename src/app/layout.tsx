import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  title: "PS Cafe",
  description: "نظام إدارة كافيه البلايستيشن",
};

// viewport منفصل عن metadata — Next.js 13+ best practice
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // منع الـ zoom التلقائي على الموبايل
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-white">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
