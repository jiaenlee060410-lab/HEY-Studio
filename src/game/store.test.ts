import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./events", () => ({ emitGameEvent: vi.fn() }));
import { useGame, stage, available, freshProgress, inventory } from "./store";
import { emitGameEvent } from "./events";
const s = () => useGame.getState();
beforeEach(() => {
  s().resetGame();
  s().set({ modal: null });
});
function cinema() {
  s().set({ crouched: true });
  s().interact("ticket");
  s().confirm();
  s().interact("seat");
  s().confirm();
  unlock("safe", "197511");
  s().interact("safeContents");
  s().confirm();
}
function unlock(id: "safe" | "filmLock", password: string) {
  s().interact(id);
  if (id === "filmLock") s().confirm();
  for (const digit of password) s().passwordKey("Digit" + digit);
  s().confirm();
  expect(s().modal).toBe("lockSuccess");
  s().confirm();
}
function scar() {
  s().interact("desk");
  s().confirm();
  for (const id of ["fragment1", "fragment2", "fragment3"] as const) {
    s().interact(id);
    s().confirm();
  }
  s().interact("desk");
  s().confirm();
  s().interact("key2");
}
describe("three-floor GameManager", () => {
  it("projection counts active seconds even when rendering frames are slow", () => {
    s().set({ projectorStarted: true });
    s().tickProjection(2.5);
    expect(s().projectionTime).toBe(2.5);
    s().set({ modal: "pause" });
    s().tickProjection(60);
    expect(s().projectionTime).toBe(2.5);
    s().confirm();
    s().tickProjection(5.5);
    expect(s().projectionFinished).toBe(true);
  });
  it("requires crouch for both 2F clues and consumes only the matching key", () => {
    s().interact("ticket");
    expect(s().modal).toBe(null);
    s().interact("exit2");
    expect(s().exit2Open).toBe(false);
    s().set({ crouched: true });
    s().interact("ticket");
    s().confirm();
    s().set({ crouched: false });
    s().interact("seat");
    expect(s().key1Found).toBe(false);
    s().set({ crouched: true });
    s().interact("seat");
    s().confirm();
    expect(s().hasKey1).toBe(false);
    expect(s().hasNumberNote).toBe(true);
    unlock("safe", "197511");
    expect(s().hasKey1).toBe(false);
    s().interact("safeContents");
    s().confirm();
    expect(s().hasKey1).toBe(true);
    s().interact("exit3");
    expect(s().exit3Open).toBe(false);
    s().interact("exit2");
    expect(s().exit2Open).toBe(true);
    expect(s().hasKey1).toBe(false);
    s().interact("seat");
    expect(s().hasKey1).toBe(false);
  });
  it("opens entry doors without keys; exits stay locked", () => {
    s().interact("entry3");
    s().interact("entry4");
    expect(s().entry3Open && s().entry4Open).toBe(true);
    for (const id of ["exit2", "exit3", "exit4"] as const) s().interact(id);
    expect(s().exit2Open || s().exit3Open || s().exit4Open).toBe(false);
  });
  it("gates fragments behind map and restoration behind all three pieces", () => {
    s().set({ crouched: true });
    s().interact("fragment1");
    expect(s().hasPhotoFragments).toEqual([false, false, false]);
    s().interact("desk");
    s().confirm();
    expect(s().hasMap).toBe(true);
    s().interact("fragment1");
    s().confirm();
    s().interact("desk");
    expect(s().drawerOpen).toBe(false);
    expect(s().hasKey2).toBe(false);
    for (const id of ["fragment2", "fragment3"] as const) {
      s().interact(id);
      s().confirm();
    }
    s().interact("desk");
    expect(s().modal).toBe("photo");
    s().confirm();
    expect(s().hasRestoredPhoto).toBe(true);
    expect(s().drawerOpen).toBe(true);
    expect(s().hasKey2).toBe(false);
    s().interact("key2");
    expect(s().hasKey2).toBe(true);
  });
  it("runs complete chain, places both physical items, waits for projection, and separately collects key3", () => {
    cinema();
    s().interact("exit2");
    scar();
    s().interact("exit3");
    s().interact("projector");
    expect(s().ticketPlaced).toBe(true);
    expect(s().hasTicket).toBe(false);
    expect(s().projectorStarted).toBe(false);
    s().interact("projector");
    expect(s().photoPlaced).toBe(true);
    expect(s().hasRestoredPhoto).toBe(false);
    s().interact("key3");
    expect(s().hasKey3).toBe(false);
    s().set({ modal: "pause" });
    s().tickProjection(0.1);
    expect(s().projectionTime).toBe(0);
    s().confirm();
    for (let i = 0; i < 82; i++) s().tickProjection(0.1);
    expect(s().projectionFinished).toBe(true);
    expect(s().hasKey3).toBe(false);
    s().interact("key3");
    expect(s().hasKey3).toBe(false);
    unlock("filmLock", "3141");
    s().interact("key3");
    s().interact("exit4");
    expect(s().exit4Open).toBe(true);
    expect(s().hasKey3).toBe(false);
    expect(stage(s())).toBe(15);
    expect(s().completed).toBe(false);
  });
  it("reset clears every progression field including nested fragments, doors and physical animation flags", () => {
    cinema();
    scar();
    s().interact("projector");
    s().interact("projector");
    const session = s().session;
    s().resetGame();
    for (const [key, value] of Object.entries(freshProgress()))
      expect(s()[key as keyof ReturnType<typeof freshProgress>]).toEqual(value);
    expect(s().session).toBe(session + 1);
    expect(s().floor).toBe(2);
    expect(s().modal).toBe("welcome");
  });
  it("reading inventory never grants duplicate keys or opens drawers", () => {
    cinema();
    s().interact("exit2");
    s().set({ modal: "inventory", inventoryIndex: 1 });
    s().confirm();
    expect(s().modal).toBe("numberNote");
    s().confirm();
    expect(s().modal).toBe("inventory");
    expect(s().hasKey1).toBe(false);
    expect(available("ticket", s())).toBe(false);
    expect(inventory(s())).toHaveLength(3);
  });
  it("rejects wrong and incomplete passwords, limits digits, and resets both locks", () => {
    s().interact("safe");
    s().passwordKey("Digit1");
    s().confirm();
    expect(s().passwordError).toBe(true);
    expect(s().password).toBe("");
    expect(s().safeUnlocked).toBe(false);
    for (const n of "999999999") s().passwordKey("Digit" + n);
    expect(s().password).toBe("999999");
    s().confirm();
    expect(s().safeUnlocked).toBe(false);
    for (const n of "197511") s().passwordKey("Numpad" + n);
    s().confirm();
    expect(s().safeUnlocked).toBe(true);
    s().confirm();
    expect(s().key1Found).toBe(false);
    s().interact("filmLock");
    expect(s().modal).toBe(null);
    s().set({ projectionFinished: true });
    unlock("filmLock", "3141");
    expect(s().filmUnlocked).toBe(true);
    expect(s().key3Found).toBe(false);
    s().resetGame();
    expect(
      s().safeUnlocked ||
        s().filmUnlocked ||
        s().hasNumberNote ||
        s().hasFilmNote,
    ).toBe(false);
    expect(s().lockId).toBe(null);
  });
  it("enters 3141 using only arrows and Enter, then requires the submit cell", () => {
    s().set({ projectionFinished: true });
    s().interact("filmLock");
    s().confirm();
    // Grid starts at submit (11). Select 3 -> 1 -> 4 -> 1.
    for (const key of ["ArrowUp", "ArrowUp", "ArrowUp"]) s().passwordKey(key);
    s().confirm();
    expect(s().password).toBe("3");
    s().passwordKey("ArrowLeft");
    s().passwordKey("ArrowLeft");
    s().confirm();
    s().passwordKey("ArrowDown");
    s().confirm();
    s().passwordKey("ArrowUp");
    s().confirm();
    expect(s().password).toBe("3141");
    expect(s().keypadIndex).toBe(11);
    expect(s().filmUnlocked).toBe(false);
    s().confirm();
    expect(s().filmUnlocked).toBe(true);
  });
  it("cancel closes lock without opening it; inventory reading cannot unlock film", () => {
    s().interact("safe");
    s().passwordKey("Digit1");
    s().cancelPassword();
    expect(s().modal).toBe(null);
    expect(s().password).toBe("");
    expect(s().safeUnlocked).toBe(false);
    s().set({ hasFilmNote: true, readingOnly: true, modal: "filmNote" });
    s().confirm();
    expect(s().modal).toBe("inventory");
    expect(s().filmUnlocked).toBe(false);
  });
  it("wrong film password cannot release key3 and a correct lock emits OnUnlock only once", () => {
    s().set({ projectionFinished: true });
    s().interact("filmLock");
    s().confirm();
    for (const digit of "0000") s().passwordKey("Digit" + digit);
    s().confirm();
    expect(s().passwordError).toBe(true);
    expect(s().password).toBe("");
    expect(s().filmUnlocked).toBe(false);
    expect(available("key3", s())).toBe(false);
    vi.mocked(emitGameEvent).mockClear();
    for (const digit of "3141") s().passwordKey("Digit" + digit);
    s().confirm();
    s().confirm();
    s().interact("filmLock");
    s().confirm();
    expect(emitGameEvent).toHaveBeenCalledExactlyOnceWith("password_unlocked", {
      lockId: "film",
      floor: 4,
    });
    expect(s().hasKey3).toBe(false);
  });
});
