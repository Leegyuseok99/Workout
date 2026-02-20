"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Dumbbell, ChevronLeft, Plus, Check } from "lucide-react";
import SortableItem from "../../components/SortableItem";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../components/Header";

interface Exercise {
  id: number;
  name: string;
  description: string;
}

interface RoutineExercise extends Exercise {
  sets: number;
  reps: number;
  rest: number;
}

interface SavedRoutine {
  id: number;
  name: string;
  exercises: RoutineExercise[];
}

export default function CreateRoutinePage() {
  const router = useRouter();

  const [routineName, setRoutineName] = useState("");
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });

  const sensors = useSensors(useSensor(PointerSensor));

  /* ===============================
     localStorage 불러오기
  ================================ */
  useEffect(() => {
    const stored = localStorage.getItem("routineExercises");
    if (stored) {
      const parsed: Exercise[] = JSON.parse(stored);

      const withDefaults: RoutineExercise[] = parsed.map((ex) => ({
        ...ex,
        sets: 3,
        reps: 10,
        rest: 60,
      }));

      setExercises(withDefaults);
    }
  }, []);

  /* ===============================
     값 수정
  ================================ */
  function updateExercise(
    id: number,
    field: "sets" | "reps" | "rest",
    value: number,
  ) {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex)),
    );
  }
  /* ===============================
     위치 조정
  ================================ */
  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setExercises((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  /* ===============================
     삭제
  ================================ */
  function removeExercise(id: number) {
    const updated = exercises.filter((ex) => ex.id !== id);
    setExercises(updated);
    localStorage.setItem("routineExercises", JSON.stringify(updated));
  }

  /* ===============================
     초기화
  ================================ */
  function resetRoutine() {
    setExercises([]);
    setRoutineName("");
    localStorage.removeItem("routineExercises");
  }

  /* ===============================
     루틴 저장
  ================================ */
  function saveRoutine() {
    if (!routineName.trim() || exercises.length === 0) return;

    const stored = localStorage.getItem("savedRoutines");
    const parsed: SavedRoutine[] = stored ? JSON.parse(stored) : [];

    const newRoutine: SavedRoutine = {
      id: Date.now(),
      name: routineName,
      exercises,
    };

    localStorage.setItem(
      "savedRoutines",
      JSON.stringify([...parsed, newRoutine]),
    );

    // 임시 운동 목록 제거
    localStorage.removeItem("routineExercises");

    // Toast 표시
    setToast({
      show: true,
      message: `"${routineName}" 루틴이 저장되었습니다!`,
    });

    setTimeout(() => {
      setToast({ show: false, message: "" });
      router.push("/"); // 필요하면 이동
    }, 2500);
  }

  const isEmpty = exercises.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <Header title="루틴 만들기" />
      <main className="container mx-auto py-8 px-10">
        {/* 루틴 이름 */}
        <section className="mb-8">
          <label className="block text-sm font-medium mb-2">루틴 이름</label>
          <input
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            placeholder="예: 상체 운동, 하체 데이"
            className="w-full rounded-xl bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400"
          />
        </section>

        {/* 운동 목록 */}
        {isEmpty ? (
          <section className="mb-10">
            <div className="border-2 border-dashed border-gray-300 rounded-2xl py-16 px-4 text-center bg-white/40">
              <div className="flex justify-center mb-4">
                <div className="size-14 rounded-full bg-gray-200 flex items-center justify-center">
                  <Plus className="size-7 text-gray-500" />
                </div>
              </div>

              <p className="font-bold mb-2">루틴에 운동이 없습니다</p>
              <p className="text-sm text-gray-500 mb-6">
                운동 라이브러리에서 운동을 추가하여 루틴을 만드세요.
              </p>

              <button
                onClick={() => router.push("/workout")}
                className="rounded-xl px-6 py-3 bg-white shadow border"
              >
                운동 라이브러리 보기
              </button>
            </div>
          </section>
        ) : (
          <section className="space-y-4 mb-10">
            <h2 className="font-bold">운동 목록 ({exercises.length})</h2>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={exercises.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {exercises.map((ex) => (
                    <SortableItem
                      key={ex.id}
                      ex={ex}
                      removeExercise={removeExercise}
                      updateExercise={updateExercise}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </section>
        )}

        {/* Bottom */}
        <section className="flex gap-3">
          <button
            onClick={saveRoutine}
            disabled={isEmpty || !routineName.trim()}
            className={`flex-1 py-4 rounded-xl text-white font-bold transition ${
              isEmpty || !routineName.trim()
                ? "bg-gradient-to-r from-purple-300 to-pink-300 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-pink-500"
            }`}
          >
            루틴 저장
          </button>

          <button
            onClick={resetRoutine}
            className="px-6 rounded-xl bg-white border text-gray-600"
          >
            초기화
          </button>
        </section>

        {/* ===============================
         Toast UI
      ================================ */}
        {toast.show && (
          <div className="fixed bottom-6 right-6 animate-slideIn bg-white shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-3 border">
            <div className="size-5 bg-black text-white rounded-full flex items-center justify-center">
              <Check className="size-3" />
            </div>
            <p className="text-sm font-semibold">{toast.message}</p>
            <button
              onClick={() => router.push("/routines")}
              className="ml-4 px-3 py-1 bg-black text-white text-xs rounded-lg"
            >
              내 루틴 보기
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
