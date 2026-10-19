// One configuration point for physical password locks. Public browser puzzles,
// not authentication: these codes are deliberately shipped with the game.
export const passwordLocks = {
  safe: { code: "197511", floor: 2 },
  film: { code: "3141", floor: 4 },
} as const;
export type LockId = keyof typeof passwordLocks;
export const keypad = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "⌫",
  "0",
  "↵",
];
export type LockInput = {
  lockId: LockId | null;
  password: string;
  keypadIndex: number;
  keypadMode: boolean;
  passwordError: boolean;
};
export const emptyLock = (): LockInput => ({
  lockId: null,
  password: "",
  keypadIndex: 11,
  keypadMode: false,
  passwordError: false,
});
export function editPassword(s: LockInput, code: string): Partial<LockInput> {
  if (!s.lockId) return {};
  const digit = /^(?:Digit|Numpad)(\d)$/.exec(code)?.[1];
  if (digit)
    return {
      password: (s.password + digit).slice(
        0,
        passwordLocks[s.lockId].code.length,
      ),
      keypadMode: false,
      keypadIndex: 11,
      passwordError: false,
    };
  if (code === "Backspace" || code === "Delete")
    return {
      password: code === "Delete" ? "" : s.password.slice(0, -1),
      passwordError: false,
    };
  const moves: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -3,
    ArrowDown: 3,
  };
  const move = moves[code];
  if (move !== undefined)
    return {
      keypadIndex: (s.keypadIndex + move + 12) % 12,
      keypadMode: true,
    };
  return {};
}
