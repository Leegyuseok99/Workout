import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ items: [] });
  }

  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?` +
      new URLSearchParams({
        part: "snippet",
        q: query,
        type: "video",
        maxResults: "6",
        key: YOUTUBE_API_KEY!,
      }),
  );

  const data = await res.json();
  return NextResponse.json(data);
}
