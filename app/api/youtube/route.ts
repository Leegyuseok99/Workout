import { NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ items: [] });
  }

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&type=video&maxResults=5&q=${encodeURIComponent(q)}` +
      `&key=${YOUTUBE_API_KEY}`,
  );

  const data = await res.json();

  return NextResponse.json(data);
}
