"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Library, ListChecks, Plus, Youtube, CalendarDays } from "lucide-react";
import Header from "../components/Header";
import ReportCard from "../components/ReportCard";
import { useInfiniteQuery } from "@tanstack/react-query";

/* ===============================
   Types
================================ */
interface YoutubeVideo {
  id: string;
  title: string;
  thumbnail: string;
}

/* ===============================
   Fetch 함수 (React Query용)
================================ */
const fetchVideos = async ({ pageParam }: { pageParam: string }) => {
  const url = pageParam
    ? `/api/youtube?q=운동 루틴&pageToken=${pageParam}`
    : `/api/youtube?q=운동 루틴`;

  const res = await fetch(url);
  const data = await res.json();

  return {
    items: (data.items ?? []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
    })),
    nextPageToken: data.nextPageToken ?? null,
  };
};

export default function HomePage() {
  const router = useRouter();
  const observerRef = useRef<HTMLDivElement | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<any>(null);

  /* ===============================
     React Query (🔥 핵심)
  ================================ */
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["youtubeVideos"],
      queryFn: fetchVideos,
      initialPageParam: "",
      getNextPageParam: (lastPage) => lastPage.nextPageToken,
      staleTime: 1000 * 60 * 5, // 5분 캐싱
      refetchOnWindowFocus: false,
    });

  /* ===============================
     데이터 평탄화
  ================================ */
  const videos = useMemo(() => {
    const seen = new Set();

    return (
      data?.pages
        .flatMap((page) => page.items)
        .filter((video) => {
          if (seen.has(video.id)) return false;
          seen.add(video.id);
          return true;
        }) ?? []
    );
  }, [data]);
  /* ===============================
     날짜
  ================================ */
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  }, []);

  /* ===============================
     운동 상태
  ================================ */
  useEffect(() => {
    const stored = localStorage.getItem("activeWorkout");
    const saved = localStorage.getItem("savedRoutines");

    if (!stored) return;

    const active = JSON.parse(stored);
    const routines = saved ? JSON.parse(saved) : [];

    const exists = routines.some((r: any) => r.id === active.routine.id);

    if (!exists) {
      localStorage.removeItem("activeWorkout");
      setActiveWorkout(null);
    } else {
      setActiveWorkout(active);
    }
  }, []);

  const totalSets = useMemo(() => {
    return (
      activeWorkout?.routine.exercises.reduce(
        (sum: number, ex: any) => sum + ex.sets,
        0,
      ) ?? 0
    );
  }, [activeWorkout]);

  const completed = useMemo(() => {
    return (
      activeWorkout?.completedSets.reduce(
        (sum: number, val: number) => sum + val,
        0,
      ) ?? 0
    );
  }, [activeWorkout]);

  const percent = useMemo(() => {
    return totalSets ? Math.floor((completed / totalSets) * 100) : 0;
  }, [totalSets, completed]);

  /* ===============================
     Intersection Observer
  ================================ */
  useEffect(() => {
    if (!observerRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header title="My Workout Routine" />

      <main className="container mx-auto px-10">
        {/* ===============================
          Daily Report
        =============================== */}
        <section
          onClick={() => router.push("/routines/active")}
          className="cursor-pointer rounded-3xl p-6 mt-8 mb-10 text-white shadow-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        >
          <div className="mb-4 px-4 py-1 rounded-full bg-white/20 text-sm inline-block">
            진행중인 운동 달성률을 확인하세요!
          </div>

          <h2 className="text-xl font-bold">
            {activeWorkout?.routine?.name ?? "진행중인 운동 없음"}
          </h2>

          <p className="text-sm opacity-80 mb-4">{formattedDate}</p>

          <div className="h-2 bg-white/30 rounded-full overflow-hidden mb-3">
            <div
              className="h-2 bg-white rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex justify-between">
            <p>진행 중</p>
            <p>{percent}%</p>
          </div>
        </section>

        {/* ===============================
          버튼 영역
        =============================== */}
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
          리포트
        =============================== */}
        <section className="mb-12">
          <ReportCard
            title="운동 달력"
            description="완료한 운동을 확인"
            onClick={() => router.push("/calendar")}
            icon={<CalendarDays className="size-6 text-white" />}
          />
        </section>

        {/* ===============================
          YouTube
        =============================== */}
        <section>
          <h2 className="text-lg font-black mb-4 flex gap-2">
            <Youtube className="text-red-500" />
            추천 운동 영상
            <span className="text-sm text-slate-400">총 {videos.length}개</span>
          </h2>

          {isLoading && <p>로딩 중...</p>}

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
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="font-bold line-clamp-2">{v.title}</p>
                </div>
              </a>
            ))}
          </div>

          {hasNextPage && (
            <div
              ref={observerRef}
              className="h-20 flex justify-center items-center"
            >
              {isFetchingNextPage ? "불러오는 중..." : "스크롤하여 더 보기"}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ===============================
   Button
================================ */
const CheckButton = React.memo(function CheckButton({
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
});
