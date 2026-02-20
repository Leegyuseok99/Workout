"use client";

import { Dumbbell, Trash2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../components/Header";

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
  function confirmDelete() {
    if (!deleteTarget) return;

    const updated = routines.filter((r) => r.id !== deleteTarget.id);
    setRoutines(updated);
    localStorage.setItem("savedRoutines", JSON.stringify(updated));
    setDeleteTarget(null);
  }

  /* ===============================
     시작하기
  ================================ */
  function startRoutine(routine: SavedRoutine) {
    localStorage.setItem("activeRoutine", JSON.stringify(routine));
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
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
              >
                <h2 className="text-lg font-bold mb-1">{routine.name}</h2>

                <p className="text-sm text-gray-500 mb-4">
                  {routine.exercises.length}개의 운동
                </p>

                <ul className="space-y-1 text-sm text-gray-600 mb-5 min-h-[100px]">
                  {routine.exercises.slice(0, 3).map((ex) => (
                    <li key={ex.id}>
                      • {ex.name} ({ex.sets} x {ex.reps})
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
                    className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-2 rounded-xl font-medium hover:opacity-90 transition"
                  >
                    <Play className="size-4" />
                    시작하기
                  </button>

                  <button
                    onClick={() => setDeleteTarget(routine)}
                    className="p-3 rounded-xl border text-red-500 hover:bg-red-50 transition"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ===============================
          삭제 확인 모달
      ================================ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* 배경 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDeleteTarget(null)}
          />

          {/* 모달 */}
          <div className="relative bg-white w-[420px] rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold mb-3">루틴 삭제</h3>

            <p className="text-sm text-gray-600 mb-6">
              "{deleteTarget.name}" 루틴을 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200 transition"
              >
                취소
              </button>

              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
