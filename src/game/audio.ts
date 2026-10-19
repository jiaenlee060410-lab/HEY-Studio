// Original synthesized temporary lock feedback. No downloaded audio, keys or network.
// Called only from a user gesture; audio failure must never block the puzzle.
let context: AudioContext | undefined;
export function lockSound(success: boolean) {
  try {
    context ??= new AudioContext();
    const ctx = context;
    void ctx
      .resume()
      .then(() => {
        const now = ctx.currentTime;
        (success ? [440, 660, 880] : [135, 105]).forEach((frequency, i) => {
          const oscillator = ctx.createOscillator(),
            gain = ctx.createGain();
          oscillator.type = success ? "sine" : "triangle";
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, now + i * 0.09);
          gain.gain.linearRampToValueAtTime(0.045, now + i * 0.09 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.18);
          oscillator.connect(gain).connect(ctx.destination);
          oscillator.start(now + i * 0.09);
          oscillator.stop(now + i * 0.09 + 0.2);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
        });
      })
      .catch(() => {});
  } catch {
    /* Silent play is supported. */
  }
}
