import React from "react";
import { Check } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  isClosing: boolean;
}

interface Props {
  message: string;
  isVisible: boolean;
  onMove?: () => void;
}

const ToastItem = React.memo(function ToastItem({
  message,
  isVisible,
  onMove,
}: Props) {
  return (
    <div
      className={`fixed bottom-20 right-6 z-50
      flex flex-col md:flex-row md:items-center 
      gap-3 md:gap-4 bg-white shadow-2xl rounded-2xl
      px-6 py-4 border w-auto min-w-[280px]
      transition-all duration-300
      ${isVisible ? "animate-slideIn" : "animate-slideOut"}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-5 rounded-full bg-black text-white">
          <Check className="size-3" />
        </div>
        <p className="text-sm font-semibold break-words">{message}</p>
      </div>

      {onMove && (
        <button
          onClick={onMove}
          className="px-4 py-2 bg-black text-white text-xs rounded-lg"
        >
          루틴 만들기로 이동
        </button>
      )}
    </div>
  );
});

export default ToastItem;
