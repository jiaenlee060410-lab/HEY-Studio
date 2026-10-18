// Rapier needs headroom above the next riser for a 0.5 m wide rounded capsule.
// 0.4 m autostep clears the 0.175 m treads, but not seats/counters/walls.
export const movementPhysics = {
  stepHeight: 0.4,
  stepWidth: 0.1,
  snapDistance: 0.25,
};
export function nextVerticalSpeed(previous: number, grounded: boolean) {
  return grounded ? -0.6 : Math.max(-10, previous - 9.81 / 60);
}
