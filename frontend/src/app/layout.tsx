import type {
  Metadata,
  Viewport,
} from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import LanguageSelector from "./components/LanguageSelector";

import {
  LanguageProvider,
} from "./context/LanguageContext";

import "./globals.css";

const geistSans = Geist({
  variable:
    "--font-geist-sans",

  subsets: [
    "latin",
  ],
});

const geistMono = Geist_Mono({
  variable:
    "--font-geist-mono",

  subsets: [
    "latin",
  ],
});

export const metadata: Metadata = {
  title:
    "Aurisense AI",

  description:
    "AI-driven tinnitus assessment and personalised therapeutic support platform",
};

/*
 * Ensures the website uses the actual
 * width of mobile and tablet screens.
 */
export const viewport: Viewport = {
  width:
    "device-width",

  initialScale: 1,

  viewportFit:
    "cover",

  themeColor:
    "#07121F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
        h-full
        w-full
        overflow-x-clip
        antialiased
      `}
    >
      <body
        className="
          flex
          min-h-dvh
          w-full
          max-w-full
          flex-col
          overflow-x-clip
        "
      >
        <LanguageProvider>
          <main
            className="
              flex
              min-h-dvh
              w-full
              min-w-0
              max-w-full
              flex-1
              flex-col
              overflow-x-clip
            "
          >
            {children}
          </main>

          <LanguageSelector />
        </LanguageProvider>
      </body>
    </html>
  );
}