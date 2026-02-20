"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Dumbbell, Library, ListChecks, Plus } from "lucide-react";
import Header from "../components/Header";
/* ===============================
   Types
================================ */
interface YoutubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);

  /* ===============================
     YouTube Fetch
     (서버 API 경유 권장)
  ================================ */
  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch("/api/youtube?q=운동 루틴");
        const data = await res.json();

        const mapped = (data.items ?? []).map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high.url,
        }));

        setVideos(mapped.slice(0, 6));
      } catch (e) {
        console.error("영상 로딩 실패", e);
      }
    }

    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <Header title="My Workout Routine" />
      <main className="container mx-auto px-10">
        {/* ===============================
          Daily Report Card
      ================================ */}
        <section
          onClick={() => router.push("/routines/active")}
          className="cursor-pointer rounded-3xl p-6 mt-8 mb-10 text-white shadow-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        >
          <div className="inline-block mb-4 px-4 py-1 rounded-full bg-white/20 text-sm">
            진행중인 운동 달성률을 확인하세요!
          </div>

          <h2 className="text-xl font-bold mb-1">chest</h2>
          <p className="text-sm opacity-80 mb-4">2026년 2월 7일 (금)</p>

          <div className="h-2 bg-white/30 rounded-full overflow-hidden mb-3">
            <div className="h-full w-0 bg-white rounded-full" />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm opacity-80">1개 운동 중 0개 완료</span>
            <span className="text-3xl font-black">0%</span>
          </div>
        </section>

        {/* ===============================
          Today Check-in
      ================================ */}
        <section className="mb-12">
          <h2 className="text-lg font-black mb-4">Exercise</h2>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            <CheckButton
              label="내 루틴"
              onClick={() => router.push("/routines")}
              icon={
                <div className="size-12 mx-auto mb-3 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg">
                  <ListChecks className="size-6 text-white" />
                </div>
              }
            />
            <CheckButton
              label="라이브러리"
              onClick={() => router.push("/workout")}
              icon={
                <div className="size-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Library className="size-6 text-white" />
                </div>
              }
            />
            <CheckButton
              label="루틴 만들기"
              onClick={() => router.push("/create")}
              icon={
                <div className="size-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
                  <Plus className="size-6 text-white" />
                </div>
              }
            />
          </div>
        </section>

        {/* ===============================
          Recommended Videos
      ================================ */}
        <section>
          <h2 className="text-lg font-black mb-4 flex items-center gap-2">
            <span className="text-red-500">▶</span> 추천 운동 영상
            <span className="text-sm text-slate-400">총 {videos.length}개</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map((v, idx) => (
              <a
                key={v.id}
                href={`https://www.youtube.com/watch?v=${v.id}`}
                target="_blank"
                className={`relative rounded-3xl overflow-hidden shadow-lg group ${
                  idx === 0 ? "md:col-span-2 md:row-span-2" : ""
                }`}
              >
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="font-bold line-clamp-2">{v.title}</p>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center">
                    ▶
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ===============================
   Components
================================ */
function CheckButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-3xl p-6 flex flex-col items-center gap-03
             shadow-sm transition-transform duration-200
             bg-white hover:scale-105
             dark:bg-gray-800"
    >
      <div className="text-2xl">{icon}</div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}
