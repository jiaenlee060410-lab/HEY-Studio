import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./events", () => ({ emitGameEvent: vi.fn() }));
import { useGame, stage, available } from "./store";
beforeEach(() => {
  useGame.getState().resetGame();
  useGame.setState({ modal: null });
});
describe("Memory Sync progression", () => {
  it("requires crouch and the clue chain, then opens stage access", () => {
    const state = () => useGame.getState();
    state().interact("box");
    expect(state().boxUnlocked).toBe(false);
    state().interact("ticket");
    expect(state().modal).toBe(null);
    state().set({ crouched: true });
    state().interact("ticket");
    expect(state().ticketCollected).toBe(false);
    state().confirm();
    expect(stage(state())).toBe(1);
    state().interact("seat");
    state().confirm();
    expect(stage(state())).toBe(2);
    state().interact("exit");
    expect(state().floor2Completed).toBe(false);
    state().interact("box");
    expect(state().modal).toBe("map");
    state().confirm();
    expect(state().cinemaKeyCollected).toBe(true);
    state().interact("symbol");
    expect(state().dreamRevealed).toBe(true);
    expect(state().dreamKeyCollected).toBe(false);
    state().interact("dream");
    expect(stage(state())).toBe(5);
    state().interact("exit");
    expect(state().floor2Completed).toBe(true);
    state().resetGame();
    expect(stage(state())).toBe(0);
    expect(state().dreamKeyCollected).toBe(false);
    expect(state().boxUnlocked).toBe(false);
  });
  it("does not duplicate collection when rereading the archive", () => {
    useGame.setState({ ticketCollected: true, modal: "inventory" });
    useGame.getState().confirm();
    expect(useGame.getState().readingOnly).toBe(true);
    useGame.getState().confirm();
    expect(useGame.getState().modal).toBe("inventory");
    expect(available("ticket", useGame.getState())).toBe(false);
  });
});
