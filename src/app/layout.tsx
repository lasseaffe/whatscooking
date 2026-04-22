import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import { PaletteInitializer } from "@/components/palette-switcher";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "What's Cooking — AI-Powered Meal Plans & Recipes",
  description:
    "Plan meals, discover recipes, get personalized cooking ideas from social media, and cook collaboratively with friends.",
  keywords: ["recipes", "meal planning", "cooking", "meal prep", "AI cooking"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <PaletteInitializer />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
