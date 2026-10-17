// One input owner for keyboard, mouse and standard-mapped controllers.
export class InputManager {
  keys = new Set<string>();
  move = [0, 0];
  look = [0, 0];
  padCrouch = false;
  padActive = false;
  private previous = false;
  clear = () => {
    this.keys.clear();
    this.move = [0, 0];
    this.look = [0, 0];
    this.padCrouch = false;
  };
  get crouched() {
    return this.keys.has("ShiftLeft") || this.padCrouch;
  }
  poll(confirm: () => void) {
    const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
    if (!pad) {
      this.padActive = false;
      this.move = [0, 0];
      this.look = [0, 0];
      this.padCrouch = false;
      this.previous = false;
      return;
    }
    const dead = (v: number) => (Math.abs(v) > 0.16 ? v : 0);
    this.move = [dead(pad.axes[0] ?? 0), dead(pad.axes[1] ?? 0)];
    this.look = [dead(pad.axes[2] ?? 0), dead(pad.axes[3] ?? 0)];
    this.padCrouch = pad.buttons[4]?.pressed ?? false;
    const pressed = !!(pad.buttons[0]?.pressed || pad.buttons[7]?.pressed);
    if (pressed || this.move.some(Boolean) || this.look.some(Boolean))
      this.padActive = true;
    if (pressed && !this.previous) confirm();
    this.previous = pressed;
  }
}
