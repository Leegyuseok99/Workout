"use client";

import React, { useEffect, useState } from "react";
import { Dumbbell, Plus, Check } from "lucide-react";
import { useRouter } from "next/navigation";

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
interface Toast {
  id: number;
  message: string;
  isClosing: boolean;
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
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );

  //유튜브 상태
  const [videos, setVideos] = useState<YoutubeItem[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);

  // 운동 추가 상태 toast
  const [toasts, setToasts] = useState<Toast[]>([]);

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
        const keyword = `${selectedExercise.name} 운동 루틴`;
        const res = await fetch(
          `/api/youtube?q=${encodeURIComponent(keyword)}`,
        );
        const data = await res.json();
        const filtered = (data.items ?? []).filter(
          (item: any) => item.id?.videoId,
        );

        setVideos(filtered.slice(0, 2));
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

  function showToast(message: string) {
    const id = Date.now();

    setToasts((prev) => [...prev, { id, message, isClosing: false }]);

    // 2.5초 후 닫힘 시작
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isClosing: true } : t)),
      );

      // exit 애니메이션 후 제거
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 350);
    }, 2500);
  }

  //운동 추가 toast
  function addToRoutine(exercise: Exercise) {
    const stored = localStorage.getItem("routineExercises");
    const parsed: Exercise[] = stored ? JSON.parse(stored) : [];

    const exists = parsed.some((e) => e.id === exercise.id);

    if (exists) {
      showToast(`${exercise.name}은(는) 이미 루틴에 있습니다.`);
      return;
    }

    localStorage.setItem(
      "routineExercises",
      JSON.stringify([...parsed, exercise]),
    );

    showToast(`${exercise.name}을(를) 루틴에 추가했습니다.`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* ===============================
          Splash Screen
      ================================ */}
      <header className="border-b border-purple-200/50 dark:border-purple-800/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => router.push("/")}
            >
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Dumbbell className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  My Workout Routine
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-transform duration-[1000ms] ease-in-out ${
          !loading ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="flex flex-col items-center gap-1">
          <span
            className="w-6 h-2 bg-slate-900 rounded opacity-0 animate-stack"
            style={{ animationDelay: "600ms" }}
          />
          <span
            className="w-8 h-2 bg-slate-900 rounded opacity-0 animate-stack"
            style={{ animationDelay: "300ms" }}
          />
          <span
            className="w-10 h-2 bg-slate-900 rounded opacity-0 animate-stack"
            style={{ animationDelay: "0ms" }}
          />
          <span className="w-12 h-2 bg-slate-900 rounded" />
        </div>
        <p className="mt-4 text-xl font-black text-blue-600 animate-pulse">
          원판 정리 하는 중...
        </p>
      </div>

      {/* ===============================
          Main Content
      ================================ */}
      <div
        className={`max-w-6xl mx-auto p-6 transition-opacity duration-1000 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Header */}
        <header className="text-center mb-10 mt-10">
          <h1 className="text-4xl font-black mb-6">운동 라이브러리</h1>

          {/* 검색 */}
          <div className="max-w-md mx-auto mb-6">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="운동 이름 검색"
              className="w-full px-5 py-4 rounded-2xl border shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 필터 버튼 */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="px-8 py-3 bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-bold rounded-2xl shadow-lg"
          >
            {selectedMuscle
              ? `필터: ${MUSCLE_LABEL[selectedMuscle]}`
              : "운동 부위 선택하기"}
          </button>
        </header>

        {/* ===============================
            Filter Modal
        ================================ */}
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsFilterModalOpen(false)}
            />
            <div className="relative bg-white max-w-md w-full rounded-3xl p-6">
              <h2 className="text-2xl font-black mb-6">부위별 필터</h2>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {Object.entries(MUSCLE_LABEL).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() =>
                      setSelectedMuscle(selectedMuscle === key ? null : key)
                    }
                    className={`py-3 rounded-xl font-bold border ${
                      selectedMuscle === key
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="w-full py-3 bg-gradient-to-br from-blue-400 to-indigo-500 text-white rounded-xl font-bold"
              >
                적용
              </button>
            </div>
          </div>
        )}

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
                  <h3 className="text-2xl font-black mb-4">Video</h3>

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
              className="relative group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex gap-6 hover:scale-105 duration-300 dark:bg-gray-800 cursor-pointer"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 모달 열림 방지
                  addToRoutine(ex);
                }}
                className="absolute top-4 right-4 size-11 rounded-xl
                   bg-white text-black border flex items-center justify-center
                   hover:bg-gray-100"
              >
                <Plus className="size-5" />
              </button>

              {/* 이미지 */}
              <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
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

              {/* 내용 */}
              <div className="flex-1">
                <div className="flex gap-2 flex-wrap mb-2">
                  {ex.muscles.map((m, idx) => (
                    <span
                      key={`${m}-${idx}`}
                      className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-tighter"
                    >
                      {MUSCLE_LABEL[m] ?? m}
                    </span>
                  ))}
                </div>

                <h2 className="text-xl font-bold mb-1 group-hover:text-blue-600 transition-colors">
                  {ex.name}
                </h2>

                <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                  {ex.description ||
                    "해당 운동에 대한 상세 설명이 준비 중입니다."}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ===============================
    Toast Stack
================================ */}
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 items-end">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`
        flex items-center gap-4
        bg-white shadow-2xl rounded-2xl
        px-6 py-4 border
        min-w-[280px]
        transition-all duration-300
        ${toast.isClosing ? "animate-slideOut" : "animate-slideIn"}
      `}
            >
              <div className="flex items-center justify-center size-5 rounded-full bg-black text-white">
                <Check className="size-3" />
              </div>

              <p className="text-sm font-semibold whitespace-nowrap">
                {toast.message}
              </p>

              <button
                onClick={() => router.push("/create")}
                className="ml-4 px-4 py-2 bg-black text-white text-xs rounded-lg hover:opacity-80 transition"
              >
                루틴 만들기로 이동
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
