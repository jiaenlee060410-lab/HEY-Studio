import { create } from "zustand";
import { emitGameEvent } from "./events";
import { copy } from "./content";
import {
  emptyLock,
  editPassword,
  keypad,
  passwordLocks,
  type LockInput,
} from "./passwords";
import { lockSound } from "./audio";
export type TargetId =
  | "ticket"
  | "seat"
  | "safe"
  | "safeContents"
  | "filmLock"
  | "exit2"
  | "entry3"
  | "desk"
  | "fragment1"
  | "fragment2"
  | "fragment3"
  | "key2"
  | "exit3"
  | "entry4"
  | "projector"
  | "key3"
  | "exit4"
  | "poster";
export type Modal =
  | "welcome"
  | "pause"
  | "ticket"
  | "note"
  | "numberNote"
  | "filmNote"
  | "password"
  | "lockSuccess"
  | "map"
  | "fragment"
  | "photo"
  | "inventory"
  | "next"
  | "poster"
  | null;
export type Progress = {
  hasNumberNote: boolean;
  hasFilmNote: boolean;
  safeUnlocked: boolean;
  filmUnlocked: boolean;
  hasTicket: boolean;
  hasTicket2: boolean;
  hasMap: boolean;
  hasPhotoFragments: [boolean, boolean, boolean];
  hasRestoredPhoto: boolean;
  hasKey1: boolean;
  hasKey2: boolean;
  hasKey3: boolean;
  key1Found: boolean;
  key2Found: boolean;
  key3Found: boolean;
  exit2Open: boolean;
  entry3Open: boolean;
  exit3Open: boolean;
  entry4Open: boolean;
  exit4Open: boolean;
  ticketPlaced: boolean;
  photoPlaced: boolean;
  projectorStarted: boolean;
  projectionFinished: boolean;
  drawerOpen: boolean;
  completed: boolean;
};
export const freshProgress = (): Progress => ({
  hasNumberNote: false,
  hasFilmNote: false,
  safeUnlocked: false,
  filmUnlocked: false,
  hasTicket: false,
  hasTicket2: false,
  hasMap: false,
  hasPhotoFragments: [false, false, false],
  hasRestoredPhoto: false,
  hasKey1: false,
  hasKey2: false,
  hasKey3: false,
  key1Found: false,
  key2Found: false,
  key3Found: false,
  exit2Open: false,
  entry3Open: false,
  exit3Open: false,
  entry4Open: false,
  exit4Open: false,
  ticketPlaced: false,
  photoPlaced: false,
  projectorStarted: false,
  projectionFinished: false,
  drawerOpen: false,
  completed: false,
});
type State = Progress &
  LockInput & {
    modal: Modal;
    target: TargetId | null;
    locked: boolean;
    crouched: boolean;
    ready: boolean;
    floor: 2 | 3 | 4;
    session: number;
    elapsed: number;
    notice: string;
    readingOnly: boolean;
    inventoryIndex: number;
    activeFragment: number;
    projectionTime: number;
    set: (p: Partial<State>) => void;
    resetGame: () => void;
    interact: (id: TargetId) => void;
    confirm: () => void;
    tickProjection: (dt: number) => void;
    passwordKey: (code: string) => void;
    cancelPassword: () => void;
  };
