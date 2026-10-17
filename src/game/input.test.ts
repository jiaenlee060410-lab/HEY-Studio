import { afterEach, expect, it, vi } from "vitest";
import { InputManager } from "./input";
afterEach(() => vi.unstubAllGlobals());
it("maps gamepad sticks, hold crouch and confirmation edges without repeated submits", () => {
  const pad = {
    axes: [0.5, -0.5, 0.05, 0.8],
    buttons: Array.from({ length: 8 }, () => ({ pressed: false })),
  };
  vi.stubGlobal("navigator", { getGamepads: () => [pad] });
  const input = new InputManager(),
    confirm = vi.fn();
  pad.buttons[0].pressed = true;
  pad.buttons[4].pressed = true;
  input.poll(confirm);
  input.poll(confirm);
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(input.crouched).toBe(true);
  expect(input.look).toEqual([0, 0.8]);
  expect(input.move).toEqual([0.5, -0.5]);
  pad.buttons[0].pressed = false;
  pad.buttons[4].pressed = false;
  input.poll(confirm);
  pad.buttons[7].pressed = true;
  input.poll(confirm);
  expect(confirm).toHaveBeenCalledTimes(2);
  expect(input.crouched).toBe(false);
  vi.stubGlobal("navigator", { getGamepads: () => [] });
  input.poll(confirm);
  expect(input.padActive).toBe(false);
  expect(input.move).toEqual([0, 0]);
});
it("clears held keys when focus or mouse lock is lost", () => {
  const input = new InputManager();
  input.keys.add("KeyW");
  input.keys.add("ShiftLeft");
  expect(input.crouched).toBe(true);
  input.clear();
  expect(input.keys.size).toBe(0);
  expect(input.crouched).toBe(false);
});
