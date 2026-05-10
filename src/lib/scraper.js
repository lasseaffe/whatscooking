import axios from 'axios';

export async function scrapeUrl(url) {
  try {
    // We use Microlink to get the "OpenGraph" data (the same data Discord or Slack uses)
    // This is rarely blocked by anti-bot measures.
    const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl);

    if (!data.data) throw new Error("No data from proxy");

    return {
      title: data.data.title || "New Recipe",
      ingredients: [], // Free proxies are often blocked from reading the full page body
      image: data.data.image?.url || null,
      error: data.data.title ? null : "Bouncer blocked the full ingredient list."
    };
  } catch (error) {
    // Fallback: If the API fails, we create a title from the URL text itself
    const slugTitle = url.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || "New Recipe";
    const cleanTitle = slugTitle.charAt(0).toUpperCase() + slugTitle.slice(1);
    
    return {
      title: cleanTitle,
      ingredients: [],
      error: "Site security is high. Title extracted from URL."
    };
  }
}
