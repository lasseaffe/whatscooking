import { NextRequest, NextResponse } from "next/server";

// Nominatim reverse-geocoding proxy — adds required User-Agent header
// and avoids CORS issues from the browser.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");

  const headers = {
    "User-Agent": "WhatsCooking/1.0 (recipe discovery app; contact@whatscooking.app)",
    "Accept-Language": "en",
  };

  let url: string;

  if (lat && lon) {
    // Reverse geocode from coordinates
    url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  } else if (q) {
    // Forward geocode from text query
    url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`;
  } else {
    return NextResponse.json({ error: "Provide q or lat+lon" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { headers, next: { revalidate: 86400 } });
    const raw = await res.json();
    const result = Array.isArray(raw) ? raw[0] : raw;

    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const addr = result.address ?? {};
    return NextResponse.json({
      country: addr.country ?? null,
      country_code: (addr.country_code ?? "").toLowerCase(),
      state: addr.state ?? addr.county ?? null,
      city: addr.city ?? addr.town ?? addr.village ?? null,
      display_name: result.display_name ?? null,
      lat: result.lat ?? lat,
      lon: result.lon ?? lon,
    });
  } catch {
    return NextResponse.json({ error: "Geocode service unavailable" }, { status: 502 });
  }
}
