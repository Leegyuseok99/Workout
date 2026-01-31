"use client";

import React, { useEffect, useState } from "react";

/* ===============================
   Types
================================ */
interface Exercise {
  id: number;
  name: string;
  description: string;
  images: string[];
  muscles: string[];
}

interface YoutubeItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
  };
}

const MUSCLE_LABEL: Record<string, string> = {
  Chest: "가슴",
  Shoulders: "어깨",
  Biceps: "이두",
  Triceps: "삼두",
  Hamstrings: "햄스트링",
  Calves: "종아리",
  Glutes: "엉덩이",
};

export default function WorkoutPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );

  /* 🆕 유튜브 상태 */
  const [videos, setVideos] = useState<YoutubeItem[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);

  /* ===============================
     Data Fetch
  ================================ */
  useEffect(() => {
    async function fetchWorkouts() {
      try {
        const res = await fetch(
          "https://wger.de/api/v2/exerciseinfo/?language=2&limit=10",
        );
        const data = await res.json();

        const mapped: Exercise[] = data.results.map((item: any) => ({
          id: item.id,
          name:
            item.translations?.find((t: any) => t.language === 2)?.name ??
            "Unknown",
          description:
            item.translations
              ?.find((t: any) => t.language === 2)
              ?.description?.replace(/<[^>]*>?/gm, "")
              .replace(/&nbsp;/g, " ")
              .trim() ?? "",
          images: Array.isArray(item.images)
            ? item.images.map((i: any) => i.image)
            : [],
          muscles:
            item.muscles?.map((m: any) => m.name_en).filter(Boolean) ?? [],
        }));

        setExercises(mapped);
        setTimeout(() => setLoading(false), 800);
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
        setLoading(false);
      }
    }
    fetchWorkouts();
  }, []);

  /* ===============================
     YouTube Fetch (상세 모달 열릴 때)
  ================================ */
  useEffect(() => {
    if (!selectedExercise) return;

    async function fetchVideos() {
      setVideoLoading(true);
      try {
        const keyword = `${selectedExercise.name}`;
        const res = await fetch(
          `/api/youtube?q=${encodeURIComponent(keyword)}`,
        );
        const data = await res.json();
        setVideos(data.items?.slice(0, 2) ?? []);
      } catch (e) {
        console.error("유튜브 로딩 실패", e);
      } finally {
        setVideoLoading(false);
      }
    }

    fetchVideos();
  }, [selectedExercise]);

  /* ===============================
     Body Scroll Lock
  ================================ */
  useEffect(() => {
    document.body.style.overflow =
      loading || isFilterModalOpen || !!selectedExercise ? "hidden" : "unset";
  }, [loading, isFilterModalOpen, selectedExercise]);

  /* ===============================
     Filter + Search
  ================================ */
  const filteredExercises = exercises.filter((ex) => {
    const matchMuscle = selectedMuscle
      ? ex.muscles.includes(selectedMuscle)
      : true;

    const matchSearch = ex.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchMuscle && matchSearch;
  });

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      {/* ===============================
          Splash Screen
      ================================ */}
      <div
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-transform duration-[1000ms] ${
          !loading ? "-translate-y-full" : ""
        }`}
      >
        <p className="text-xl font-black text-blue-600 animate-pulse">
          원판 정리 하는 중...
        </p>
      </div>

      {/* ===============================
          Main Content
      ================================ */}
      <div
        className={`max-w-6xl mx-auto p-6 transition-opacity ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Header */}
        <header className="text-center mb-10 mt-10">
          <h1 className="text-4xl font-black mb-6">운동 라이브러리</h1>

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="운동 이름 검색"
            className="max-w-md w-full px-5 py-4 rounded-2xl border mb-6"
          />

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl"
          >
            {selectedMuscle
              ? `필터: ${MUSCLE_LABEL[selectedMuscle]}`
              : "운동 부위 선택하기"}
          </button>
        </header>

        {/* ===============================
            Detail Modal
        ================================ */}
        {selectedExercise && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setSelectedExercise(null)}
            />
            <div className="relative bg-white max-w-3xl w-full rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* 이미지 */}
              <div className="h-64 bg-slate-100 flex items-center justify-center">
                {selectedExercise.images[0] ? (
                  <img
                    src={selectedExercise.images[0]}
                    alt={selectedExercise.name}
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <span className="text-7xl">🏋️</span>
                )}
              </div>

              {/* 내용 */}
              <div className="p-8 space-y-10">
                {/* 설명 */}
                <section>
                  <h2 className="text-3xl font-black mb-4">
                    {selectedExercise.name}
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedExercise.description ||
                      "이 운동에 대한 설명이 없습니다."}
                  </p>
                </section>

                {/* 🆕 운동 루틴 영상 */}
                <section>
                  <h3 className="text-2xl font-black mb-4">운동 루틴 영상</h3>

                  {videoLoading && (
                    <p className="text-slate-400">영상 불러오는 중...</p>
                  )}

                  <div className="grid gap-6">
                    {videos.map((v) => (
                      <div
                        key={v.id.videoId}
                        className="rounded-xl overflow-hidden shadow"
                      >
                        <iframe
                          src={`https://www.youtube.com/embed/${v.id.videoId}`}
                          allowFullScreen
                          className="w-full aspect-video"
                        />
                        <div className="p-3">
                          <p className="font-bold text-sm line-clamp-2">
                            {v.snippet.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {v.snippet.channelTitle}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* ===============================
            Exercise List
        ================================ */}
        <div className="grid gap-6">
          {filteredExercises.map((ex) => (
            <div
              key={ex.id}
              onClick={() => setSelectedExercise(ex)}
              className="bg-white rounded-3xl p-6 shadow border cursor-pointer flex gap-6"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center">
                {ex.images[0] ? (
                  <img
                    src={ex.images[0]}
                    alt={ex.name}
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <span className="text-3xl">🏋️</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{ex.name}</h2>
                <p className="text-sm text-slate-500 line-clamp-2">
                  {ex.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
