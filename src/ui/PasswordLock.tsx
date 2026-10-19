import { copy } from "../game/content";
import { keypad, passwordLocks } from "../game/passwords";
import { useGame } from "../game/store";

export function PasswordLock() {
  const s = useGame();
  if (!s.lockId) return null;
  const digits = passwordLocks[s.lockId].code.length;
  return (
    <section
      className="dialog password-lock"
      role="dialog"
      aria-modal="true"
      aria-label={copy.locks[s.lockId]}
    >
      <small>
        {s.lockId === "safe" ? "02 / PROJECTION OFFICE" : "04 / MEMORY SYNC"}
      </small>
      <h2>{copy.locks[s.lockId]}</h2>
      {s.modal === "lockSuccess" ? (
        <>
          <p role="status">{copy.locks.success}</p>
          <p>{copy.locks.take}</p>
          <div className="start-key">{copy.confirm}</div>
        </>
      ) : (
        <>
          {s.lockId === "film" && (
            <p className="lock-clue">
              {copy.filmNote}
              <br />
              <em>{copy.filmHint}</em>
            </p>
          )}
          <output
            className="password-output"
            aria-label={copy.locks.digits}
            data-testid="password-output"
          >
            {Array.from({ length: digits }, (_, i) => (
              <span key={i}>{s.password[i] ?? "·"}</span>
            ))}
          </output>
          <div className="lock-error" role="status">
            {s.passwordError
              ? copy.locks.error
              : `${digits} ${copy.locks.digits}`}
          </div>
          {/* No click handlers or focusable HTML buttons: the shared InputManager owns input. */}
          <div className="keypad" role="grid" aria-label="숫자 키패드">
            {keypad.map((key, i) => (
              <div
                key={key}
                role="gridcell"
                aria-selected={i === s.keypadIndex}
                className={i === s.keypadIndex ? "selected" : ""}
              >
                {key}
              </div>
            ))}
          </div>
          <div className="lock-controls">
            {copy.locks.controls}
            <br />
            {copy.locks.arrows}
          </div>
        </>
      )}
    </section>
  );
}
