import { beforeAll, expect, it } from "vitest";
import R from "@dimforge/rapier3d-compat";
import { movementPhysics, nextVerticalSpeed } from "./physics";
beforeAll(async () => {
  await R.init();
});
it.each([-1, 1])(
  "capsule actually climbs all 40 risers, direction %s, without a hidden ramp",
  (direction) => {
    const world = new R.World({ x: 0, y: -9.81, z: 0 });
    world.createCollider(
      R.ColliderDesc.cuboid(1.2, 0.2, 1).setTranslation(0, -0.2, 0),
    );
    for (let i = 0; i < 40; i++) {
      const h = (i + 1) * 0.175;
      world.createCollider(
        R.ColliderDesc.cuboid(1.2, h / 2, 0.161).setTranslation(
          0,
          h / 2,
          direction * (1 + (i + 0.5) * 0.32),
        ),
      );
    }
    world.createCollider(
      R.ColliderDesc.cuboid(1.2, 0.15, 2).setTranslation(
        0,
        6.85,
        direction * 15.8,
      ),
    );
    const body = world.createRigidBody(
      R.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0.87, 0),
    );
    const capsule = world.createCollider(
        R.ColliderDesc.capsule(0.6, 0.25),
        body,
      ),
      controller = world.createCharacterController(0.015);
    controller.enableAutostep(
      movementPhysics.stepHeight,
      movementPhysics.stepWidth,
      true,
    );
    controller.enableSnapToGround(movementPhysics.snapDistance);
    world.step();
    let velocity = -0.6,
      maxY = 0;
    for (let i = 0; i < 500; i++) {
      velocity = nextVerticalSpeed(velocity, controller.computedGrounded());
      controller.computeColliderMovement(
        capsule,
        { x: 0, y: velocity / 60, z: (direction * 2.6) / 60 },
        R.QueryFilterFlags.EXCLUDE_SENSORS,
      );
      const p = body.translation(),
        d = controller.computedMovement();
      body.setNextKinematicTranslation({
        x: p.x + d.x,
        y: p.y + d.y,
        z: p.z + d.z,
      });
      world.step();
      expect(body.translation().y).toBeGreaterThan(0.82);
      maxY = Math.max(maxY, body.translation().y);
    }
    expect(body.translation().z * direction).toBeGreaterThan(14);
    expect(body.translation().y).toBeGreaterThan(7.8);
    expect(maxY).toBeLessThan(8.2);
    world.free();
  },
);
