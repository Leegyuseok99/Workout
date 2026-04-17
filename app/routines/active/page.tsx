"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
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
  Headphones,
  HeadphoneOff,
  Vibrate,
  VibrateOff,
  SquarePen,
} from "lucide-react";
import Header from "../../../components/Header";
import ToastItem from "../../../components/ToastItem";
import ConfirmModal from "@/components/ConfirmModal";

/* ===============================
    Types
================================ */
interface RoutineExerciseBase {
  id: number;
  name: string;
  sets: number;
  reps: number;
  rest: number;
  weight: number;
}

interface RoutineExercise {
  id: number;
  name: string;
  sets: number;
  reps: number[];
  rest: number;
  weight: number[];
}

interface SavedRoutine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
}

interface State {
  routine: SavedRoutine | null;
  currentExerciseIndex: number;
  completedSets: number[];
  showRest: boolean;
  restTime: number;
  isPaused: boolean;
  initialRestTime: number;
  isRoutineFinished: boolean;
  isSoundEnabled: boolean;
  isVibrationEnabled: boolean;
  toast: { show: boolean; message: string };
  isToastMounted: boolean;
  elapsedTime: number;
  isWorkoutRunning: boolean;
}

type Action =
  | { type: "INIT"; payload: any }
  | { type: "TICK_REST" }
  | { type: "TICK_WORKOUT" }
  | { type: "TOGGLE_PAUSE_REST" }
  | { type: "ADJUST_REST"; delta: number }
  | { type: "RESET_REST" }
  | { type: "SKIP_REST" }
  | { type: "SET_REST"; time: number }
  | { type: "COMPLETE_SET"; nextIndex: number; isAllFinished: boolean }
  | { type: "ADD_SET"; newRoutine: SavedRoutine; newCompleted: number[] }
  | { type: "REMOVE_SET"; newRoutine: SavedRoutine; newCompleted: number[] }
  | { type: "UPDATE_REPS"; newRoutine: SavedRoutine }
  | { type: "UPDATE_WEIGHT"; newRoutine: SavedRoutine }
  | { type: "CHANGE_EXERCISE"; index: number }
  | { type: "TOGGLE_SOUND" }
  | { type: "TOGGLE_VIBRATION" }
  | { type: "SHOW_TOAST"; message: string }
  | { type: "HIDE_TOAST" }
  | { type: "MOUNT_TOAST"; mounted: boolean }
  | { type: "FINISH_WORKOUT" };

