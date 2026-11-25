import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PULSEORA — Every Beat. Every Signal. Every Life.",
  description: "AI-Powered Wearable Health Monitoring & Early Warning Platform. Developed in collaboration with Nitte Pharma Innovation Centre for Build4Karnataka.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#102D35",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-surface-ivory text-brandtext-primary antialiased selection:bg-emerald-aurora selection:text-white">
        {children}
      </body>
    </html>
  );
}