export function stage(s: Progress) {
  if (!s.hasTicket && !s.ticketPlaced) return 0;
  if (!s.hasNumberNote && !s.safeUnlocked) return 1;
  if (!s.safeUnlocked) return 2;
  if (!s.key1Found) return 3;
  if (!s.exit2Open) return 4;
  if (!s.hasMap) return 5;
  if (!s.hasPhotoFragments.every(Boolean)) return 6;
  if (!s.drawerOpen) return 7;
  if (!s.key2Found) return 8;
  if (!s.exit3Open) return 9;
  if (!s.ticketPlaced) return 10;
  if (!s.photoPlaced) return 11;
  if (!s.projectionFinished) return 12;
  if (!s.filmUnlocked) return 13;
  if (!s.key3Found) return 14;
  return 15;
}
export function available(id: TargetId, s: Progress) {
  switch (id) {
    case "ticket":
      return !s.hasTicket && !s.ticketPlaced;
    case "seat":
      return s.hasTicket && !s.hasNumberNote;
    case "safe":
      return !s.safeUnlocked;
    case "safeContents":
      return s.safeUnlocked && !s.key1Found;
    case "filmLock":
      return s.projectionFinished && !s.filmUnlocked;
    case "desk":
      return !s.drawerOpen;
    case "fragment1":
    case "fragment2":
    case "fragment3":
      return s.hasMap && !s.hasPhotoFragments[Number(id.at(-1)) - 1];
    case "key2":
      return s.drawerOpen && !s.key2Found;
    case "key3":
      return s.filmUnlocked && !s.key3Found;
    case "projector":
      return !s.projectorStarted;
    case "exit2":
      return !s.exit2Open;
    case "entry3":
      return !s.entry3Open;
    case "exit3":
      return !s.exit3Open;
    case "entry4":
      return !s.entry4Open;
    case "exit4":
      return !s.exit4Open;
    default:
      return true;
  }
}
export function inventory(s: Progress): { name: string; modal: Modal }[] {
  return [
    ...(s.hasTicket
      ? [{ name: copy.items.ticket, modal: "ticket" as const }]
      : []),
    ...(s.hasNumberNote
      ? [{ name: copy.items.numberNote, modal: "numberNote" as const }]
      : []),
    ...(s.hasTicket2
      ? [{ name: copy.items.note, modal: "note" as const }]
      : []),
    ...(s.hasMap ? [{ name: copy.items.map, modal: "map" as const }] : []),
    ...(s.hasPhotoFragments.some(Boolean)
      ? [
          {
            name:
              copy.items.fragments +
              " " +
              s.hasPhotoFragments.filter(Boolean).length +
              "/3",
            modal: "fragment" as const,
          },
        ]
      : []),
    ...(s.hasRestoredPhoto
      ? [{ name: copy.items.photo, modal: "photo" as const }]
      : []),
    ...(s.hasFilmNote
      ? [{ name: copy.items.filmNote, modal: "filmNote" as const }]
      : []),
  ];
}
// Single browser GameManager. No persistent save hydration: every entry is fresh.
export const useGame = create<State>((set, get) => ({
  ...freshProgress(),
  ...emptyLock(),
  modal: "welcome",
  target: null,
  locked: false,
  crouched: false,
  ready: false,
  floor: 2,
  session: 0,
  elapsed: 0,
  notice: "",
  readingOnly: false,
  inventoryIndex: 0,
  activeFragment: 0,
  projectionTime: 0,
  set: (p) => set(p),
  resetGame: () => {
    set({
      ...freshProgress(),
      ...emptyLock(),
      modal: "welcome",
      target: null,
      locked: false,
      crouched: false,
      floor: 2,
      session: get().session + 1,
      elapsed: 0,
      notice: "",
      readingOnly: false,
      inventoryIndex: 0,
      activeFragment: 0,
      projectionTime: 0,
    });
    emitGameEvent("floor2_enter", { reset: true });
  },
  interact: (id) => {
    const s = get();
    if (s.modal || !available(id, s)) return;
    if ((id === "ticket" || id === "seat" || id === "fragment1") && !s.crouched)
      return;
    if (id === "ticket") set({ modal: "ticket", readingOnly: false });
    if (id === "seat") set({ modal: "numberNote", readingOnly: false });
    if (id === "safe")
      set({ ...emptyLock(), lockId: "safe", modal: "password" });
    if (id === "filmLock")
      set({
        ...emptyLock(),
        lockId: "film",
        modal: "filmNote",
        readingOnly: false,
      });
    if (id === "safeContents") {
      set({
        hasKey1: true,
        key1Found: true,
        hasTicket2: true,
        modal: "note",
        readingOnly: false,
        notice: "Key 01 · CINEMA",
      });
      emitGameEvent("cinema_key_collected");
    }
    if (id === "entry3") set({ entry3Open: true });
    if (id === "entry4") set({ entry4Open: true });
    if (id === "exit2" || id === "exit3" || id === "exit4") {
      const n = Number(id.at(-1)) - 1;
      const key = ("hasKey" + n) as "hasKey1" | "hasKey2" | "hasKey3";
      const door = (id + "Open") as "exit2Open" | "exit3Open" | "exit4Open";
      if (!s[key]) {
        set({ notice: copy.locked });
        return;
      }
      set({ [key]: false, [door]: true, notice: copy.unlocked });
      emitGameEvent("door_unlocked", { floor: n + 1, key: n });
      if (id === "exit2") emitGameEvent("floor2_completed");
    }
    if (id === "desk") {
      if (!s.hasMap) set({ modal: "map", readingOnly: false });
      else if (s.hasPhotoFragments.every(Boolean))
        set({ modal: "photo", readingOnly: false });
      else set({ notice: copy.findFragments });
    }
    if (id.startsWith("fragment")) {
      const i = Number(id.at(-1)) - 1;
      const pieces = [...s.hasPhotoFragments] as [boolean, boolean, boolean];
      pieces[i] = true;
      set({
        hasPhotoFragments: pieces,
        activeFragment: i,
        modal: "fragment",
        readingOnly: false,
      });
      emitGameEvent("photo_fragment_collected", { fragment: i + 1 });
    }
    if (id === "key2") {
      set({ hasKey2: true, key2Found: true, notice: "Key 02 · SCAR" });
      emitGameEvent("scar_key_collected");
    }
    if (id === "key3") {
      set({ hasKey3: true, key3Found: true, notice: "Key 03 · DREAM" });
      emitGameEvent("dream_key_collected");
    }
    if (id === "projector") {
      if (!s.ticketPlaced) {
        if (!s.hasTicket) {
          set({ notice: copy.needTicket });
          return;
        }
        set({
          hasTicket: false,
          ticketPlaced: true,
          notice: copy.ticketPlaced,
        });
      } else if (!s.photoPlaced) {
        if (!s.hasRestoredPhoto) {
          set({ notice: copy.needPhoto });
          return;
        }
        set({
          hasRestoredPhoto: false,
          photoPlaced: true,
          projectorStarted: true,
          projectionTime: 0,
          notice: copy.projection,
        });
        emitGameEvent("projection_started");
      }
    }
    if (id === "poster") set({ modal: "poster" });
  },
  confirm: () => {
    const s = get();
    if (s.readingOnly) {
      set({ modal: "inventory", readingOnly: false });
      return;
    }
    switch (s.modal) {
      case "numberNote":
        set({ hasNumberNote: true, modal: null });
        break;
      case "filmNote":
        set({
          hasFilmNote: true,
          modal: "password",
          ...emptyLock(),
          lockId: "film",
        });
        break;
      case "password": {
        if (!s.lockId) return;
        const definition = passwordLocks[s.lockId];
        if (s.keypadMode && s.keypadIndex !== 11) {
          const key = keypad[s.keypadIndex];
          const password =
            key === "⌫"
              ? s.password.slice(0, -1)
              : (s.password + key).slice(0, definition.code.length);
          set({
            password,
            passwordError: false,
            keypadIndex:
              password.length === definition.code.length ? 11 : s.keypadIndex,
          });
          return;
        }
        const correct = s.password === definition.code;
        lockSound(correct);
        if (!correct) {
          set({ password: "", passwordError: true, keypadIndex: 11 });
          emitGameEvent("password_rejected", { lockId: s.lockId });
          return;
        }
        set({
          [s.lockId === "safe" ? "safeUnlocked" : "filmUnlocked"]: true,
          modal: "lockSuccess",
          password: "",
          passwordError: false,
        });
        emitGameEvent("password_unlocked", {
          lockId: s.lockId,
          floor: definition.floor,
        });
        break;
      }
      case "lockSuccess":
        set({ ...emptyLock(), modal: null });
        break;
      case "ticket":
        set({ hasTicket: true, modal: null });
        emitGameEvent("ticket_collected");
        break;
      case "note":
        set({ modal: null });
        break;
      case "map":
        set({ hasMap: true, modal: null });
        break;
      case "photo":
        if (s.hasPhotoFragments.every(Boolean)) {
          set({
            hasRestoredPhoto: true,
            drawerOpen: true,
            modal: null,
            notice: copy.drawer,
          });
          emitGameEvent("photo_restored");
        }
        break;
      case "inventory": {
        const items = inventory(s);
        if (items.length)
          set({
            modal: items[s.inventoryIndex % items.length].modal,
            readingOnly: true,
          });
        break;
      }
      case "next":
        get().resetGame();
        break;
      default:
        set({ modal: null });
    }
  },
  passwordKey: (code) => {
    const s = get();
    if (s.modal === "password") set(editPassword(s, code));
  },
  cancelPassword: () =>
    set({ ...emptyLock(), modal: null, readingOnly: false }),
  tickProjection: (dt) => {
    const s = get();
    if (!s.projectorStarted || s.projectionFinished || s.modal) return;
    const time = Math.min(8, s.projectionTime + Math.max(0, dt));
    s.projectionTime = time;
    if (time >= 8) {
      set({ projectionTime: time, projectionFinished: true });
      emitGameEvent("projection_finished");
    }
  },
}));
