import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, DM_Serif_Display, Cormorant_Garamond, Playfair_Display, IM_Fell_English } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import { PaletteInitializer } from "@/components/palette-switcher";
import { CustomThemeInitializer } from "@/components/custom-theme-initializer";

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

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["300", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const imFellEnglish = IM_Fell_English({
  variable: "--font-im-fell-english",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
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
      className={`${plusJakartaSans.variable} ${geistMono.variable} ${dmSerifDisplay.variable} ${cormorantGaramond.variable} ${playfairDisplay.variable} ${imFellEnglish.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <PaletteInitializer />
          <CustomThemeInitializer />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