/* ===============================
    Reducer
================================ */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INIT":
      return { ...state, ...action.payload, isWorkoutRunning: true };
    case "TICK_REST":
      return { ...state, restTime: Math.max(state.restTime - 1, 0) };
    case "TICK_WORKOUT":
      return { ...state, elapsedTime: state.elapsedTime + 1 };
    case "TOGGLE_PAUSE_REST":
      return { ...state, isPaused: !state.isPaused };
    case "ADJUST_REST":
      const newVal = Math.max(state.restTime + action.delta, 0);
      return {
        ...state,
        restTime: newVal,
        initialRestTime: Math.max(state.initialRestTime + action.delta, 1),
      };
    case "RESET_REST":
      if (!state.routine) return state;
      const originalRest =
        state.routine.exercises[state.currentExerciseIndex].rest;
      return {
        ...state,
        restTime: originalRest,
        initialRestTime: originalRest,
        isPaused: false,
      };
    case "SET_REST":
      return { ...state, restTime: action.time, initialRestTime: action.time };
    case "SKIP_REST":
      return { ...state, showRest: false, restTime: 0 };
    case "COMPLETE_SET":
      const newCompleted = [...state.completedSets];
      newCompleted[state.currentExerciseIndex] += 1;
      return {
        ...state,
        completedSets: newCompleted,
        currentExerciseIndex:
          action.nextIndex !== -1
            ? action.nextIndex
            : state.currentExerciseIndex,
        showRest: !action.isAllFinished,
        restTime: action.isAllFinished
          ? 0
          : state.routine?.exercises[state.currentExerciseIndex].rest || 0,
        initialRestTime: action.isAllFinished
          ? 0
          : state.routine?.exercises[state.currentExerciseIndex].rest || 0,
        isRoutineFinished: action.isAllFinished,
        isWorkoutRunning: !action.isAllFinished,
      };
    case "ADD_SET":
    case "REMOVE_SET":
      return {
        ...state,
        routine: action.newRoutine,
        completedSets: action.newCompleted,
      };
    case "UPDATE_REPS":
      return { ...state, routine: action.newRoutine };
    case "UPDATE_WEIGHT":
      return { ...state, routine: action.newRoutine };
    case "CHANGE_EXERCISE":
      return {
        ...state,
        currentExerciseIndex: action.index,
        showRest: false,
        restTime: 0,
      };
    case "TOGGLE_SOUND":
      return { ...state, isSoundEnabled: !state.isSoundEnabled };
    case "TOGGLE_VIBRATION":
      return { ...state, isVibrationEnabled: !state.isVibrationEnabled };
    case "SHOW_TOAST":
      return {
        ...state,
        toast: { show: true, message: action.message },
        isToastMounted: true,
      };
    case "HIDE_TOAST":
      return { ...state, toast: { ...state.toast, show: false } };
    case "MOUNT_TOAST":
      return { ...state, isToastMounted: action.mounted };
    case "FINISH_WORKOUT":
      return { ...state, isRoutineFinished: true, isWorkoutRunning: false };
    default:
      return state;
  }
}

const initialState: State = {
  routine: null,
  currentExerciseIndex: 0,
  completedSets: [],
  showRest: false,
  restTime: 0,
  isPaused: false,
  initialRestTime: 0,
  isRoutineFinished: false,
  isSoundEnabled: true,
  isVibrationEnabled: true,
  toast: { show: false, message: "" },
  isToastMounted: false,
  elapsedTime: 0,
  isWorkoutRunning: false,
};

