import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const query = searchParams.get("q") ?? "운동 루틴";
  const pageToken = searchParams.get("pageToken");

  const API_KEY = process.env.YOUTUBE_API_KEY;

  const url = new URL("https://www.googleapis.com/youtube/v3/search");

  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "6");
  url.searchParams.set("key", API_KEY!);

  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }

  const res = await fetch(url.toString());
  const data = await res.json();

  return NextResponse.json({
    items: data.items ?? [],
    nextPageToken: data.nextPageToken ?? null,
  });
}
