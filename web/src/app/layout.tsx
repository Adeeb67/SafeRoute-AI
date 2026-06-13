import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToastNotifications from "@/components/ToastNotifications";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SafeRoute AI - Emergency Disaster Management",
  description: "AI-powered disaster detection, navigation routing, and SOS coordination platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={`${inter.className} antialiased bg-[#0b0f19] text-gray-100 min-h-screen flex flex-col`}>
        <ToastNotifications />
        {children}
      </body>
    </html>
  );
}
