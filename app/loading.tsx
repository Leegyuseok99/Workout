export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-transform duration-700 ease-in-out">
      <div className="flex flex-col items-center gap-1">
        <span
          className="w-6 h-2 bg-slate-900 rounded opacity-0 animate-stack"
          style={{ animationDelay: "600ms" }}
        />
        <span
          className="w-8 h-2 bg-slate-900 rounded opacity-0 animate-stack"
          style={{ animationDelay: "300ms" }}
        />
        <span
          className="w-10 h-2 bg-slate-900 rounded opacity-0 animate-stack"
          style={{ animationDelay: "0ms" }}
        />
        <span className="w-12 h-2 bg-slate-900 rounded" />
      </div>

      <p className="mt-4 text-xl font-black text-blue-600 animate-pulse">
        원판 정리 하는 중...
      </p>
    </div>
  );
}
