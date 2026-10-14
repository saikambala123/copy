import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NOVA — Stream Beyond Limits",
  description:
    "NOVA is a premium streaming platform for movies & series. Award-winning films, bingeable shows, 4K quality — stream beyond limits.",
  keywords: ["NOVA", "streaming", "movies", "series", "watch online", "4K"],
  applicationName: "NOVA",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23f43f5e'/%3E%3Cstop offset='1' stop-color='%23e11d48'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='9' fill='url(%23g)'/%3E%3Cpath d='M13 10.5l9 5.5-9 5.5z' fill='white'/%3E%3C/svg%3E",
        type: "image/svg+xml",
      },
    ],
  },
  openGraph: {
    title: "NOVA — Stream Beyond Limits",
    description: "Premium movies & series streaming.",
    siteName: "NOVA",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#08080b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          closeButton
          toastOptions={{
            style: {
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#14141a",
              color: "#f4f4f6",
            },
          }}
        />
      </body>
    </html>
  );
}
