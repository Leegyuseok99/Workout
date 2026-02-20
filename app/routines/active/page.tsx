"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Pause,
  Play,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  Circle,
} from "lucide-react";
import Header from "../../../components/Header";
import { useRef } from "react";

interface RoutineExercise {
  id: number;
  name: string;
  sets: number;
  reps: number;
  rest: number;
}

interface SavedRoutine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
}

export default function ActiveRoutinePage() {
  const router = useRouter();

  const [routine, setRoutine] = useState<SavedRoutine | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<number[]>([]);
  const [showRest, setShowRest] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [initialRestTime, setInitialRestTime] = useState(0);

  const [toast, setToast] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ===============================
     루틴 불러오기
  ================================ */
  useEffect(() => {
    const stored = localStorage.getItem("activeRoutine");
    if (!stored) {
      router.push("/routines");
      return;
    }

    const parsed: SavedRoutine = JSON.parse(stored);
    setRoutine(parsed);
    setCompletedSets(Array(parsed.exercises.length).fill(0));
  }, []);

  /* ===============================
     휴식 타이머
  ================================ */
  useEffect(() => {
    if (!showRest || isPaused || restTime <= 0) return;

    intervalRef.current = setInterval(() => {
      setRestTime((prev) => prev - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [showRest, isPaused, restTime]);

  useEffect(() => {
    if (restTime === 0 && showRest) {
      setShowRest(false);
      setIsPaused(false);
    }
  }, [restTime, showRest]);

  const minutes = Math.floor(restTime / 60);
  const seconds = restTime % 60;

  /* ===============================
     휴식 타이머 조정
  ================================ */
  function pauseRest() {
    setIsPaused(true);
  }

  function resumeRest() {
    setIsPaused(false);
  }

  function addTime() {
    setRestTime((prev) => prev + 5);
    setInitialRestTime((prev) => prev + 5);
  }

  function subtractTime() {
    setRestTime((prev) => Math.max(prev - 5, 0));
    setInitialRestTime((prev) => Math.max(prev - 5, 1));
  }

  function addftTime() {
    setRestTime((prev) => prev + 15);
    setInitialRestTime((prev) => prev + 15);
  }

  function subtractftTime() {
    setRestTime((prev) => Math.max(prev - 15, 0));
    setInitialRestTime((prev) => Math.max(prev - 15, 1));
  }
  function resetRest() {
    setRestTime(currentExercise.rest);
    setIsPaused(false);
  }
  // 🔥 모든 Hook 아래에서 return 처리
  if (!routine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        루틴 불러오는 중...
      </div>
    );
  }

  const currentExercise = routine.exercises[currentExerciseIndex];
  /* ===============================
     세트 완료 처리
  ================================ */
  function completeSet() {
    const newCompleted = [...completedSets];

    if (newCompleted[currentExerciseIndex] >= currentExercise.sets) return;
    if (newCompleted[currentExerciseIndex] < currentExercise.sets) {
      setRestTime(currentExercise.rest);
      setInitialRestTime(currentExercise.rest);
      setShowRest(true);
    }
    newCompleted[currentExerciseIndex] += 1;
    setCompletedSets(newCompleted);

    // 토스트 표시
    setToast(true);
    setTimeout(() => setToast(false), 2000);

    // 모든 세트 완료 시 휴식 시작
    if (newCompleted[currentExerciseIndex] < currentExercise.sets) {
      setRestTime(currentExercise.rest);
      setShowRest(true);
    }
  }

  /* ===============================
     운동 이동
  ================================ */
  function skipRest() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowRest(false);
    setRestTime(0);
  }
  function nextExercise() {
    if (currentExerciseIndex < routine.exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
    }
    setShowRest(false);
    setRestTime(0);
  }

  function prevExercise() {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
    }
    setShowRest(false);
    setRestTime(0);
  }

  /* ===============================
     전체 진행도 계산
  ================================ */
  const totalSets = routine.exercises.reduce((sum, ex) => sum + ex.sets, 0);

  const totalCompleted = completedSets.reduce((sum, value) => sum + value, 0);

  const progressPercent = (totalCompleted / totalSets) * 100;

  const restProgressPercent =
    initialRestTime <= 0
      ? 0
      : Math.max(Math.min((restTime / initialRestTime) * 100, 100), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="루틴 진행" />

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* 상단 정보 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <button
            onClick={() => router.push("/routines")}
            className="flex items-center gap-2 text-sm mb-4"
          >
            <ChevronLeft className="size-4" />
            나가기
          </button>

          <h2 className="text-lg font-bold mb-2">{routine.name}</h2>

          <div className="h-2 bg-gray-200 rounded-full mb-2">
            <div
              className="h-2 bg-black rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-sm text-gray-500">
            전체 진행도: {totalCompleted}/{totalSets} 세트
          </p>
        </div>

        {/* 현재 운동 카드 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
          <h3 className="text-2xl font-bold">{currentExercise.name}</h3>

          {/* 운동 정보 */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-100 p-4 rounded-xl">
              <p className="text-2xl font-bold">{currentExercise.sets}</p>
              <p className="text-sm text-gray-500">세트</p>
            </div>

            <div className="bg-gray-100 p-4 rounded-xl">
              <p className="text-2xl font-bold">{currentExercise.reps}</p>
              <p className="text-sm text-gray-500">반복</p>
            </div>

            <div className="bg-gray-100 p-4 rounded-xl">
              <p className="text-2xl font-bold">{currentExercise.rest}초</p>
              <p className="text-sm text-gray-500">휴식</p>
            </div>
          </div>

          {/* 세트 진행 */}
          <div className="space-y-4">
            <p className="font-semibold">세트 진행</p>

            <div className="flex flex-wrap gap-3">
              {Array.from({ length: currentExercise.sets }).map((_, i) => (
                <div
                  key={i}
                  className={`flex px-4 py-2 rounded-xl border ${
                    i < completedSets[currentExerciseIndex]
                      ? "border-green-300 bg-green-50"
                      : "bg-gray-100"
                  }`}
                >
                  {i < completedSets[currentExerciseIndex] ? (
                    <CheckCircle2 className="me-2 text-green-500"></CheckCircle2>
                  ) : (
                    <Circle className="me-2"></Circle>
                  )}
                  세트 {i + 1}
                </div>
              ))}
            </div>

            {!showRest ? (
              <button
                onClick={completeSet}
                disabled={
                  completedSets[currentExerciseIndex] === currentExercise.sets
                }
                className="w-full bg-black text-white py-3 rounded-xl mt-4 hover:opacity-90 disabled:opacity-40"
              >
                세트 완료
              </button>
            ) : (
              <></>
            )}
          </div>
        </div>
        {/*  휴식 타이머 UI */}
        {showRest && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center space-y-6">
            <p className="text-gray-500">휴식 시간</p>

            <p className="text-5xl font-bold">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </p>

            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-black rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(restProgressPercent, 100)}%`,
                }}
              />
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={subtractftTime}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                <Minus></Minus>
              </button>
              <button
                onClick={subtractTime}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                -5초
              </button>

              {isPaused ? (
                <button
                  onClick={resumeRest}
                  className="px-4 py-2 border rounded-xl hover:bg-gray-100"
                >
                  <Play></Play>
                </button>
              ) : (
                <button
                  onClick={pauseRest}
                  className="px-4 py-2 border rounded-xl hover:bg-gray-100"
                >
                  <Pause></Pause>
                </button>
              )}

              <button
                onClick={resetRest}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                <RotateCcw></RotateCcw>
              </button>

              <button
                onClick={addTime}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                +5초
              </button>
              <button
                onClick={addftTime}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                <Plus></Plus>
              </button>
            </div>

            <button
              onClick={skipRest}
              className="w-full bg-black text-white py-3 rounded-xl mt-4 hover:opacity-90"
            >
              건너뛰기
            </button>
          </div>
        )}
        {/* 이전 / 다음 */}
        <div className="flex gap-4">
          <button
            onClick={prevExercise}
            disabled={currentExerciseIndex === 0}
            className="flex-1 py-3 rounded-xl border hover:bg-gray-100 disabled:opacity-40"
          >
            이전 운동
          </button>

          <button
            onClick={nextExercise}
            disabled={currentExerciseIndex === routine.exercises.length - 1}
            className="flex-1 py-3 rounded-xl border hover:bg-gray-100 disabled:opacity-40"
          >
            다음 운동
          </button>
        </div>

        {/* 운동 목록 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="font-semibold mb-4">운동 목록</p>

          <div className="space-y-3">
            {routine.exercises.map((ex, index) => (
              <div
                key={ex.id}
                onClick={() => setCurrentExerciseIndex(index)}
                className={`p-4 rounded-xl border cursor-pointer flex justify-between ${
                  index === currentExerciseIndex
                    ? "border-black bg-gray-200"
                    : ""
                }
                ${completedSets[index] === ex.sets ? "border-green-300 bg-green-50" : ""}
                `}
              >
                <div className="flex items-center">
                  {completedSets[index] === ex.sets ? (
                    <CheckCircle2 className="me-3 text-green-500"></CheckCircle2>
                  ) : (
                    <Circle className="me-3"></Circle>
                  )}
                  <div>
                    <p className="font-medium">{ex.name}</p>
                    <p className="text-sm text-gray-500">
                      {ex.sets} x {ex.reps}
                    </p>
                  </div>
                </div>
                <div className="bg-black text-white text-sm px-3 max-h-[30px] py-1 rounded-xl">
                  {completedSets[index]}/{ex.sets}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
