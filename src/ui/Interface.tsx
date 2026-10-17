import { useEffect } from "react";
import { copy } from "../game/content";
import { stage, useGame } from "../game/store";

export function MemoryMap() {
  return (
    <svg
      className="memory-map"
      viewBox="0 0 400 210"
      aria-label="손으로 그린 평면도와 가로선을 가진 삼각형 표식"
    >
      <path d="M35 20L365 24 360 185 32 183Z M150 22L150 140 M260 60L260 185" />
      <path
        className="map-dots"
        d="M65 55L90 55 105 150 200 155 220 40 320 40 320 150"
      />
      <g transform="translate(320 150)">
        <path d="M0 -23L-20 17 20 17Z M-29 0H29 M6 -30V27" />
      </g>
      <text x="42" y="204">
        빛의 반대편 / THE OTHER SIDE OF LIGHT
      </text>
    </svg>
  );
}
export function Interface() {
  const s = useGame(),
    count =
      Number(s.seatClueRead) +
      Number(s.cinemaKeyCollected) +
      Number(s.dreamKeyCollected);
  useEffect(() => {
    if (!s.notice) return;
    const t = setTimeout(() => useGame.getState().set({ notice: "" }), 3800);
    return () => clearTimeout(t);
  }, [s.notice]);
  const reading =
    s.modal === "ticket" || s.modal === "note" || s.modal === "map";
  const inventoryItems = [
    ...(s.ticketCollected ? ["영화표 / TICKET"] : []),
    ...(s.seatClueRead ? ["종이 조각 / LIGHT"] : []),
    ...(s.cinemaKeyCollected ? ["평면도 / CINEMA"] : []),
  ];
  return (
    <div className="hud">
      <div className="vignette" />
      <header>
        <div className="location">
          <b>RE:CALL</b>
          <span>{copy.floor}</span>
        </div>
        <div className="memory-count">
          MEMORY SYNC{" "}
          <strong>
            {String(count).padStart(2, "0")}
            <em>/ 03</em>
          </strong>
        </div>
      </header>
      {!s.modal && (
        <>
          <div className={"crosshair" + (s.target ? " active" : "")} />
          {s.target && (
            <div className="prompt">
              <kbd>↵</kbd>
              {copy.prompts[s.target]}
            </div>
          )}
          <footer>
            <div className="objective">
              <small>현재의 기억 / OBJECTIVE {stage(s) + 1}</small>
              <p>{copy.objectives[stage(s)]}</p>
            </div>
            <span className="stance">
              {s.crouched ? "CROUCH / 앉기" : "WALK / 걷기"}
            </span>
          </footer>
          <div className="control-line">{copy.controls}</div>
        </>
      )}
      {s.notice && (
        <div role="status" className="notice">
          {s.notice}
        </div>
      )}
      {s.modal === "welcome" && (
        <section className="welcome">
          <div className="eyebrow">BEIRUT, LEBANON · 16:00</div>
          <h1>
            THE EGG<span>기억 동기화</span>
          </h1>
          <div className="rule" />
          <p>{copy.intro}</p>
          <div className="start-key">
            {s.ready ? copy.start : "기억을 불러오는 중…"}
          </div>
          <div className="instructions">
            <p>{copy.controls}</p>
            <p>{copy.gamepad}</p>
            <small>
              예상 탐색 시간 4–5분 · 새로 입장하면 기억은 초기화됩니다.
            </small>
          </div>
        </section>
      )}
      {s.modal === "pause" && (
        <section className="dialog">
          <small>MEMORY / PAUSED</small>
          <h2>잠시 멈춘 기억</h2>
          <p>화면으로 돌아가려면 Enter를 누르세요.</p>
          <div className="start-key">{copy.resume}</div>
          <p className="muted">R · 처음부터 / I · 가방</p>
        </section>
      )}
      {reading && (
        <div className="dialog-wrap">
          <section className="paper">
            <small>
              {s.modal === "ticket"
                ? "01 / A FORGOTTEN TICKET"
                : s.modal === "note"
                  ? "02 / THE EMPTY SEAT"
                  : "03 / THE OTHER SIDE"}
            </small>
            <h2>
              {s.modal === "ticket"
                ? "오후 네 시"
                : s.modal === "note"
                  ? "그녀의 자리"
                  : "남겨진 표식"}
            </h2>
            <blockquote>
              {copy[s.modal as "ticket" | "note" | "map"]}
            </blockquote>
            {s.modal === "map" && <MemoryMap />}
            <div className="paper-foot">MEMORA · THE EGG</div>
          </section>
          <div className="start-key">
            {s.readingOnly ? "Enter · 가방으로" : copy.confirm}
          </div>
        </div>
      )}
      {s.modal === "inventory" && (
        <section className="dialog">
          <small>ARCHIVE / 기억 보관함</small>
          <h2>발견한 조각들</h2>
          {inventoryItems.length ? (
            inventoryItems.map((name, i) => (
              <p
                key={name}
                className={
                  s.inventoryIndex % inventoryItems.length === i
                    ? "selected"
                    : "muted"
                }
              >
                {String(i + 1).padStart(2, "0")} ─ {name}
              </p>
            ))
          ) : (
            <p>아직 발견한 기억이 없습니다.</p>
          )}
          <div className="start-key">← → 선택 · Enter 읽기 · I 닫기</div>
          {s.dreamKeyCollected && <p>KEY 03 / DREAM</p>}
        </section>
      )}
      {(s.modal === "poster" || s.modal === "projector") && (
        <section className="dialog">
          <small>TRACES OF A CINEMA</small>
          <h2>{copy.prompts[s.modal]}</h2>
          <p>{copy[s.modal]}</p>
          <div className="start-key">{copy.confirm}</div>
        </section>
      )}
      {s.modal === "complete" && (
        <section className="dialog complete">
          <small>MEMORY SYNC / 03 OF 03</small>
          <h2>기억이 돌아왔습니다.</h2>
          <p>
            잊혀진 영화관의 기억이 복원되었습니다.
            <br />
            5F STAGE 접근 권한이 열렸습니다.
          </p>
          <div className="start-key">Enter · 5F STAGE</div>
        </section>
      )}
      {s.modal === "next" && (
        <section className="dialog">
          <small>NEXT CHAPTER</small>
          <h2>5F / STAGE</h2>
          <p>무대는 다음 장에서 이어집니다.</p>
          <div className="start-key">Enter · 영화관 다시 탐색</div>
        </section>
      )}
    </div>
  );
}
