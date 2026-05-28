import { DrinksHubClient } from "./drinks-hub-client";

export const metadata = {
  title: "Drinks | What's Cooking",
  description:
    "Café culture, bar craft, wine & spirits, wellness, and zero-proof — professional-grade drinks for every discipline.",
};

export default function DrinksPage() {
  return <DrinksHubClient />;
}
