import React from "react";
import { Plus } from "lucide-react";

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

interface Props {
  ex: Exercise;
  onSelect: (ex: Exercise) => void;
  onAdd: (ex: Exercise) => void;
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

/* ===============================
   Component
================================ */
const ExerciseCard = React.memo(function ExerciseCard({
  ex,
  onSelect,
  onAdd,
}: Props) {
  return (
    <div
      onClick={() => onSelect(ex)}
      className="relative group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex gap-6 hover:scale-105 duration-300 dark:bg-gray-800 cursor-pointer"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdd(ex);
        }}
        className="absolute top-4 right-4 size-11 rounded-xl
        bg-white text-black border flex items-center justify-center
        hover:bg-gray-100"
      >
        <Plus className="size-5" />
      </button>

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
          {ex.description || "해당 운동에 대한 상세 설명이 준비 중입니다."}
        </p>
      </div>
    </div>
  );
});

export default ExerciseCard;
