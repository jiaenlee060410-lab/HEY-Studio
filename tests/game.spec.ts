import { test, expect, type Page } from "@playwright/test";
async function state(page: Page) {
  return page.evaluate(() => {
    const s = (window as any).__recall.game.getState();
    return {
      ready: s.ready,
      target: s.target,
      modal: s.modal,
      ticket: s.ticketCollected,
      seat: s.seatClueRead,
      key: s.cinemaKeyCollected,
      dream: s.dreamKeyCollected,
      crouched: s.crouched,
      revealed: s.dreamRevealed,
      done: s.floor2Completed,
    };
  });
}
async function aim(
  page: Page,
  p: [number, number],
  target: [number, number, number],
) {
  await page.evaluate((p) => (window as any).__recall.teleport(...p), p);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await page.waitForFunction(() => {
    const d = (window as any).__recall,
      s = d.game.getState();
    return (
      s.crouched === d.input.crouched &&
      Math.abs(
        d.camera().position[1] - d.position().y - (s.crouched ? 0.33 : 0.8),
      ) < 0.012
    );
  });
  await page.evaluate(
    (target) => (window as any).__recall.aim(...target),
    target,
  );
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}
async function confirm(page: Page) {
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
}
test("full keyboard journey, one-metre raycast, crouch, collision and fresh restart", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/?test=1");
  await page.waitForFunction(
    () => !!(window as any).__recall?.game.getState().ready,
    { timeout: 60000 },
  );
  await page.screenshot({ path: "test-results/entrance.png" });
  await confirm(page);
  await expect.poll(async () => (await state(page)).modal).toBe(null);
  await aim(page, [-6, 14.9], [-6, 0.08, 14.5]);
  await expect.poll(async () => (await state(page)).target).toBe(null);
  await page.keyboard.down("ShiftLeft");
  await expect.poll(async () => (await state(page)).crouched).toBe(true);
  await aim(page, [-6, 14.9], [-6, 0.08, 14.5]);
  await expect.poll(async () => (await state(page)).target).toBe("ticket");
  await confirm(page);
  await expect.poll(async () => (await state(page)).modal).toBe("ticket");
  expect(await page.evaluate(() => document.pointerLockElement === null)).toBe(
    true,
  );
  await page.screenshot({ path: "test-results/ticket.png" });
  await confirm(page);
  await page.keyboard.up("ShiftLeft");
  await expect.poll(async () => (await state(page)).ticket).toBe(true);
  await aim(page, [-4, 0.3], [-4, 0.69, 2.05]);
  await expect.poll(async () => (await state(page)).target).toBe(null);
  await aim(page, [-4, 1.18], [-4, 0.69, 2.05]);
  await page.keyboard.down("ShiftLeft");
  await aim(page, [-4, 1.18], [-4, 0.69, 2.05]);
  await expect.poll(async () => (await state(page)).target).toBe("seat");
  await confirm(page);
  await confirm(page);
  await page.keyboard.up("ShiftLeft");
  expect((await state(page)).seat).toBe(true);
  await aim(page, [8.2, -16.8], [8.2, 0.22, -17.4]);
  await page.keyboard.down("ShiftLeft");
  await aim(page, [8.2, -16.8], [8.2, 0.22, -17.4]);
  await expect.poll(async () => (await state(page)).target).toBe("box");
  await confirm(page);
  expect((await state(page)).modal).toBe("map");
  await page.screenshot({ path: "test-results/map.png" });
  await confirm(page);
  await page.keyboard.up("ShiftLeft");
  await aim(page, [-6, -7.1], [-6, 1.35, -6.31]);
  await expect.poll(async () => (await state(page)).target).toBe("symbol");
  await confirm(page);
  expect((await state(page)).revealed).toBe(true);
  await page.waitForTimeout(350);
  await expect.poll(async () => (await state(page)).target).toBe("dream");
  await confirm(page);
  expect((await state(page)).dream).toBe(true);
  await aim(page, [5.5, -18.9], [5.5, 1.35, -19.65]);
  await expect.poll(async () => (await state(page)).target).toBe("exit");
  await confirm(page);
  expect((await state(page)).done).toBe(true);
  await page.screenshot({ path: "test-results/complete.png" });
  await page.reload();
  await page.waitForFunction(
    () => !!(window as any).__recall?.game.getState().ready,
  );
  expect((await state(page)).ticket).toBe(false);
  expect((await state(page)).dream).toBe(false);
  await confirm(page);
  // Run directly into a seat and wall using the actual capsule controller.
  await aim(page, [-4, 6.4], [-4, 1.65, 4]);
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(1800);
  await page.keyboard.up("KeyW");
  const chair = await page.evaluate(() => (window as any).__recall.position());
  expect(chair.z).toBeGreaterThan(5.7);
  expect(chair.z).toBeLessThan(6.2);
  await aim(page, [8, 10], [8, 1.65, 4]);
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(1500);
  await page.keyboard.up("KeyW");
  const wall = await page.evaluate(() => (window as any).__recall.position());
  expect(wall.z).toBeGreaterThan(8.5);
  expect(wall.z).toBeLessThan(9.6);
  await page.screenshot({ path: "test-results/hall.png" });
  expect(errors).toEqual([]);
});

test('capsule blocks counters, pillars and map boundary; repeated crouch keeps feet above floor', async ({page})=>{
  await page.goto('/?test=1');
  await page.waitForFunction(()=>!!(window as any).__recall?.game.getState().ready);
  await confirm(page);
  for(const check of [
    {p:[-6,17] as [number,number], look:[-6,1.65,14] as [number,number,number], min:16.45,max:16.9},
    {p:[6.2,12.5] as [number,number], look:[6.2,1.65,9] as [number,number,number],min:11.67,max:12.3},
  ]){
    await aim(page,check.p,check.look);await page.keyboard.down('KeyW');await page.waitForTimeout(1500);await page.keyboard.up('KeyW');
    const p=await page.evaluate(()=>(window as any).__recall.position());expect(p.z).toBeGreaterThan(check.min);expect(p.z).toBeLessThan(check.max);
  }
  await aim(page,[9,13],[11,1.65,13]);await page.keyboard.down('KeyW');await page.waitForTimeout(1500);await page.keyboard.up('KeyW');
  const edge=await page.evaluate(()=>(window as any).__recall.position());expect(edge.x).toBeLessThan(9.55);expect(edge.x).toBeGreaterThan(9.2);
  for(let i=0;i<3;i++){
    await page.keyboard.down('ShiftLeft');await expect.poll(async()=>(await state(page)).crouched).toBe(true);
    expect((await page.evaluate(()=>(window as any).__recall.position())).y).toBeGreaterThan(.425);
    await page.keyboard.up('ShiftLeft');await expect.poll(async()=>(await state(page)).crouched).toBe(false);
    expect((await page.evaluate(()=>(window as any).__recall.position())).y).toBeGreaterThan(.845);
  }
  await aim(page,[-7,6.4],[0,1.5,-2]);await page.screenshot({path:'test-results/cinema-overview.png'});
});
