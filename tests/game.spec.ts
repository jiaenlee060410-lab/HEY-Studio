import { test, expect, type Page } from "@playwright/test";
const state = (page: Page) =>
  page.evaluate(() => {
    const s = (window as any).__recall.game.getState();
    return {
      ...s,
      set: undefined,
      resetGame: undefined,
      interact: undefined,
      confirm: undefined,
      tickProjection: undefined,
      passwordKey: undefined,
      cancelPassword: undefined,
    };
  });
const position = (page: Page) =>
  page.evaluate(() => (window as any).__recall.position());
async function confirm(page: Page) {
  await page.keyboard.press("Enter");
  await page.waitForTimeout(220);
}
async function advancePhysics(page: Page, count = 90) {
  const start = await page.evaluate(
    () => (window as any).__recall.metrics().steps,
  );
  await page.waitForFunction(
    ({ start, count }) =>
      (window as any).__recall.metrics().steps >= start + count,
    { start, count },
    { timeout: 45000 },
  );
}
async function start(page: Page) {
  await page.goto("/?test=1");
  await page.waitForFunction(
    () => !!(window as any).__recall?.game.getState().ready,
    undefined,
    { timeout: 90000 },
  );
  await confirm(page);
  await expect.poll(async () => (await state(page)).modal).toBe(null);
}
async function password(page: Page, digits: string) {
  for (const digit of digits) await page.keyboard.press("Digit" + digit);
  await confirm(page);
  await expect.poll(async () => (await state(page)).modal).toBe("lockSuccess");
  await confirm(page);
}
async function filmLock(page: Page, arrows = false) {
  await interact(page, [2.4, -0.65, 14], [1.05, 15.46, -0.65], "filmLock");
  expect((await state(page)).modal).toBe("filmNote");
  await expect(page.locator("blockquote")).toContainText("흩어진 세 개의 기억");
  await confirm(page);
  expect((await state(page)).modal).toBe("password");
  if (arrows) {
    for (const code of [
      "ArrowUp",
      "ArrowUp",
      "ArrowUp",
      "Enter",
      "ArrowLeft",
      "ArrowLeft",
      "Enter",
      "ArrowDown",
      "Enter",
      "ArrowUp",
      "Enter",
    ])
      await page.keyboard.press(code);
    expect((await state(page)).password).toBe("3141");
    await confirm(page);
    expect((await state(page)).modal).toBe("lockSuccess");
    await confirm(page);
  } else await password(page, "3141");
  await advancePhysics(page, 120);
}
async function aim(
  page: Page,
  p: [number, number, number],
  target: [number, number, number],
) {
  await page.evaluate((p) => (window as any).__recall.teleport(...p), p);
  await page.waitForTimeout(200);
  await page.waitForFunction(
    () => {
      const d = (window as any).__recall,
        s = d.game.getState();
      return (
        s.crouched === d.input.crouched &&
        Math.abs(
          d.camera().position[1] - d.position().y - (s.crouched ? 0.33 : 0.8),
        ) < 0.015
      );
    },
    undefined,
    { timeout: 15000 },
  );
  await page.evaluate((t) => (window as any).__recall.aim(...t), target);
}
async function interact(
  page: Page,
  p: [number, number, number],
  t: [number, number, number],
  id: string,
  crouch = false,
) {
  if (crouch) await page.keyboard.down("ShiftLeft");
  else await page.keyboard.up("ShiftLeft");
  await aim(page, p, t);
  console.log("Investigating", id);
  try {
    await expect.poll(async () => (await state(page)).target).toBe(id);
  } catch (e) {
    console.log(
      "Ray failure",
      await page.evaluate(() => {
        const d = (window as any).__recall;
        return {
          p: d.position(),
          camera: d.camera(),
          metrics: d.metrics(),
          crouch: d.game.getState().crouched,
          modal: d.game.getState().modal,
        };
      }),
    );
    throw e;
  }
  await confirm(page);
  await page.keyboard.up("ShiftLeft");
}
async function walkTo(
  page: Page,
  target: [number, number, number],
  axis: "x" | "z",
  value: number,
  direction: 1 | -1,
) {
  console.log("Walking", target, "until", axis, value);
  await page.evaluate((t) => (window as any).__recall.aim(...t), target);
  await page.keyboard.down("KeyW");
  try {
    await page.waitForFunction(
      ({ axis, value, direction }) => {
        const p = (window as any).__recall.position();
        return direction > 0 ? p[axis] >= value : p[axis] <= value;
      },
      { axis, value, direction },
      { timeout: 90000 },
    );
  } catch (e) {
    console.log(
      "Walk failure",
      await position(page),
      await page.evaluate(() => (window as any).__recall.metrics()),
    );
    throw e;
  } finally {
    await page.keyboard.up("KeyW");
  }
}
test("complete 2F → physical stairs → 3F photo → physical stairs → 4F original projection and consumed keys", async ({
  page,
}) => {
  test.setTimeout(600000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await start(page);
  // Unkeyed exit cannot be opened and physical door prevents passage.
  await interact(page, [5.5, -18.7, 0], [5.5, 1.5, -20], "exit2");
  expect((await state(page)).exit2Open).toBe(false);
  await page.keyboard.down("KeyW");
  await advancePhysics(page);
  await page.keyboard.up("KeyW");
  expect((await position(page)).z).toBeGreaterThan(-19.7);
  expect((await position(page)).z).toBeLessThan(-19);
  await aim(page, [-6, 14.9, 0], [-6, 0.08, 14.5]);
  await expect.poll(async () => (await state(page)).target).toBe(null);
  await interact(page, [-6, 14.9, 0], [-6, 0.08, 14.5], "ticket", true);
  expect(await page.evaluate(() => document.pointerLockElement === null)).toBe(
    true,
  );
  await confirm(page);
  expect((await state(page)).hasTicket).toBe(true);
  // Beyond 2 m does not activate; within 2 m, crouching does.
  await page.keyboard.down("ShiftLeft");
  await aim(page, [-4, -0.6, 0], [-4, 0.69, 2.05]);
  await expect.poll(async () => (await state(page)).target).toBe(null);
  await interact(page, [-4, 1.15, 0], [-4, 0.69, 2.05], "seat", true);
  await confirm(page);
  expect((await state(page)).hasNumberNote).toBe(true);
  expect((await state(page)).hasKey1).toBe(false);
  await aim(page, [-7, 6.4, 0], [0, 1.5, -2]);
  await page.screenshot({ path: "test-results/cinema-v3.png" });
  await interact(page, [5.3, -11.2, 0], [5.3, 0.85, -12.32], "safe");
  await password(page, "197511");
  await advancePhysics(page, 120);
  await interact(page, [5.1, -11.4, 0], [5.1, 0.31, -12.9], "safeContents");
  await confirm(page);
  expect((await state(page)).hasKey1).toBe(true);
  await interact(page, [5.5, -18.7, 0], [5.5, 1.5, -20], "exit2");
  expect((await state(page)).hasKey1).toBe(false);
  // No teleport during either ascent: WASD drives every real tread and return gallery.
  await page.waitForTimeout(1300);
  await walkTo(page, [5.5, 1.65, -40], "z", -34.55, -1);
  expect((await position(page)).y).toBeGreaterThan(7.7);
  await page.screenshot({ path: "test-results/stairs-3f.png" });
  const topY = (await position(page)).y + 0.8;
  await walkTo(page, [0, topY, -34.55], "x", 1.5, -1);
  await walkTo(page, [1.5, topY, -15], "z", -21.35, 1);
  await page.evaluate(() => (window as any).__recall.aim(1.5, 8.5, -20));
  await expect.poll(async () => (await state(page)).target).toBe("entry3");
  await confirm(page);
  expect((await state(page)).entry3Open).toBe(true);
  await page.waitForTimeout(1100);
  await walkTo(page, [1.5, 8.65, -15], "z", -18.5, 1);
  expect((await state(page)).floor).toBe(3);
  expect((await state(page)).modal).toBe(null);
  await interact(page, [0, -2.75, 7], [0, 8.19, -4], "desk");
  await page.screenshot({ path: "test-results/scar-map.png" });
  await confirm(page);
  await interact(page, [-8, -10.9, 7], [-8, 7.08, -12], "fragment1", true);
  await confirm(page);
  await interact(page, [7.7, 1, 7], [7.7, 7.08, 0], "fragment2");
  await confirm(page);
  await interact(page, [-8.3, 15, 7], [-8.3, 8.16, 14], "fragment3");
  await confirm(page);
  expect((await state(page)).hasPhotoFragments).toEqual([true, true, true]);
  await interact(page, [0, -2.75, 7], [0, 8.19, -4], "desk");
  expect((await state(page)).modal).toBe("photo");
  await page.screenshot({ path: "test-results/restored-photo.png" });
  await confirm(page);
  expect((await state(page)).hasKey2).toBe(false);
  await page.waitForTimeout(1600);
  await interact(page, [0.65, -1.75, 7], [0.65, 7.8, -2.85], "key2");
  await aim(page, [3, -1, 7], [0, 8.2, -4]);
  await page.screenshot({ path: "test-results/scar-overview.png" });
  await interact(page, [-5.5, 18.7, 7], [-5.5, 8.5, 20], "exit3");
  expect((await state(page)).hasKey2).toBe(false);
  await page.waitForTimeout(1200);
  await walkTo(page, [-5.5, 8.65, 40], "z", 34.55, 1);
  expect((await position(page)).y).toBeGreaterThan(14.7);
  await walkTo(page, [0, 15.65, 34.55], "x", -1.5, 1);
  await walkTo(page, [-1.5, 15.65, 15], "z", 21.35, -1);
  await page.evaluate(() => (window as any).__recall.aim(-1.5, 15.5, 20));
  await expect.poll(async () => (await state(page)).target).toBe("entry4");
  await confirm(page);
  await page.waitForTimeout(1100);
  await walkTo(page, [-1.5, 15.65, 15], "z", 18.5, -1);
  expect((await state(page)).floor).toBe(4);
  await interact(page, [0, 1.45, 14], [0, 15.22, 0], "projector");
  expect((await state(page)).ticketPlaced).toBe(true);
  expect((await state(page)).projectorStarted).toBe(false);
  await expect.poll(async () => (await state(page)).target).toBe("projector");
  await confirm(page);
  expect((await state(page)).photoPlaced).toBe(true);
  expect((await state(page)).hasKey3).toBe(false);
  await aim(page, [0, -3, 14], [0, 17.15, -14]);
  await expect
    .poll(async () => (await state(page)).projectionFinished, {
      timeout: 40000,
    })
    .toBe(true);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/dream-projection.png" });
  await aim(page, [-5, 2, 14], [-12, 17.6, 0]);
  await page.screenshot({ path: "test-results/dream-aurora.png" });
  const image = await page.request.get("/assets/memora-poster.png");
  expect(image.status()).toBe(200);
  expect((await state(page)).filmUnlocked).toBe(false);
  await filmLock(page);
  await interact(page, [2.4, -0.65, 14], [1.05, 15.3, -0.65], "key3");
  await interact(page, [5.5, -18.7, 14], [5.5, 15.5, -20], "exit4");
  expect((await state(page)).hasKey3).toBe(false);
  expect((await state(page)).completed).toBe(false);
  await page.waitForTimeout(1200);
  await page.evaluate(() => (window as any).__recall.aim(5.5, 15.65, -23));
  await page.keyboard.down("KeyW");
  try {
    await expect.poll(async () => (await state(page)).modal).toBe("next");
  } finally {
    await page.keyboard.up("KeyW");
  }
  expect((await position(page)).z).toBeLessThan(-20.65);
  await page.screenshot({ path: "test-results/continued.png" });
  // Replay resets all keys, placed items, lids, drawer and spawn; page refresh also resets.
  await confirm(page);
  expect((await state(page)).modal).toBe("welcome");
  expect((await state(page)).hasMap).toBe(false);
  expect((await position(page)).y).toBeLessThan(1);
  await page.reload();
  await page.waitForFunction(
    () => !!(window as any).__recall?.game.getState().ready,
  );
  expect((await state(page)).key1Found).toBe(false);
  expect((await state(page)).projectionFinished).toBe(false);
  expect(errors).toEqual([]);
});
test("4F focus: original poster, real-time projection, shallow tray and final threshold", async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => {
    (window as any).__recall.game.getState().set({
      hasTicket: true,
      hasTicket2: true,
      hasNumberNote: true,
      safeUnlocked: true,
      hasRestoredPhoto: true,
      key1Found: true,
      key2Found: true,
      exit2Open: true,
      exit3Open: true,
      hasMap: true,
      hasPhotoFragments: [true, true, true],
      drawerOpen: true,
    });
  });
  await interact(page, [0, 1.45, 14], [0, 15.22, 0], "projector");
  await expect.poll(async () => (await state(page)).target).toBe("projector");
  await confirm(page);
  await aim(page, [0, -3, 14], [0, 17.15, -14]);
  await expect
    .poll(async () => (await state(page)).projectionFinished, {
      timeout: 40000,
    })
    .toBe(true);
  await advancePhysics(page, 120);
  expect((await state(page)).filmUnlocked).toBe(false);
  await filmLock(page, true);
  await interact(page, [2.4, -0.65, 14], [1.05, 15.3, -0.65], "key3");
  expect((await state(page)).hasKey3).toBe(true);
  await page.screenshot({ path: "test-results/dream-key.png" });
  await interact(page, [5.5, -18.7, 14], [5.5, 15.5, -20], "exit4");
  await advancePhysics(page, 120);
  await page.evaluate(() => (window as any).__recall.aim(5.5, 15.65, -23));
  await page.keyboard.down("KeyW");
  try {
    await expect.poll(async () => (await state(page)).modal).toBe("next");
  } finally {
    await page.keyboard.up("KeyW");
  }
  expect((await position(page)).z).toBeLessThan(-20.65);
  await confirm(page);
  await expect.poll(async () => (await position(page)).y).toBeLessThan(1);
  expect((await state(page)).projectionFinished).toBe(false);
  expect((await state(page)).filmUnlocked).toBe(false);
});
test("2F safe: numeric keyboard, wrong code, mouse disabled, pause movement, cancel, loot and reset", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await start(page);
  await interact(page, [5.3, -11.2, 0], [5.3, 0.85, -12.32], "safe");
  expect((await state(page)).modal).toBe("password");
  expect(await page.evaluate(() => document.pointerLockElement === null)).toBe(
    true,
  );
  const p = await position(page);
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(300);
  await page.keyboard.up("KeyW");
  expect(await position(page)).toEqual(p);
  const key = page.getByRole("gridcell").filter({ hasText: /^1$/ });
  const rect = await key.boundingBox();
  await page.mouse.click(rect!.x + 5, rect!.y + 5);
  expect((await state(page)).password).toBe("");
  for (const digit of "111111") await page.keyboard.press("Digit" + digit);
  await confirm(page);
  expect((await state(page)).safeUnlocked).toBe(false);
  expect((await state(page)).password).toBe("");
  await expect(page.locator(".lock-error")).toContainText("일치하지");
  await page.screenshot({ path: "test-results/safe-wrong-password.png" });
  await page.keyboard.press("Escape");
  await expect.poll(async () => (await state(page)).modal).toBe(null);
  await expect
    .poll(async () => page.evaluate(() => document.pointerLockElement !== null))
    .toBe(true);
  await interact(page, [5.3, -11.2, 0], [5.3, 0.85, -12.32], "safe");
  await page.keyboard.press("Digit8");
  await page.keyboard.press("Backspace");
  await password(page, "197511");
  expect((await state(page)).hasKey1).toBe(false);
  await advancePhysics(page, 120);
  await interact(page, [5.1, -11.4, 0], [5.1, 0.31, -12.9], "safeContents");
  expect((await state(page)).hasTicket2).toBe(true);
  await confirm(page);
  await page.screenshot({ path: "test-results/safe-open.png" });
  await page.reload();
  await page.waitForFunction(
    () => !!(window as any).__recall?.game.getState().ready,
  );
  expect((await state(page)).hasKey1).toBe(false);
  expect((await state(page)).safeUnlocked).toBe(false);
  expect((await state(page)).password).toBe("");
  expect(errors).toEqual([]);
});
test("capsule blocks seats, partition, counter, pillar, boundaries; inventory/blur/crouch recover", async ({
  page,
}) => {
  await start(page);
  await page.waitForFunction(() => document.pointerLockElement !== null);
  // Establish the headless pointer's previous position before relative movement.
  await page.mouse.move(380, 240);
  const before = await page.evaluate(
    () => (window as any).__recall.camera().direction,
  );
  await page.mouse.move(240, 160, { steps: 8 });
  await expect
    .poll(async () =>
      page.evaluate((previous) => {
        const direction = (window as any).__recall.camera().direction;
        return Math.hypot(
          ...direction.map((v: number, i: number) => v - previous[i]),
        );
      }, before),
    )
    .toBeGreaterThan(0.01);
  for (const check of [
    { p: [-4, 6.4, 0], look: [-4, 1.65, 4], min: 5.65, max: 6.2 },
    { p: [8, 10, 0], look: [8, 1.65, 4], min: 8.5, max: 9.6 },
    { p: [-6, 17, 0], look: [-6, 1.65, 14], min: 16.45, max: 16.9 },
    { p: [6.2, 12.5, 0], look: [6.2, 1.65, 9], min: 11.67, max: 12.3 },
  ]) {
    await aim(
      page,
      check.p as [number, number, number],
      check.look as [number, number, number],
    );
    await page.keyboard.down("KeyW");
    await advancePhysics(page);
    await page.keyboard.up("KeyW");
    const p = await position(page);
    expect(p.z).toBeGreaterThan(check.min);
    expect(p.z).toBeLessThan(check.max);
  }
  await aim(page, [9, 13, 0], [11, 1.65, 13]);
  await page.keyboard.down("KeyW");
  await advancePhysics(page);
  await page.keyboard.up("KeyW");
  const edge = await position(page);
  expect(edge.x).toBeLessThan(9.55);
  expect(edge.x).toBeGreaterThan(9.2);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.down("ShiftLeft");
    await expect.poll(async () => (await state(page)).crouched).toBe(true);
    expect((await position(page)).y).toBeGreaterThan(0.425);
    await page.keyboard.up("ShiftLeft");
    await expect.poll(async () => (await state(page)).crouched).toBe(false);
    expect((await position(page)).y).toBeGreaterThan(0.845);
  }
  await page.keyboard.press("KeyI");
  expect((await state(page)).modal).toBe("inventory");
  await page.keyboard.press("KeyI");
  await confirm(page);
  expect((await state(page)).modal).toBe(null);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  expect((await state(page)).modal).toBe("pause");
  await confirm(page);
  await aim(page, [-7, 6.4, 0], [0, 1.5, -2]);
  await page.screenshot({ path: "test-results/cinema-overview.png" });
});
test("V3 visual smoke: carpet render, compact film keypad fits and keyboard resumes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await start(page);
  await aim(page, [-7, 6.4, 0], [0, 1.5, -2]);
  await page.screenshot({ path: "test-results/v3-final-carpet.png" });
  await page.evaluate(() =>
    (window as any).__recall.game
      .getState()
      .set({ modal: "password", lockId: "film", hasFilmNote: true }),
  );
  await expect(page.locator(".lock-clue")).toContainText("흩어진 세 개의 기억");
  const controls = await page.locator(".lock-controls").boundingBox();
  const keypad = await page.locator(".keypad").boundingBox();
  expect(controls!.y + controls!.height).toBeLessThan(480);
  expect(keypad!.y).toBeGreaterThan(0);
  await page.screenshot({ path: "test-results/v3-compact-film-lock.png" });
  await page.keyboard.press("Escape");
  await expect
    .poll(async () => page.evaluate(() => document.pointerLockElement !== null))
    .toBe(true);
  expect((await state(page)).modal).toBe(null);
  expect(errors).toEqual([]);
});
