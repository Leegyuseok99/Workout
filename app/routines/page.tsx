"use client";

import { Dumbbell, ChevronLeft, Trash2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
     삭제
  ================================ */
  function deleteRoutine(id: string) {
    const updated = routines.filter((r) => r.id !== id);
    setRoutines(updated);
    localStorage.setItem("savedRoutines", JSON.stringify(updated));
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 px-4 pb-20">
      {/* ===============================
          Header
      ================================ */}
      <header className="flex items-center gap-3 py-4 mb-8">
        <button onClick={() => router.back()}>
          <ChevronLeft className="size-6" />
        </button>

        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow">
            <Dumbbell className="size-6" />
          </div>
          <h1 className="text-lg font-bold text-purple-600">내 루틴</h1>
        </div>
      </header>

      {/* ===============================
          Empty 상태
      ================================ */}
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
        /* ===============================
           루틴 리스트
        ================================ */
        <div className="grid md:grid-cols-2 gap-6">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              {/* 제목 */}
              <h2 className="text-lg font-bold mb-1">{routine.name}</h2>

              <p className="text-sm text-gray-500 mb-4">
                {routine.exercises.length}개의 운동
              </p>

              {/* 운동 리스트 */}
              <ul className="space-y-1 text-sm text-gray-600 mb-5">
                {routine.exercises.map((ex) => (
                  <li key={ex.id}>
                    • {ex.name} ({ex.sets} x {ex.reps})
                  </li>
                ))}
              </ul>

              {/* 버튼 영역 */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => startRoutine(routine)}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-medium hover:opacity-90 transition"
                >
                  <Play className="size-4" />
                  시작하기
                </button>

                <button
                  onClick={() => deleteRoutine(routine.id)}
                  className="p-3 rounded-xl border text-red-500 hover:bg-red-50 transition"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
