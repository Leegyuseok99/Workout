"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Check,
} from "lucide-react";
import Header from "../../../components/Header";
import ToastItem from "../../../components/ToastItem";
import { useRef } from "react";

interface RoutineExercise {
  id: number;
  name: string;
  sets: number;
  reps: number[];
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
  const [isRoutineFinished, setIsRoutineFinished] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });

  const [isToastMounted, setIsToastMounted] = useState(false);

  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const restStartTimeRef = useRef<number | null>(null);

  const [elapsedTime, setElapsedTime] = useState(0); // 전체 운동 시간 (초)
  const [isWorkoutRunning, setIsWorkoutRunning] = useState(true);
  const workoutIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ===============================
     루틴 불러오기
  ================================ */
  useEffect(() => {
    const stored = localStorage.getItem("activeWorkout");

    if (!stored) {
      router.push("/routines");
      return;
    }

    const parsed = JSON.parse(stored);

    setRoutine(parsed.routine);
    setCurrentExerciseIndex(parsed.currentExerciseIndex);
    setCompletedSets(parsed.completedSets);
    setElapsedTime(parsed.elapsedTime);
  }, []);

  /* ===============================
     휴식 타이머
  ================================ */
  useEffect(() => {
    if (!showRest || isPaused || restTime <= 0) return;

    restIntervalRef.current = setInterval(() => {
      setRestTime((prev) => prev - 1);
    }, 1000);

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    };
  }, [showRest, isPaused, restTime]);

  useEffect(() => {
    if (toast.show) {
      setIsToastMounted(true);
    } else {
      const timer = setTimeout(() => {
        setIsToastMounted(false);
      }, 300); // slideOut duration과 동일하게

      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // 백그라운드 알림
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        if (!restStartTimeRef.current) return;

        const now = Date.now();
        const elapsed = Math.floor((now - restStartTimeRef.current) / 1000);

        if (elapsed >= initialRestTime) {
          setRestTime(0);
          notifyRestFinished();
          setShowRest(false);
        } else {
          setRestTime(initialRestTime - elapsed);
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [initialRestTime]);

  /* ===============================
   전체 운동 타이머
================================ */
  useEffect(() => {
    if (!isWorkoutRunning) return;

    workoutIntervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (workoutIntervalRef.current) {
        clearInterval(workoutIntervalRef.current);
        workoutIntervalRef.current = null;
      }
    };
  }, [isWorkoutRunning]);

  useEffect(() => {
    if (restTime === 0 && showRest) {
      notifyRestFinished();

      setShowRest(false);
      setIsPaused(false);
      showToast("휴식이 종료되었습니다! 다음 세트를 시작하세요 💪");
    }
  }, [restTime, showRest]);

  useEffect(() => {
    if (!routine) return;

    const activeState = {
      routine,
      currentExerciseIndex,
      completedSets,
      elapsedTime,
      startedAt: Date.now(),
    };

    localStorage.setItem("activeWorkout", JSON.stringify(activeState));
  }, [routine, currentExerciseIndex, completedSets, elapsedTime]);

  useEffect(() => {
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
      if (workoutIntervalRef.current) clearInterval(workoutIntervalRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const currentExercise = useMemo(() => {
    if (!routine) return null;
    return routine.exercises[currentExerciseIndex];
  }, [routine, currentExerciseIndex]);

  /* ===============================
     전체 진행도 계산
  ================================ */
  const totalSets = useMemo(() => {
    if (!routine) return 0;
    return routine.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  }, [routine]);

  const totalCompleted = useMemo(() => {
    return completedSets.reduce((sum, value) => sum + value, 0);
  }, [completedSets]);

  const progressPercent = useMemo(() => {
    return totalSets === 0 ? 0 : (totalCompleted / totalSets) * 100;
  }, [totalCompleted, totalSets]);

  const restProgressPercent = useMemo(() => {
    if (initialRestTime <= 0) return 0;
    return Math.max(Math.min((restTime / initialRestTime) * 100, 100), 0);
  }, [restTime, initialRestTime]);

  if (!routine || !currentExercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        루틴 불러오는 중...
      </div>
    );
  }
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
    setInitialRestTime(currentExercise.rest);
    setIsPaused(false);
  }
  /* ===============================
     세트 수정
  ================================ */
  function addSet() {
    if (!routine) return;

    const updatedRoutine: SavedRoutine = {
      ...routine,
      exercises: routine.exercises.map((ex, idx) => {
        if (idx !== currentExerciseIndex) return ex;

        const newReps = [...ex.reps, ex.reps[ex.reps.length - 1] || 10];

        return {
          ...ex,
          sets: ex.sets + 1,
          reps: newReps,
        };
      }),
    };

    // completedSets도 같이 동기화
    const newCompletedSets = [...completedSets];
    newCompletedSets[currentExerciseIndex] = Math.min(
      newCompletedSets[currentExerciseIndex],
      updatedRoutine.exercises[currentExerciseIndex].sets,
    );

    setRoutine(updatedRoutine);
    setCompletedSets(newCompletedSets);

    localStorage.setItem("activeWorkout", JSON.stringify(updatedRoutine));

    showToast("세트가 추가되었습니다 💪");
  }

  function removeSet() {
    if (!routine) return;

    const current = routine.exercises[currentExerciseIndex];
    if (current.sets <= 1) return;

    const updatedRoutine: SavedRoutine = {
      ...routine,
      exercises: routine.exercises.map((ex, idx) => {
        if (idx !== currentExerciseIndex) return ex;

        const newReps = ex.reps.slice(0, -1);

        return {
          ...ex,
          sets: ex.sets - 1,
          reps: newReps,
        };
      }),
    };

    const newCompletedSets = [...completedSets];
    newCompletedSets[currentExerciseIndex] = Math.min(
      newCompletedSets[currentExerciseIndex],
      updatedRoutine.exercises[currentExerciseIndex].sets,
    );

    setRoutine(updatedRoutine);
    setCompletedSets(newCompletedSets);

    saveActiveWorkout(updatedRoutine);
    showToast("세트가 삭제되었습니다");
  }

  /* ===============================
     반복 횟수 수정
  ================================ */
  function updateReps(setIndex: number, delta: number) {
    if (!routine) return;

    const updatedRoutine = {
      ...routine,
      exercises: routine.exercises.map((ex, idx) => {
        if (idx !== currentExerciseIndex) return ex;

        const newReps = [...ex.reps];
        newReps[setIndex] = Math.max(1, newReps[setIndex] + delta);

        return {
          ...ex,
          reps: newReps,
        };
      }),
    };

    setRoutine(updatedRoutine);

    // 🔥 localStorage 자동 저장
    saveActiveWorkout(updatedRoutine);
  }

  const workoutHours = Math.floor(elapsedTime / 3600);
  const workoutMinutes = Math.floor((elapsedTime % 3600) / 60);
  const workoutSeconds = elapsedTime % 60;

  function saveActiveWorkout(updatedRoutine: SavedRoutine) {
    const activeState = {
      routine: updatedRoutine,
      currentExerciseIndex,
      completedSets,
      elapsedTime,
      startedAt: Date.now(),
    };

    localStorage.setItem("activeWorkout", JSON.stringify(activeState));
  }
  /* ===============================
     운동 완료 데이터 저장 
  ================================ */
  const saveWorkoutDate = () => {
    const today = new Date().toISOString().split("T")[0];

    const saved = localStorage.getItem("workout-history");

    let history = saved ? JSON.parse(saved) : [];

    if (!history.includes(today)) {
      history.push(today);
    }

    localStorage.setItem("workout-history", JSON.stringify(history));
  };
  function saveWorkoutHistory(routine: SavedRoutine) {
    const today = new Date().toLocaleDateString("sv-SE");

    const stored = localStorage.getItem("workout-history");
    const history = stored ? JSON.parse(stored) : {};

    if (!history[today]) {
      history[today] = [];
    }

    history[today].push({
      routineName: routine.name,
      completedAt: new Date().toISOString(),

      exercises: routine.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets,
      })),
    });

    localStorage.setItem("workout-history", JSON.stringify(history));
  }

  if (isRoutineFinished && routine) {
    const totalSets = routine.exercises.reduce((sum, ex) => sum + ex.sets, 0);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-lg w-full text-center space-y-6">
          <div className="text-6xl">🏆</div>

          <h2 className="text-3xl font-bold">운동 완료!</h2>

          <div className="text-gray-500 space-y-1">
            <p className="text-lg font-semibold mt-2 text-black">
              총 운동 시간 : {workoutHours > 0 && `${workoutHours}시간 `}
              {workoutMinutes}분 {workoutSeconds}초
            </p>
            <p>{routine.name} 루틴을 완료했습니다</p>
            <p>총 {totalSets}세트를 완료했습니다</p>
          </div>

          <div className="space-y-3 mt-6">
            {routine.exercises.map((ex) => (
              <div
                key={ex.id}
                className="flex justify-between bg-gray-100 px-4 py-3 rounded-xl"
              >
                <span>{ex.name}</span>
                <span>
                  {ex.sets}/{ex.sets} 세트
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("activeWorkout");
              setCompletedSets([]);
              setCurrentExerciseIndex(0);
              router.push("/routines");
              saveWorkoutDate();
            }}
            className="mt-6 bg-black text-white px-6 py-3 rounded-xl hover:opacity-90"
          >
            완료
          </button>
        </div>
      </div>
    );
  }
  /* ===============================
     toast 창 
  ================================ */
  function showToast(message: string) {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setIsToastMounted(true);

    requestAnimationFrame(() => {
      setToast({ show: true, message });
    });

    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));

      setTimeout(() => {
        setIsToastMounted(false);
      }, 300);
    }, 2500);
  }

  /* ===============================
     세트 완료 처리
  ================================ */
  function completeSet() {
    const newCompleted = [...completedSets];

    if (newCompleted[currentExerciseIndex] >= currentExercise.sets) return;

    newCompleted[currentExerciseIndex] += 1;
    setCompletedSets(newCompleted);

    const isLastSet =
      newCompleted[currentExerciseIndex] === currentExercise.sets;

    const isLastExercise =
      currentExerciseIndex === routine.exercises.length - 1;

    //  마지막 세트
    if (isLastSet) {
      if (isLastExercise) {
        setTimeout(() => {
          setIsWorkoutRunning(false);

          // ✅ 운동 기록 저장 추가
          saveWorkoutHistory(routine);

          setIsRoutineFinished(true);
          showToast("🎉 루틴이 모두 완료되었습니다!");
        }, 500);
        return;
      }

      // 다음 운동으로 자동 이동
      setTimeout(() => {
        setCurrentExerciseIndex((prev) => prev + 1);
        setShowRest(true);
        setRestTime(currentExercise.rest);

        restStartTimeRef.current = Date.now();
      }, 1000);

      return;
    }

    // 일반 세트 완료 → 휴식 시작
    setRestTime(currentExercise.rest);
    setInitialRestTime(currentExercise.rest);
    setShowRest(true);

    restStartTimeRef.current = Date.now();

    showToast("세트가 완료 되었습니다!");
  }

  function sendRestNotification() {
    if (typeof window === "undefined") return;

    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      const notification = new Notification("휴식 종료!", {
        body: "다음 세트를 시작하세요 💪",
        icon: "/icons/icon-192.png",
        tag: "rest-finish",
      });

      //  클릭 시 앱으로 복귀
      notification.onclick = () => {
        window.focus();
      };
    }
  }
  /* ===============================
      휴식완료 이벤트
  ================================ */
  function notifyRestFinished() {
    // 모바일 진동 (지원 브라우저만 동작)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]); // 진동 → 멈춤 → 진동
    }

    //  소리 알림
    try {
      const audio = new Audio("/rest-finish.wav");
      audio.volume = 1;
      audio.play();
    } catch (e) {
      console.log("Audio play blocked:", e);
    }

    sendRestNotification();
  }
  /* ===============================
     운동 이동
  ================================ */
  function skipRest() {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }

    setShowRest(false);
    setRestTime(0);
    showToast("휴식 시간을 건너뛰었습니다. 다음 세트를 준비하세요!");
  }
  function nextExercise() {
    if (currentExerciseIndex < routine.exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
    }
    setShowRest(false);
    setRestTime(0);
    showToast("다음 운동으로 이동했습니다!");
  }

  function prevExercise() {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
    }
    setShowRest(false);
    setRestTime(0);
    showToast("이전 운동으로 이동했습니다!");
  }

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
              <p className="text-2xl font-bold">
                {currentExercise.reps[completedSets[currentExerciseIndex] || 0]}
              </p>
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

            <div className="flex flex-wrap justify-evenly gap-3">
              {Array.from({ length: currentExercise.sets }).map((_, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${
                    i < completedSets[currentExerciseIndex]
                      ? "border-green-300 bg-green-50"
                      : "bg-gray-100"
                  }`}
                >
                  {i < completedSets[currentExerciseIndex] ? (
                    <CheckCircle2 className="text-green-500" />
                  ) : (
                    <Circle />
                  )}

                  <span>세트 {i + 1}</span>

                  <button
                    onClick={() => updateReps(i, -1)}
                    disabled={i < completedSets[currentExerciseIndex]}
                    className="px-2 border rounded hover:bg-gray-200 disabled:opacity-30"
                  >
                    -
                  </button>

                  <span className="font-semibold">
                    {currentExercise.reps[i]}회
                  </span>

                  <button
                    onClick={() => updateReps(i, 1)}
                    disabled={i < completedSets[currentExerciseIndex]}
                    className="px-2 border rounded hover:bg-gray-200 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={removeSet}
                className="flex-1 py-2 border rounded-xl hover:bg-gray-100"
              >
                세트 -
              </button>

              <button
                onClick={addSet}
                className="flex-1 py-2 bg-black text-white rounded-xl hover:opacity-90"
              >
                세트 +
              </button>
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
                      {ex.reps.join(" / ")}
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
      {/* Toast */}
      {isToastMounted && (
        <ToastItem message={toast.message} isVisible={toast.show} />
      )}
      {/* 전체 운동 타이머 Sticky */}
      {!isRoutineFinished && (
        <div className="fixed bottom-0 left-0 w-full bg-white py-3 text-center shadow-lg z-40 opacity-80">
          <p className="font-semibold text-sm tracking-wide">운동 시간</p>
          <p className="text-lg font-bold">
            {workoutHours > 0 && `${workoutHours}:`}
            {workoutMinutes.toString().padStart(2, "0")}:
            {workoutSeconds.toString().padStart(2, "0")}
          </p>
        </div>
      )}
    </div>
  );
}