/* ===============================
    Component
================================ */
export default function ActiveRoutinePage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);

  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const workoutIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restStartTimeRef = useRef<number | null>(null);

  // 루틴 수정
  const [editingReps, setEditingReps] = useState(false);
  const [tempReps, setTempReps] = useState("");
  const [editingWeight, setEditingWeight] = useState(false);
  const [tempWeight, setTempWeight] = useState("");

  const {
    routine,
    currentExerciseIndex,
    completedSets,
    showRest,
    restTime,
    isPaused,
    initialRestTime,
    isRoutineFinished,
    isSoundEnabled,
    isVibrationEnabled,
    toast,
    isToastMounted,
    elapsedTime,
    isWorkoutRunning,
  } = state;

  const currentSetIndex = completedSets[currentExerciseIndex] || 0;

  const [isModified, setIsModified] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const originalRoutineRef = useRef<SavedRoutine | null>(null);
  /* ===============================
      Helper Functions
  ================================ */
  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    dispatch({ type: "SHOW_TOAST", message });
    toastTimeoutRef.current = setTimeout(() => {
      dispatch({ type: "HIDE_TOAST" });
      setTimeout(() => dispatch({ type: "MOUNT_TOAST", mounted: false }), 300);
    }, 2500);
  }, []);

  const getFirstIncompleteExerciseIndex = useCallback(() => {
    if (!routine) return -1;
    for (let i = 0; i < routine.exercises.length; i++) {
      if ((completedSets[i] || 0) < routine.exercises[i].sets) return i;
    }
    return -1;
  }, [routine, completedSets]);

  const notifyRestFinished = useCallback(() => {
    if (isSoundEnabled) {
      const audio = new Audio("/rest-finish.wav");
      audio.play().catch(() => {});
    }
    if (isVibrationEnabled && "vibrate" in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }
    if (Notification.permission === "granted") {
      new Notification("휴식 종료!", {
        body: "다음 세트를 시작하세요 💪",
        tag: "rest-finish",
      });
    }
  }, [isSoundEnabled, isVibrationEnabled]);

  /* ===============================
      Effects
  ================================ */
  // 초기 로드
  useEffect(() => {
    const stored = localStorage.getItem("activeWorkout");
    if (!stored) {
      router.push("/routines");
      return;
    }
    const parsed = JSON.parse(stored);
    const convertedRoutine = {
      ...parsed.routine,
      exercises: parsed.routine.exercises.map((ex: any) => ({
        ...ex,
        reps: Array.isArray(ex.reps) ? ex.reps : Array(ex.sets).fill(ex.reps),
        weight: Array.isArray(ex.weight)
          ? ex.weight
          : Array(ex.sets).fill(ex.weight),
      })),
    };
    const sound = localStorage.getItem("soundEnabled");
    const vibration = localStorage.getItem("vibrationEnabled");

    dispatch({
      type: "INIT",
      payload: {
        routine: convertedRoutine,
        currentExerciseIndex: parsed.currentExerciseIndex,
        completedSets: parsed.completedSets,
        elapsedTime: parsed.elapsedTime,
        isSoundEnabled: sound !== null ? JSON.parse(sound) : true,
        isVibrationEnabled: vibration !== null ? JSON.parse(vibration) : true,
      },
    });

    originalRoutineRef.current = parsed.routine;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [router]);

  // 저장 로직 (상태 변화 시)
  useEffect(() => {
    if (!routine) return;
    localStorage.setItem(
      "activeWorkout",
      JSON.stringify({
        routine,
        currentExerciseIndex,
        completedSets,
        elapsedTime,
        startedAt: Date.now(),
      }),
    );
    localStorage.setItem("soundEnabled", JSON.stringify(isSoundEnabled));
    localStorage.setItem(
      "vibrationEnabled",
      JSON.stringify(isVibrationEnabled),
    );
  }, [
    routine,
    currentExerciseIndex,
    completedSets,
    elapsedTime,
    isSoundEnabled,
    isVibrationEnabled,
  ]);

  // 타이머 (전체 운동)
  useEffect(() => {
    if (!isWorkoutRunning) return;
    workoutIntervalRef.current = setInterval(
      () => dispatch({ type: "TICK_WORKOUT" }),
      1000,
    );
    return () => {
      if (workoutIntervalRef.current) clearInterval(workoutIntervalRef.current);
    };
  }, [isWorkoutRunning]);

  // 타이머 (휴식)
  useEffect(() => {
    if (!showRest || isPaused || restTime <= 0) return;
    restIntervalRef.current = setInterval(
      () => dispatch({ type: "TICK_REST" }),
      1000,
    );
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [showRest, isPaused, restTime]);

  // 휴식 종료 감지
  useEffect(() => {
    if (restTime === 0 && showRest) {
      notifyRestFinished();
      const nextIdx = getFirstIncompleteExerciseIndex();
      if (nextIdx === -1) {
        dispatch({ type: "FINISH_WORKOUT" });
        showToast("🎉 루틴이 모두 완료되었습니다!");
      } else {
        dispatch({ type: "SKIP_REST" }); // Close rest UI
        dispatch({ type: "CHANGE_EXERCISE", index: nextIdx });
        showToast("휴식이 종료되었습니다! 다음 세트를 시작하세요 💪");
      }
    }
  }, [
    restTime,
    showRest,
    notifyRestFinished,
    getFirstIncompleteExerciseIndex,
    showToast,
  ]);

  // Visibility Change Handling
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && restStartTimeRef.current) {
        const elapsed = Math.floor(
          (Date.now() - restStartTimeRef.current) / 1000,
        );
        if (elapsed >= initialRestTime) {
          dispatch({ type: "SET_REST", time: 0 });
        } else {
          dispatch({ type: "SET_REST", time: initialRestTime - elapsed });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [initialRestTime]);

  /* ===============================
      Action Handlers
  ================================ */
  const currentExercise = useMemo(
    () => routine?.exercises[currentExerciseIndex],
    [routine, currentExerciseIndex],
  );

  const completeSet = () => {
    if (!currentExercise || !routine) return;

    // 1. 현재 클릭으로 완료될 세트 상태를 미리 계산합니다.
    const nextCompletedSets = [...completedSets];
    nextCompletedSets[currentExerciseIndex] += 1;

    // 2. 미리 계산된 상태를 바탕으로 모든 운동이 끝났는지 확인합니다.
    const nextIncompleteIdx = routine.exercises.findIndex(
      (ex, i) => (nextCompletedSets[i] || 0) < ex.sets,
    );

    const allDone = nextIncompleteIdx === -1;
    const isLastSetOfCurrent =
      nextCompletedSets[currentExerciseIndex] === currentExercise.sets;

    // UX를 위해 약간의 지연 후 상태를 변경합니다.
    setTimeout(
      () => {
        if (allDone) {
          // 모든 운동의 모든 세트가 완료된 경우
          dispatch({
            type: "COMPLETE_SET",
            nextIndex: -1,
            isAllFinished: true,
          });
          saveWorkoutHistory(routine);
          showToast("🎉 루틴이 모두 완료되었습니다!");
        } else {
          // 현재 운동의 마지막 세트였다면 다음 미완료 운동으로 이동, 아니면 현재 유지
          dispatch({
            type: "COMPLETE_SET",
            nextIndex: isLastSetOfCurrent
              ? nextIncompleteIdx
              : currentExerciseIndex,
            isAllFinished: false,
          });

          restStartTimeRef.current = Date.now();
          if (!isLastSetOfCurrent) {
            showToast("세트가 완료 되었습니다!");
          }
        }
      },
      allDone ? 500 : 800, // 완료 시에는 더 빠르게 전환
    );
  };

  const addSet = () => {
    if (!routine) return;
    setIsModified(true);
    const updatedRoutine = {
      ...routine,
      exercises: routine.exercises.map((ex, idx) => {
        if (idx !== currentExerciseIndex) return ex;
        return {
          ...ex,
          sets: ex.sets + 1,
          reps: [...ex.reps, ex.reps[ex.reps.length - 1] || 10],
          weight: [...ex.weight, ex.weight[ex.weight.length - 1] || 0],
        };
      }),
    };
    const newCompleted = [...completedSets];
    dispatch({ type: "ADD_SET", newRoutine: updatedRoutine, newCompleted });
    showToast("세트가 추가되었습니다 💪");
  };

  const removeSet = () => {
    if (!routine || currentExercise!.sets <= 1) return;
    setIsModified(true);
    const updatedRoutine = {
      ...routine,
      exercises: routine.exercises.map((ex, idx) => {
        if (idx !== currentExerciseIndex) return ex;
        return {
          ...ex,
          sets: ex.sets - 1,
          reps: ex.reps.slice(0, -1),
          weight: ex.weight.slice(0, -1),
        };
      }),
    };

    const newCompleted = [...completedSets];
    newCompleted[currentExerciseIndex] = Math.min(
      newCompleted[currentExerciseIndex],
      updatedRoutine.exercises[currentExerciseIndex].sets,
    );

    // 1. 먼저 상태 반영
    dispatch({
      type: "REMOVE_SET",
      newRoutine: updatedRoutine,
      newCompleted,
    });

    // 2. 그 다음 완료 체크
    const isAllFinished = updatedRoutine.exercises.every(
      (ex, i) => (newCompleted[i] || 0) >= ex.sets,
    );

    if (isAllFinished) {
      dispatch({ type: "FINISH_WORKOUT" });
      saveWorkoutHistory(updatedRoutine);
      showToast("🎉 루틴이 모두 완료되었습니다!");
      return;
    }

    showToast("세트가 삭제되었습니다");
  };

  const updateReps = (setIndex: number, delta: number) => {
    if (!routine) return;
    setIsModified(true);
    const updatedRoutine = {
      ...routine,
      exercises: routine.exercises.map((ex, idx) => {
        if (idx !== currentExerciseIndex) return ex;
        const newReps = [...ex.reps];
        newReps[setIndex] = Math.max(1, (newReps[setIndex] || 0) + delta);
        return { ...ex, reps: newReps };
      }),
    };
    dispatch({ type: "UPDATE_REPS", newRoutine: updatedRoutine });
  };

  const updateWeight = (setIndex: number, delta: number) => {
    if (!routine) return;
    setIsModified(true);

    const updatedRoutine = {
      ...routine,
      exercises: routine.exercises.map((ex, idx) => {
        if (idx !== currentExerciseIndex) return ex;

        const baseWeight = Array.isArray(ex.weight)
          ? ex.weight
          : Array(ex.sets).fill(0);

        const newWeight = [...baseWeight];

        newWeight[setIndex] = Math.max(0, (newWeight[setIndex] || 0) + delta);

        return { ...ex, weight: newWeight };
      }),
    };

    dispatch({ type: "UPDATE_WEIGHT", newRoutine: updatedRoutine });
  };

  const saveWorkoutHistory = (routine: SavedRoutine) => {
    const today = new Date().toLocaleDateString("sv-SE");
    const stored = localStorage.getItem("workout-history");
    const history = stored ? JSON.parse(stored) : {};
    if (!history[today]) history[today] = [];
    history[today].push({
      routineName: routine.name,
      completedAt: new Date().toISOString(),
      exercises: routine.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets,
      })),
    });
    localStorage.setItem("workout-history", JSON.stringify(history));
  };

  const saveWorkoutDate = () => {
    const today = new Date().toLocaleDateString("sv-SE");
    const stored = localStorage.getItem("workout-history");
    const history = stored ? JSON.parse(stored) : {};
    if (!history[today]) history[today] = [];
    localStorage.setItem("workout-history", JSON.stringify(history));
  };

  const finishWorkout = () => {
    localStorage.removeItem("activeWorkout");
    saveWorkoutDate();
    router.push("/routines");
  };
  /* ===============================
      루틴 업데이트 함수
  ================================ */
  const updateRoutineInStorage = () => {
    if (!routine) return;

    const stored = localStorage.getItem("savedRoutines");
    if (!stored) return;

    const parsed: SavedRoutine[] = JSON.parse(stored);

    const updated = parsed.map((r) => (r.id === routine.id ? routine : r));

    localStorage.setItem("savedRoutines", JSON.stringify(updated));
  };
  /* ===============================
      Memoized Stats
  ================================ */
  const totalSets = useMemo(
    () => routine?.exercises.reduce((sum, ex) => sum + ex.sets, 0) || 0,
    [routine],
  );
  const totalCompleted = useMemo(
    () => completedSets.reduce((sum, val) => sum + val, 0),
    [completedSets],
  );
  const progressPercent = useMemo(
    () => (totalSets === 0 ? 0 : (totalCompleted / totalSets) * 100),
    [totalCompleted, totalSets],
  );
  const restProgressPercent = useMemo(
    () => (initialRestTime <= 0 ? 0 : (restTime / initialRestTime) * 100),
    [restTime, initialRestTime],
  );

  const workoutHours = Math.floor(elapsedTime / 3600);
  const workoutMinutes = Math.floor((elapsedTime % 3600) / 60);
  const workoutSeconds = elapsedTime % 60;

  if (!routine || !currentExercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        루틴 불러오는 중...
      </div>
    );
  }

  /* ===============================
      Render Finished Screen
  ================================ */
  if (isRoutineFinished) {
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
              if (isModified) {
                setIsUpdateModalOpen(true);
                console.log("완료");
              } else {
                finishWorkout();
              }
            }}
            className="mt-6 bg-black text-white px-6 py-3 rounded-xl hover:opacity-90"
          >
            완료
          </button>
        </div>
        <ConfirmModal
          open={isUpdateModalOpen}
          onOpenChange={setIsUpdateModalOpen}
          title="루틴 업데이트"
          description="방금 수행한 루틴으로 업데이트 하시겠습니까?"
          confirmText="업데이트"
          onConfirm={() => {
            updateRoutineInStorage();
            finishWorkout();
          }}
          onCancel={() => {
            finishWorkout();
          }}
        />
      </div>
    );
  }

  /* ===============================
      Main UI
  ================================ */
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
            <ChevronLeft className="size-4" /> 나가기
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
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-gray-100 p-4 rounded-xl">
              <p className="text-2xl font-bold">{currentExercise.sets}</p>
              <p className="text-sm text-gray-500">세트</p>
            </div>
            <div
              className="bg-gray-100 p-4 rounded-xl cursor-pointer hover:bg-gray-200"
              onClick={() => {
                setEditingReps(true);
                setTempReps(
                  String(currentExercise.reps[currentSetIndex] || ""),
                );
              }}
            >
              {editingReps ? (
                <input
                  type="number"
                  value={tempReps}
                  autoFocus
                  onChange={(e) => setTempReps(e.target.value)}
                  onBlur={() => {
                    const value = Math.max(1, Number(tempReps) || 1);
                    updateReps(
                      currentSetIndex,
                      value - currentExercise.reps[currentSetIndex] || 0,
                    );
                    setEditingReps(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const value = Math.max(1, Number(tempReps) || 1);
                      updateReps(
                        currentSetIndex,
                        value - currentExercise.reps[currentSetIndex] || 0,
                      );
                      setEditingReps(false);
                    }
                  }}
                  className="text-2xl font-bold bg-transparent outline-none w-full text-center"
                />
              ) : (
                <p className="relative text-2xl font-bold text-center">
                  <SquarePen className="absolute -right-2 -top-1/4 size-4 md:right-0 md:top-1/2 md:-translate-y-1/2 opacity-60" />
                  {currentExercise.reps[currentSetIndex]}
                </p>
              )}
              <p className="text-sm text-gray-500">반복</p>
            </div>
            <div
              className="bg-gray-100 p-4 rounded-xl cursor-pointer"
              onClick={() => {
                setEditingWeight(true);
                setTempWeight(
                  String(currentExercise.weight[currentSetIndex] || ""),
                );
              }}
            >
              {editingWeight ? (
                <input
                  type="number"
                  value={tempWeight}
                  autoFocus
                  onChange={(e) => setTempWeight(e.target.value)}
                  onBlur={() => {
                    const value = Math.max(0, Number(tempWeight) || 0);
                    updateWeight(
                      currentSetIndex,
                      value - (currentExercise.weight[currentSetIndex] || 0),
                    );
                    setEditingWeight(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const value = Math.max(0, Number(tempWeight) || 0);
                      updateWeight(
                        currentSetIndex,
                        value - (currentExercise.weight[currentSetIndex] || 0),
                      );
                      setEditingWeight(false);
                    }
                  }}
                  className="text-2xl font-bold bg-transparent outline-none w-full text-center"
                />
              ) : (
                <p className="relative text-2xl font-bold text-center">
                  <SquarePen className="absolute -right-2 -top-1/4 size-4 md:right-0 md:top-1/2 md:-translate-y-1/2 opacity-60" />
                  {currentExercise.weight[currentSetIndex]}
                </p>
              )}
              <p className="text-sm text-gray-500">kg</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-xl">
              <p className="text-2xl font-bold">{currentExercise.rest}</p>
              <p className="text-sm text-gray-500">초 휴식</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-semibold">세트 진행</p>
            <div className="flex flex-wrap justify-evenly gap-3">
              {Array.from({ length: currentExercise.sets }).map((_, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${i < completedSets[currentExerciseIndex] ? "border-green-300 bg-green-50" : "bg-gray-100"}`}
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
            {!showRest && (
              <button
                onClick={completeSet}
                disabled={
                  completedSets[currentExerciseIndex] === currentExercise.sets
                }
                className="w-full bg-black text-white py-3 rounded-xl mt-4 hover:opacity-90 disabled:opacity-40"
              >
                세트 완료
              </button>
            )}
          </div>
        </div>

        {/* 휴식 타이머 UI */}
        {showRest && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center space-y-6">
            <p className="text-gray-500">휴식 시간</p>
            <p className="text-5xl font-bold">
              {Math.floor(restTime / 60)}:
              {(restTime % 60).toString().padStart(2, "0")}
            </p>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-black rounded-full transition-all duration-500"
                style={{ width: `${Math.min(restProgressPercent, 100)}%` }}
              />
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => dispatch({ type: "ADJUST_REST", delta: -15 })}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                <Minus />
              </button>
              <button
                onClick={() => dispatch({ type: "ADJUST_REST", delta: -5 })}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                -5초
              </button>
              <button
                onClick={() => dispatch({ type: "TOGGLE_PAUSE_REST" })}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                {isPaused ? <Play /> : <Pause />}
              </button>
              <button
                onClick={() => dispatch({ type: "RESET_REST" })}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                <RotateCcw />
              </button>
              <button
                onClick={() => dispatch({ type: "ADJUST_REST", delta: 5 })}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                +5초
              </button>
              <button
                onClick={() => dispatch({ type: "ADJUST_REST", delta: 15 })}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                <Plus />
              </button>
              <button
                onClick={() => dispatch({ type: "TOGGLE_SOUND" })}
                className={`px-4 py-2 rounded-xl border font-semibold ${isSoundEnabled ? "bg-blue-100 border-blue-400 text-blue-700" : "bg-gray-100 text-gray-500"}`}
              >
                {isSoundEnabled ? <Headphones /> : <HeadphoneOff />}
              </button>
              <button
                onClick={() => dispatch({ type: "TOGGLE_VIBRATION" })}
                className={`px-4 py-2 rounded-xl border font-semibold md:hidden ${isVibrationEnabled ? "bg-green-100 border-green-400 text-green-700" : "bg-gray-100 text-gray-500"}`}
              >
                {isVibrationEnabled ? <Vibrate /> : <VibrateOff />}
              </button>
            </div>
            <button
              onClick={() => dispatch({ type: "SKIP_REST" })}
              className="w-full bg-black text-white py-3 rounded-xl mt-4 hover:opacity-90"
            >
              건너뛰기
            </button>
          </div>
        )}

        {/* 하단 네비게이션 */}
        <div className="flex gap-4">
          <button
            onClick={() =>
              dispatch({
                type: "CHANGE_EXERCISE",
                index: currentExerciseIndex - 1,
              })
            }
            disabled={currentExerciseIndex === 0}
            className="flex-1 py-3 rounded-xl border hover:bg-gray-100 disabled:opacity-40"
          >
            이전 운동
          </button>
          <button
            onClick={() =>
              dispatch({
                type: "CHANGE_EXERCISE",
                index: currentExerciseIndex + 1,
              })
            }
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
                onClick={() => dispatch({ type: "CHANGE_EXERCISE", index })}
                className={`p-4 rounded-xl border cursor-pointer flex justify-between ${index === currentExerciseIndex ? "border-black bg-gray-200" : ""} ${completedSets[index] === ex.sets ? "border-green-300 bg-green-50" : ""}`}
              >
                <div className="flex items-center">
                  {completedSets[index] === ex.sets ? (
                    <CheckCircle2 className="me-3 text-green-500" />
                  ) : (
                    <Circle className="me-3" />
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

      {isToastMounted && (
        <ToastItem message={toast.message} isVisible={toast.show} />
      )}

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
