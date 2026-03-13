import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fact Checking Website",
  description:
    "A simple fact-checking website using Google Fact Check API and Gemini NLP",
  icons: {
    // icon: "/scet.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Geist Font CDN */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/geist-font/dist/geist.min.css"
        />
      </head>

      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
