import { create } from "zustand";
import { emitGameEvent } from "./events";
export type TargetId =
  | "ticket"
  | "seat"
  | "box"
  | "symbol"
  | "dream"
  | "exit"
  | "poster"
  | "projector";
export type Modal =
  | "welcome"
  | "pause"
  | "ticket"
  | "note"
  | "map"
  | "inventory"
  | "complete"
  | "next"
  | "poster"
  | "projector"
  | null;
export type Progress = {
  ticketCollected: boolean;
  seatClueRead: boolean;
  boxDiscovered: boolean;
  boxUnlocked: boolean;
  cinemaKeyCollected: boolean;
  dreamRevealed: boolean;
  dreamKeyCollected: boolean;
  exitDoorUnlocked: boolean;
  floor2Completed: boolean;
};
export const freshProgress = (): Progress => ({
  ticketCollected: false,
  seatClueRead: false,
  boxDiscovered: false,
  boxUnlocked: false,
  cinemaKeyCollected: false,
  dreamRevealed: false,
  dreamKeyCollected: false,
  exitDoorUnlocked: false,
  floor2Completed: false,
});
type State = Progress & {
  modal: Modal;
  target: TargetId | null;
  locked: boolean;
  crouched: boolean;
  ready: boolean;
  session: number;
  elapsed: number;
  notice: string;
  readingOnly: boolean;
  inventoryIndex: number;
  set: (p: Partial<State>) => void;
  resetGame: () => void;
  interact: (id: TargetId) => void;
  confirm: () => void;
};
export function stage(s: Progress) {
  return !s.ticketCollected
    ? 0
    : !s.seatClueRead
      ? 1
      : !s.cinemaKeyCollected
        ? 2
        : !s.dreamRevealed
          ? 3
          : !s.dreamKeyCollected
            ? 4
            : 5;
}
export function available(id: TargetId, s: Progress) {
  switch (id) {
    case "ticket":
      return !s.ticketCollected;
    case "seat":
      return s.ticketCollected && !s.seatClueRead;
    case "box":
      return s.seatClueRead && !s.cinemaKeyCollected;
    case "symbol":
      return s.cinemaKeyCollected && !s.dreamRevealed;
    case "dream":
      return s.dreamRevealed && !s.dreamKeyCollected;
    case "exit":
      return !s.floor2Completed;
    default:
      return true;
  }
}
export const useGame = create<State>((set, get) => ({
  ...freshProgress(),
  modal: "welcome",
  target: null,
  locked: false,
  crouched: false,
  ready: false,
  session: 0,
  elapsed: 0,
  notice: "",
  readingOnly: false,
  inventoryIndex: 0,
  set: (p) => set(p),
  resetGame: () => {
    set({
      ...freshProgress(),
      modal: "welcome",
      target: null,
      locked: false,
      crouched: false,
      session: get().session + 1,
      elapsed: 0,
      notice: "",
      readingOnly: false,
      inventoryIndex: 0,
    });
    emitGameEvent("floor2_enter", { reset: true });
  },
  interact: (id) => {
    const s = get();
    if (s.modal || !available(id, s)) return;
    if ((id === "ticket" || id === "box") && !s.crouched) return;
    if (id === "ticket") set({ modal: "ticket", readingOnly: false });
    if (id === "seat") set({ modal: "note", readingOnly: false });
    if (id === "box")
      set({
        modal: "map",
        boxDiscovered: true,
        boxUnlocked: true,
        readingOnly: false,
      });
    if (id === "symbol") {
      set({
        dreamRevealed: true,
        notice: "표식 아래에서 기억의 조각이 드러났습니다.",
      });
      emitGameEvent("cinema_memory_restored");
    }
    if (id === "dream") {
      set({ dreamKeyCollected: true, notice: "Key 03 · DREAM 획득" });
      emitGameEvent("dream_key_collected");
    }
    if (id === "exit") {
      if (s.dreamKeyCollected) {
        set({
          exitDoorUnlocked: true,
          floor2Completed: true,
          modal: "complete",
        });
        emitGameEvent("floor2_completed", { seconds: Math.round(s.elapsed) });
      } else set({ notice: "세 개의 기억이 모여야 무대가 열립니다." });
    }
    if (id === "poster" || id === "projector") set({ modal: id });
  },
  confirm: () => {
    const s = get();
    if (s.readingOnly) {
      set({ modal: "inventory", readingOnly: false });
      return;
    }
    switch (s.modal) {
      case "ticket":
        set({ ticketCollected: true, modal: null });
        emitGameEvent("ticket_collected");
        break;
      case "note":
        set({ seatClueRead: true, modal: null, notice: "Key 01 · LIGHT 획득" });
        break;
      case "map":
        set({
          cinemaKeyCollected: true,
          modal: null,
          notice: "Key 02 · CINEMA 획득",
        });
        emitGameEvent("box_unlocked");
        emitGameEvent("cinema_key_collected");
        break;
      case "inventory": {
        const items: Modal[] = [
          ...(s.ticketCollected ? ["ticket" as const] : []),
          ...(s.seatClueRead ? ["note" as const] : []),
          ...(s.cinemaKeyCollected ? ["map" as const] : []),
        ];
        if (items.length)
          set({
            modal: items[s.inventoryIndex % items.length],
            readingOnly: true,
          });
        break;
      }
      case "complete":
        set({ modal: "next" });
        break;
      case "next":
        get().resetGame();
        break;
      default:
        set({ modal: null });
    }
  },
}));
