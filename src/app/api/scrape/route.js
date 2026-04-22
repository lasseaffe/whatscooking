import { NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/scraper';

export async function POST(req) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    
    const data = await scrapeUrl(url);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Server failed to process request" }, { status: 500 });
  }
}
