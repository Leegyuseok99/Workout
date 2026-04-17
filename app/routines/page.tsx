"use client";

import { Dumbbell, Trash2, Play, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../components/Header";
import ConfirmModal from "@/components/ConfirmModal";

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

export default function RoutinesPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<SavedRoutine[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SavedRoutine | null>(null);
  const [open, setOpen] = useState(false);
  const getMaxReps = (reps: number | number[]) =>
    Array.isArray(reps) ? Math.max(...reps) : reps;

  /* ===============================
     localStorage 불러오기
  ================================ */
  useEffect(() => {
    const stored = localStorage.getItem("savedRoutines");
    if (stored) {
      setRoutines(JSON.parse(stored));
    }
  }, []);

  /* ===============================
     실제 삭제 실행
  ================================ */
  const handleDelete = () => {
    if (!deleteTarget) return;

    const updated = routines.filter((r) => r.id !== deleteTarget.id);
    setRoutines(updated);
    localStorage.setItem("savedRoutines", JSON.stringify(updated));

    const active = localStorage.getItem("activeWorkout");
    if (active) {
      const parsed = JSON.parse(active);
      if (parsed.routine.id === deleteTarget.id) {
        localStorage.removeItem("activeWorkout");
      }
    }

    setDeleteTarget(null);
    setOpen(false); // 추가
  };

  /* ===============================
     시작하기
  ================================ */
  function startRoutine(routine: SavedRoutine) {
    const normalizedExercises = routine.exercises.map((ex) => ({
      ...ex,
      reps: Array.isArray(ex.reps)
        ? ex.reps
        : Array.from({ length: ex.sets }, () => ex.reps),
    }));

    const activeState = {
      routine: {
        ...routine,
        exercises: normalizedExercises,
      },
      currentExerciseIndex: 0,
      completedSets: normalizedExercises.map(() => 0),
      elapsedTime: 0,
      startedAt: Date.now(),
    };

    localStorage.setItem("activeWorkout", JSON.stringify(activeState));
    router.push("/routines/active");
  }
  const isEmpty = routines.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <Header title="내 루틴" />

      <main className="container mx-auto py-8 px-10">
        {isEmpty ? (
          <div className="border-2 border-dashed border-gray-300 rounded-2xl py-20 px-4 text-center bg-white/40">
            <div className="flex justify-center mb-6">
              <div className="size-16 rounded-full bg-gray-200 flex items-center justify-center">
                <Dumbbell className="size-8 text-gray-500" />
              </div>
            </div>

            <h2 className="font-bold text-lg mb-2">저장된 루틴이 없습니다</h2>
            <p className="text-sm text-gray-500">
              운동 루틴을 만들어 저장해보세요.
            </p>
            <div className="fixed bottom-10 right-10">
              <button
                onClick={() => router.push("/create")}
                className="p-3 rounded-3xl bg-black text-white border hover:opacity-50 transition"
              >
                <Plus className="size-7" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full"
              >
                <h2 className="text-lg font-bold mb-1">{routine.name}</h2>

                <p className="text-sm text-gray-500 mb-4">
                  {routine.exercises.length}개의 운동
                </p>

                <ul className="space-y-1 text-sm text-gray-600 mb-5 min-h-[100px]">
                  {routine.exercises.slice(0, 3).map((ex) => (
                    <li key={ex.id}>
                      • {ex.name} ({ex.sets} x {getMaxReps(ex.reps)})
                    </li>
                  ))}

                  {routine.exercises.length > 3 && (
                    <li className="font-medium">
                      +{routine.exercises.length - 3}개 더보기
                    </li>
                  )}
                </ul>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startRoutine(routine)}
                    className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-2 rounded-xl font-medium hover:opacity-80 transition"
                  >
                    <Play className="size-4" />
                    시작하기
                  </button>

                  <button
                    onClick={() => {
                      setDeleteTarget(routine);
                      setOpen(true);
                    }}
                    className="p-3 rounded-xl border text-red-500 hover:bg-red-50 transition"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="group bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border-2 border-dashed border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer h-full min-h-[250px]">
              <button
                onClick={() => router.push("/create")}
                className="w-full h-full flex flex-col items-center justify-center gap-3"
              >
                <div className="size-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition">
                  <Plus className="size-6" />
                </div>

                <div className="text-center">
                  <p className="font-semibold text-gray-800">운동 추가</p>
                  <p className="text-xs text-gray-500 mt-1">
                    새로운 루틴을 만들어보세요
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ===============================
          삭제 확인 모달
      ================================ */}
      <ConfirmModal
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleDelete}
        title="루틴 삭제"
        description={
          deleteTarget
            ? `'${deleteTarget.name}' 루틴을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
            : ""
        }
      />
    </div>
  );
}
