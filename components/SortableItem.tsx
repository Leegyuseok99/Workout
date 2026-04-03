"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
export default function SortableItem({
  ex,
  removeExercise,
  updateExercise,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: ex.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function InputBox({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
  }) {
    const [localValue, setLocalValue] = useState<string>(String(value));

    // 외부 값 변경 시 동기화
    useEffect(() => {
      setLocalValue(value === 0 ? "" : String(value));
    }, [value]);

    return (
      <div>
        <label className="block text-sm mb-1">{label}</label>

        <input
          type="text"
          value={localValue}
          onChange={(e) => {
            const v = e.target.value;

            if (!/^\d*$/.test(v)) return;

            setLocalValue(v);
          }}
          onBlur={() => {
            onChange(localValue === "" ? 0 : Number(localValue));
          }}
          className="w-full rounded-lg bg-gray-100 px-3 py-2 outline-none"
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-2xl p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* 드래그 핸들 */}
          <div
            {...attributes}
            {...listeners}
            className="touch-none cursor-grab text-gray-400"
          >
            <GripVertical className="size-5" />
          </div>

          <h3 className="font-semibold">{ex.name}</h3>
        </div>

        <button onClick={() => removeExercise(ex.id)} className="text-red-500">
          <Trash2 className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <InputBox
          label="Sets"
          value={ex.sets}
          onChange={(value) => updateExercise(ex.id, "sets", value)}
        />

        <InputBox
          label="Reps"
          value={ex.reps}
          onChange={(value) => updateExercise(ex.id, "reps", value)}
        />

        <InputBox
          label="Rest"
          value={ex.rest}
          onChange={(value) => updateExercise(ex.id, "rest", value)}
        />
      </div>
    </div>
  );
}
/* ===============================
   Input Component
================================ */
function InputBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg bg-gray-100 px-3 py-2 outline-none"
      />
    </div>
  );
}
