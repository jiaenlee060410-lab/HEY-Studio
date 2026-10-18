export type GameEvent =
  | "floor2_enter"
  | "ticket_collected"
  | "box_unlocked"
  | "cinema_key_collected"
  | "dream_key_collected"
  | "cinema_memory_restored"
  | "floor2_completed"
  | "door_unlocked"
  | "photo_fragment_collected"
  | "photo_restored"
  | "scar_key_collected"
  | "projection_started"
  | "projection_finished"
  | "journey_completed";
export function emitGameEvent(
  eventName: GameEvent,
  data: Record<string, unknown> = {},
) {
  const detail = { eventName, timestamp: Date.now(), ...data };
  window.dispatchEvent(new CustomEvent("recall:game-event", { detail }));
  // Optional TouchDesigner bridge. A missing/closed socket never blocks gameplay.
  const socket = (window as Window & { touchDesignerSocket?: WebSocket })
    .touchDesignerSocket;
  if (socket?.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify(detail));
}
