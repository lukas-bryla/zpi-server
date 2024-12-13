import { NextResponse } from "next/server";

export function middleware(req) {
  const apiKey =
    req.nextUrl.searchParams.get("api_key") || req.headers.get("api_key");

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 403 });
  }

  return NextResponse.next(); // Povol pokračování požadavku
}
