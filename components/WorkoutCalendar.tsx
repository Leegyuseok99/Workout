"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "./Header";
import { CalendarDays, CheckCircle, Dumbbell, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import * as Dialog from "@radix-ui/react-dialog"; // 모달 제어 라이브러리
import { ko } from "date-fns/locale";

export default function WorkoutCalendar() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [history, setHistory] = useState<Record<string, any[]>>({});

  // 현재 달력에 보여지는 월 상태 추가
  const [currentViewMonth, setCurrentViewMonth] = useState<Date>(new Date());

  useEffect(() => {
    const savedHistory = localStorage.getItem("workout-history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 현재 보고 있는 월에 해당하는 운동 데이터만 필터링
  const monthlyData = useMemo(() => {
    const year = currentViewMonth.getFullYear();
    const month = currentViewMonth.getMonth();

    return Object.entries(history).filter(([dateStr]) => {
      const d = new Date(dateStr);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [history, currentViewMonth]);

  // 필터링된 데이터를 기반으로 통계 계산
  const monthlyWorkoutsCount = monthlyData.reduce(
    (sum, [_, routines]) => sum + routines.length,
    0,
  );

  const monthlySetsCount = monthlyData.reduce((sum, [_, routines]) => {
    return (
      sum +
      routines.reduce((rSum, routine) => {
        return (
          rSum +
          (routine.exercises?.reduce(
            (exSum: number, ex: any) => exSum + ex.sets,
            0,
          ) || 0)
        );
      }, 0)
    );
  }, 0);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("sv-SE");
  };
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  const completedDays = Object.keys(history).map((d) => new Date(d));

  const recentHistory = Object.entries(history)
    .flatMap(([date, items]) =>
      items.map((item) => ({
        date,
        ...item,
      })),
    )
    .sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1))
    .slice(0, 5);

  const selectedWorkouts = selectedDate ? history[selectedDate] || [] : [];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="운동 기록" />

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* ==============================
        통계 카드
        ============================== */}

        <div className="grid grid-cols-3 gap-6">
          <StatCard
            title={`${currentViewMonth.getMonth() + 1}월 총 운동`}
            icon={<CalendarDays className="size-6 text-white" />}
            value={monthlyWorkoutsCount}
            subtitle="회"
            color="from-blue-500 to-indigo-500"
          />

          <StatCard
            title={`${currentViewMonth.getMonth() + 1}월 총 세트`}
            icon={<CheckCircle className="size-6 text-white" />}
            value={monthlySetsCount}
            subtitle="세트"
            color="from-green-500 to-emerald-500"
          />

          <StatCard
            title="누적 운동 횟수" // 하나 정도는 전체 누적을 보여주는 것이 지표상 좋습니다.
            icon={<Dumbbell className="size-6 text-white" />}
            value={Object.values(history).flat().length}
            subtitle="회"
            color="from-purple-500 to-pink-500"
          />
        </div>

        {/* ==============================
        캘린더 카드
        ============================== */}

        <div className="bg-white rounded-3xl shadow-md p-8">
          <div className="flex items-center gap-2 mb-2 text-lg font-bold">
            <CalendarDays size={20} />
            운동 달력
          </div>

          <p className="text-gray-500 mb-6">
            완료된 날짜를 클릭하여 상세 정보를 확인하세요
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 flex justify-center">
            <div className="w-[360px]">
              <DayPicker
                mode="single"
                locale={ko}
                month={currentViewMonth}
                onMonthChange={setCurrentViewMonth}
                selected={selected}
                onSelect={(day) => {
                  if (!day) return;

                  const dateKey = formatDate(day);

                  setSelected(day);

                  // 운동한 날짜면 modal open
                  if (history[dateKey]) {
                    setSelectedDate(dateKey);
                    setModalOpen(true);
                  }
                }}
                modifiers={{
                  workout: completedDays,
                }}
                modifiersClassNames={{
                  workout: "bg-green-200 text-green-900 font-semibold",
                  selected: "!bg-gray-800 !text-white",
                }}
                classNames={{
                  day: "w-10 h-10 rounded-lg hover:bg-gray-200",
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded" />
              완료된 날짜
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" size={16} />총{" "}
              {monthlyWorkoutsCount}회 운동 완료
            </div>
          </div>
        </div>

        {/* ==============================
        최근 운동 기록
        ============================== */}

        <div className="bg-white rounded-3xl shadow-md p-8">
          <h2 className="text-xl font-bold mb-6">최근 운동 기록</h2>

          <div className="space-y-4">
            {recentHistory.map((item, index) => {
              const date = new Date(item.completedAt);

              return (
                <div
                  key={index}
                  className="flex justify-between items-center p-5 border rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <CheckCircle className="text-green-500" size={20} />
                    </div>

                    <div>
                      <p className="font-semibold">{item.routineName}</p>
                      <p className="text-sm text-gray-500">
                        {date.toLocaleString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}{" "}
                        완료
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">총 세트</p>
                    <p className="font-bold text-lg">
                      {item.exercises?.reduce(
                        (sum: number, ex: any) => sum + ex.sets,
                        0,
                      ) || 0}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {modalOpen && selectedDate && (
          <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
            <Dialog.Portal>
              {/* 배경 (Overlay) - 자동으로 스크롤 잠금 및 애니메이션 지원 */}
              <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

              {/* 콘텐츠 (Content) - 중앙 정렬 및 포커스 트래핑 자동 적용 */}
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-[500px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-xl duration-200 rounded-2xl max-h-[80vh] overflow-y-auto outline-none">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="flex text-lg font-bold items-center gap-2">
                    <CheckCircle className="text-green-500" size={20} />
                    운동 기록
                  </Dialog.Title>

                  <Dialog.Close asChild>
                    <button className="text-gray-400 hover:text-gray-700 outline-none">
                      <X size={20} />
                    </button>
                  </Dialog.Close>
                </div>

                <Dialog.Description className="sr-only">
                  선택한 날짜의 상세 운동 루틴 목록입니다.
                </Dialog.Description>

                {/* 루틴 목록 */}
                <div className="space-y-4">
                  {selectedWorkouts.map((routine, index) => {
                    const exercises = routine.exercises || [];

                    return (
                      <div
                        key={index}
                        className="border border-green-200 rounded-xl p-4 bg-green-50"
                      >
                        <div className="flex justify-between items-center">
                          <p className="font-semibold">{routine.routineName}</p>

                          <span className="text-sm bg-green-500 text-white px-2 py-1 rounded">
                            완료
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 mb-3">
                          {new Date(routine.completedAt).toLocaleTimeString(
                            "ko-KR",
                            options,
                          )}
                          에 완료
                        </p>

                        <p className="text-xs text-gray-500 mb-2">운동 목록</p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {exercises.map((ex: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm w-full"
                            >
                              <CheckCircle
                                size={14}
                                className="text-green-500 overflow-hidden text-ellipsis"
                              />

                              <p className="truncate flex-1">{ex.name}</p>

                              <span className="text-gray-400 text-xs">
                                {ex.sets} / {ex.sets} 세트
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="border my-6"></div>

                        <div className="flex justify-between">
                          <p className="text-xs text-gray-500">총 완료 세트</p>
                          <p className="font-bold text-green-500">
                            {exercises.reduce(
                              (sum: number, ex: any) => sum + ex.sets,
                              0,
                            )}{" "}
                            세트
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </div>
    </div>
  );
}

/* ==============================
통계 카드
============================== */

function StatCard({
  title,
  icon,
  value,
  subtitle,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  value: number;
  subtitle: string;
  color: string;
}) {
  return (
    <div
      className={`p-6 rounded-2xl text-white shadow-lg bg-gradient-to-r ${color}`}
    >
      <div className="flex justify-between">
        <div className="w-12 md:w-auto">
          <p className="text-xs opacity-80">{title}</p>
          <p className="text-3xl font-bold my-1">{value}</p>
          <p className="text-xs">{subtitle}</p>
        </div>
        <div className="hidden md:flex items-center">
          <div className="w-12 h-12 flex items-center justify-center bg-black/25 rounded-xl shadow-lg">
            <div className="text-2xl">{icon}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
