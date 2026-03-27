"use client";

import React, { useEffect, useState } from "react";
import { Plus, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import ExerciseCard from "../../components/ExerciseCard";
import ToastItem from "../../components/ToastItem";

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

export default function WorkoutClient({ initialExercises }) {
  const [exercises, setExercises] = useState(initialExercises);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = React.useRef<HTMLDivElement | null>(null);
  const router = useRouter();
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
      if (!hasMore || loadingMore) return;

      setLoadingMore(true);

      try {
        const res = await fetch(
          `https://wger.de/api/v2/exerciseinfo/?language=2&limit=10&offset=${page * 10}`,
        );

        const data = await res.json();

        /* ===============================
    Data Fetch 내 수정 구간
================================ */
        const mapped: Exercise[] = data.results.map((item: any) => {
          // 1. 이미지 URL에 기본 도메인 결합
          const imageList =
            item.images && item.images.length > 0
              ? item.images.map((i: any) =>
                  i.image.startsWith("http")
                    ? i.image
                    : `https://wger.de${i.image}`,
                )
              : [];

          return {
            id: item.id,
            name:
              item.translations?.find((t: any) => t.language === 2)?.name ??
              item.name ??
              "Unknown", // 번역이 없을 경우 기본 name 사용
            description:
              item.translations
                ?.find((t: any) => t.language === 2)
                ?.description?.replace(/<[^>]*>?/gm, "")
                .replace(/&nbsp;/g, " ")
                .trim() ?? "",
            images: imageList,
            muscles:
              item.muscles?.map((m: any) => m.name_en).filter(Boolean) ?? [],
          };
        });

        setExercises((prev) => {
          const newItems = mapped.filter(
            (newEx) => !prev.some((ex) => ex.id === newEx.id),
          );
          return [...prev, ...newItems];
        });

        // 더 이상 데이터 없으면 멈춤
        if (!data.next) {
          setHasMore(false);
        }
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }

    fetchWorkouts();
  }, [page]);

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
  useEffect(() => {
    if (!observerRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 },
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [hasMore]);
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

  const handleSelect = React.useCallback((ex) => {
    setSelectedExercise(ex);
  }, []);

  const handleAdd = React.useCallback((ex) => {
    addToRoutine(ex);
  }, []);

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
      <Header title="라이브러리" />

      {/* ===============================
          Main Content
      ================================ */}
      <div
        className={`max-w-6xl mx-auto p-6 transition-opacity duration-1000 ${
          loading ? "opacity-40" : "opacity-100"
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
            className="px-8 py-3 bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-bold rounded-2xl shadow-lg
            hover:from-blue-300 hover:to-indigo-400"
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
                    className={`py-3 rounded-xl font-bold border hover:bg-gray-100 ${
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
            <ExerciseCard
              key={ex.id}
              ex={ex}
              onSelect={handleSelect}
              onAdd={handleAdd}
            />
          ))}
        </div>
        {hasMore && (
          <div
            ref={observerRef}
            className="h-20 flex items-center justify-center text-slate-400"
          >
            {loadingMore ? "불러오는 중..." : "스크롤하여 더 보기"}
          </div>
        )}

        {/* ===============================
    Toast Stack
================================ */}
        <div>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              message={toast.message}
              isVisible={!toast.isClosing}
              onMove={() => router.push("/create")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
