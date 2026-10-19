import { useEffect } from "react";
import { copy } from "../game/content";
import { inventory, stage, useGame } from "../game/store";
import { assets, assetURL } from "../game/assets";
import { PasswordLock } from "./PasswordLock";

export function MemoryMap() {
  return (
    <svg
      className="memory-map"
      viewBox="0 0 220 420"
      aria-label="3F 지도: 북서 캐비닛, 동쪽 모래주머니, 남서 선반"
    >
      <path d="M10 10H210V410H10Z M145 10h-30 M43 410h28" />
      <path d="M10 250H125 M145 120H210" strokeWidth="4" />
      <path d="M26 70H54V100H26Z M177 195H204 M13 340H42 M95 160H125V175H95Z" />
      <g fill="#7e3e32" stroke="none">
        <circle cx="30" cy="90" r="6" />
        <circle cx="187" cy="210" r="6" />
        <circle cx="27" cy="350" r="6" />
      </g>
      <text x="42" y="85">
        01 · 캐비닛
      </text>
      <text x="132" y="230">
        02 · 모래주머니
      </text>
      <text x="40" y="350">
        03 · 선반
      </text>
      <text x="92" y="190">
        책상
      </text>
      <text x="118" y="30">
        2F ↓
      </text>
      <text x="28" y="394">
        ↑ 4F
      </text>
      <text x="16" y="30">
        N ↑
      </text>
    </svg>
  );
}
export function Photo({ fragment = false }: { fragment?: boolean }) {
  const s = useGame();
  return (
    <figure className="archive-photo">
      <div className={"photo-pieces" + (fragment ? " fragmented" : "")}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={
              fragment && !s.hasPhotoFragments[i] ? "missing-piece" : ""
            }
            style={{
              backgroundImage:
                "url(" +
                assetURL(assets.historicalPhoto || "assets/archive-study.svg") +
                ")",
              backgroundPosition: i * 50 + "% center",
            }}
          />
        ))}
      </div>
      {!assets.historicalPhoto && (
        <figcaption>{copy.photoPlaceholder}</figcaption>
      )}
    </figure>
  );
}
export function Interface() {
  const s = useGame(),
    count = Number(s.key1Found) + Number(s.key2Found) + Number(s.key3Found),
    items = inventory(s);
  useEffect(() => {
    if (!s.notice) return;
    const t = setTimeout(() => useGame.getState().set({ notice: "" }), 4000);
    return () => clearTimeout(t);
  }, [s.notice]);
  const reading = [
    "ticket",
    "note",
    "numberNote",
    "filmNote",
    "map",
    "fragment",
    "photo",
  ].includes(s.modal || "");
  const title =
    s.modal === "numberNote"
      ? copy.items.numberNote
      : s.modal === "filmNote"
        ? copy.items.filmNote
        : s.modal === "ticket"
          ? "오후 네 시"
          : s.modal === "note"
            ? "다음 장으로"
            : s.modal === "map"
              ? "흩어진 기억의 위치"
              : s.modal === "fragment"
                ? "사진 조각"
                : "하나로 이어진 기억";
  return (
    <div className="hud">
      <div className="vignette" />
      <header>
        <div className="location">
          <b>RE:CALL</b>
          <span>{copy.floors[s.floor]}</span>
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
      {(s.modal === "password" || s.modal === "lockSuccess") && (
        <PasswordLock />
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
              2F CINEMA → 3F SCAR → 4F DREAM · 새로 입장하면 처음부터
              시작합니다.
            </small>
          </div>
        </section>
      )}
      {s.modal === "pause" && (
        <section className="dialog">
          <small>MEMORY / PAUSED</small>
          <h2>잠시 멈춘 기억</h2>
          <p>Enter를 누르면 읽기 화면을 닫고 탐색을 계속합니다.</p>
          <div className="start-key">{copy.resume}</div>
          <p className="muted">R · 처음부터 / I · 가방</p>
        </section>
      )}
      {reading && (
        <div className="dialog-wrap">
          <section
            className={"paper " + (s.modal === "map" ? "map-paper" : "")}
          >
            <small>MEMORA / MEMORY ARCHIVE</small>
            <h2>{title}</h2>
            <blockquote>
              {
                copy[
                  s.modal as
                    | "ticket"
                    | "note"
                    | "numberNote"
                    | "filmNote"
                    | "map"
                    | "fragment"
                    | "photo"
                ]
              }
            </blockquote>
            {s.modal === "filmNote" && <p>{copy.filmHint}</p>}
            {s.modal === "map" && <MemoryMap />}
            {(s.modal === "photo" || s.modal === "fragment") && (
              <Photo fragment={s.modal === "fragment"} />
            )}
            <div className="paper-foot">
              THE EGG ·{" "}
              {s.modal === "fragment"
                ? s.hasPhotoFragments.filter(Boolean).length + "/3 FRAGMENTS"
                : "RE:CALL"}
            </div>
          </section>
          <div className="start-key">
            {s.readingOnly
              ? "Enter · 가방으로"
              : s.modal === "photo"
                ? "Enter · 사진 복원 / 서랍 열기"
                : copy.confirm}
          </div>
        </div>
      )}
      {s.modal === "inventory" && (
        <section className="dialog inventory">
          <small>ARCHIVE / 기억 보관함</small>
          <h2>발견한 조각들</h2>
          {items.length ? (
            items.map((item, i) => (
              <p
                key={item.name}
                className={
                  s.inventoryIndex % items.length === i ? "selected" : "muted"
                }
              >
                {String(i + 1).padStart(2, "0")} ─ {item.name}
              </p>
            ))
          ) : (
            <p>아직 발견한 기억이 없습니다.</p>
          )}
          <div className="key-list">
            {[1, 2, 3].map((n) => (
              <span key={n}>
                KEY 0{n} ·{" "}
                {s[("hasKey" + n) as "hasKey1"]
                  ? "보유"
                  : s[("key" + n + "Found") as "key1Found"]
                    ? "사용 완료"
                    : "미발견"}
              </span>
            ))}
          </div>
          {s.ticketPlaced && <p className="muted">영화표 · 영사대에 놓음</p>}
          {s.photoPlaced && <p className="muted">사진 · 영사대에 놓음</p>}
          <div className="start-key">← → 선택 · Enter 읽기 · I 닫기</div>
        </section>
      )}
      {s.modal === "poster" && (
        <section className="dialog">
          <small>TRACES OF A CINEMA</small>
          <h2>{copy.prompts.poster}</h2>
          <p>{copy.poster}</p>
          <div className="start-key">{copy.confirm}</div>
        </section>
      )}
      {s.modal === "next" && (
        <section className="dialog complete">
          <small>MEMORY SYNC / 03 OF 03</small>
          <h2>To be continued</h2>
          <p>
            5F / STAGE
            <br />세 개의 기억이 다음 무대로 이어집니다.
          </p>
          <div className="start-key">Enter · 2F에서 다시 시작</div>
        </section>
      )}
    </div>
  );
}
