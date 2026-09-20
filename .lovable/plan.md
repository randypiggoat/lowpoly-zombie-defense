# Distinct zombie and tower silhouettes

## Scope
Update only `src/components/game/Scene.tsx`, preserving all simulation, balance, controls, HUD, progression, and architecture.

## Existing types found
- Zombies: walker/basic (`kind 0`), runner/fast (`kind 1`), brute/tank (`kind 2`).
- Towers: Rifleman, Shotgunner, Sniper, Tesla, Flamethrower, Freezer, Rocket, Laser.

## Changes
- Replace the shared zombie mesh with three lightweight low-poly model variants selected from each zombie's existing `kind`:
  - Basic: green, balanced humanoid proportions.
  - Fast: yellow/orange, shorter, narrow torso and limbs, forward-leaning silhouette.
  - Tank: dark red, taller, wide armored torso, thick limbs and shoulders.
- Keep the existing pooled animation, movement, ragdoll, damage flash, visibility, and scaling behavior intact.
- Give all eight towers stronger type-specific silhouettes using only simple primitive geometry:
  - Rifleman: compact single rifle.
  - Shotgunner: broad twin barrels.
  - Sniper: narrow body and extra-long barrel.
  - Tesla: raised glowing coil/orb.
  - Flamethrower: wide nozzle with side fuel tanks.
  - Freezer: chunky cyan cryo nozzle and canister.
  - Rocket: twin elevated launch pods.
  - Laser: angular emitter with a bright lens.
- Preserve current accent colors, level height, recoil, aim rotation, selection range, path pips, and click targets.

## Verification
- Confirm the project builds cleanly.
- Open gameplay at the current iPhone viewport, place available towers, and visually verify readable silhouettes.
- Verify the three zombie variants render distinctly while retaining movement, damage flashing, and combat behavior.
