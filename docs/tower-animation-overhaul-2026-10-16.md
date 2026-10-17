# Tower Animation Overhaul — Implementation Matrix

Date: 2026-10-16  
Repository: `randypiggoat/lowpoly-zombie-defense`  
Tracking status: **Partially complete; automated and runtime verification are pending.**

This matrix describes the current implementation in source, the changes in this branch, and the work that remains. “Existing visual treatment” means geometry/material behavior already present in `TowerModel.tsx`; it does not mean that every upgrade was newly modeled in this branch. Do not read any row as visually complete until the game is run and inspected.

## Changes in this branch

- Added immutable animation profiles for each of the eight current `TowerKind` values in `src/game/towerAnimation.ts`. Idle cadence, amplitude, sway, anticipation, recoil strength, and signature movement differ by tower.
- Reworked the per-frame rig transforms in `src/components/game/TowerModel.tsx`. The simulation sets `tower.recoil = 1` on the shot frame. The new recoil curve is neutral at that value, so scale, aim-axis rotations, and weapon offsets stay at their authored launch transforms; the follow-through begins after launch and returns to rest quickly.
- Added cooldown-and-target-based pre-fire anticipation. It is attenuated by recoil so the model returns to the authored shot pose when the simulation launches a projectile.
- Shortened and synchronized procedural muzzle flashes to the simulation recoil pulse; added the missing Freezer muzzle flash at the configured muzzle position and aligned its nozzle end to that shot origin.
- Corrected the Rocket front ring and Laser focus ring orientation so those rings are perpendicular to their weapons’ forward axis.
- Passed the existing reduced-motion flag through `Scene.tsx` into the tower model. Idle movement and signature pulses are attenuated, and the selected-tower range pulse is removed, when reduced motion is enabled.
- Added precision-path and squad-path hardware for Rifleman upgrades; the visible state is still driven from the current `tower.a` and `tower.b` values.
- Added pure unit tests for profile coverage/variation, recoil at launch, recoil recovery, and pre-fire anticipation.

## Shared implementation / validation constraints

The engine computes the projectile’s horizontal origin from `getTowerMuzzleOffset(kind, shotIndex, volleySize)`, `tower.aim`, and the current level scale. The model’s authored weapon muzzle coordinates match those offsets for the current procedural rigs. The recoil curve now avoids adding model translation, rotation, or scale at the exact launch value `recoil = 1`. The Freezer muzzle was moved to the end of its nozzle, whose configured forward offset is `0.55`.

The game still uses the existing outer aiming group in `Scene.tsx`, so yaw rotates the full `TowerModel` rather than a newly separated base/turret hierarchy. This branch does **not** claim a new articulated base/turret rig, bespoke animation states for every individual upgrade tier, new tower-specific sound assets, or verified sustained-flame visuals. Those remain follow-up work.

### Tower-by-tower implementation matrix

All eight current towers use the new tower-specific profile during real gameplay through `TowerModel`, not through a standalone showcase. All eight remain **Partially complete** pending automated checks and visual inspection.

| Tower / role | Animation and model treatment in this branch | Existing upgrade-dependent visual treatment | Shot presentation / alignment | Status |
|---|---|---|---|---|
| **Rifleman** — quick, steady shots; baseline roster tower | Crisp, faster idle cadence; modest weapon kick; recoil settles after the launch frame. Added path A receiver hardware at A2 and a forward-axis muzzle collar at A3; added a squad radio pack at B2, antenna at B3, and beacon at B4. | Existing optic and final-tier collar; B1/B4 add twin/triple gun geometry; shared A/B modules scale with the actual tiers. | Single, dual, and triple muzzle positions align with the configured local barrel set at the launch pose. Existing coordinated-fire sound selection is unchanged. | **Partially complete** |
| **Shotgunner** — close-range crowd blast | Slower, heavier body/weapon kick and a clearly weighted follow-through; anticipation settles before launch. | Existing wide-choke muzzle fitting; A2 changes to dual barrels; B2 adds a front plate; shared A/B hardware changes with tier. | Primary and secondary flash meshes follow the actual recoil pulse; dual muzzles use the configured left/right offsets. | **Partially complete** |
| **Sniper** — long-range, high-damage shots | Slow, controlled idle cadence; restrained precision recoil and pre-shot lift. | Existing rail/sight hardware, late A-path crown, B-path attachment, and late B-path beacon; shared A/B modules change per tier. | Long muzzle position is derived from the weapon group plus the local muzzle offset; launch-frame transforms are neutral. | **Partially complete** |
| **Tesla** — chain lightning | Distinctive faster coil signature spin and a lighter body discharge reaction; no conventional projectile muzzle flash is assumed. | Existing A-tier coil rings accumulate and B2 adds side braces; shared A/B modules change per tier. | Chain attacks use their existing center-origin combat behavior and existing impact/VFX system; no gameplay rule changed. | **Partially complete** |
| **Flamethrower** — crowd burn over time | Purposeful pre-fire movement and a medium kick suited to its fast cadence; weapon-group muzzle flash begins from its authored nozzle point. | Existing A2 fuel hardware and B3 nozzle/heat ring; shared A/B modules change per tier. | Model muzzle is at the weapon-group forward offset used by the engine. This branch does not claim a newly implemented sustained flame animation or new fire audio. | **Partially complete** |
| **Freezer** — chill and slow clustered zombies | Distinct, slower crystal cadence and a restrained body response; reduced-motion attenuates the pulsing presentation. | Existing A2 crystal and B2 ice attachment; shared A/B modules change per tier. | Moved the nozzle cylinder backward so its front ends at forward offset 0.55, and added a short ice flash at that configured origin. Runtime visual proof is still pending. | **Partially complete** |
| **Rocket** — heavy explosive crowd damage | Slow anticipation and the strongest weapon/body recoil profile; follow-through starts after projectile launch. | Existing A2 side launcher and B3 signal beacon; shared A/B modules change per tier. | The launcher’s flash ring now faces along the weapon’s forward axis. Projectile speed, damage, splash, and target behavior are unchanged. | **Partially complete** |
| **Laser** — focused energy damage | Steady idle movement, restrained recoil, and a short pre-fire pose; signature/core movement respects reduced motion. | Existing A3 focus crystal and B2 relay ring; shared A/B modules change per tier. | Focus ring now lies perpendicular to the forward axis; muzzle and projectile gameplay calculations are unchanged. | **Partially complete** |

## Upgrade tier register

The upgrade names and effects below are summarized from `src/game/towerUpgradeDesign.ts`. The **existing visual treatment** column documents what the current model source renders; the animation change is the tower’s new profile and shot-synchronized recoil unless otherwise specified. The current tier changes still drive from the real `a`/`b` state. Every row remains pending runtime and automated verification.

### Rifleman — Precision Fire (A)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| A1 — Scout Optic | Longer sightline and 30% more damage against targets at 6+ tiles. | Existing optic and A-path hardware. | Pending |
| A2 — Hardpoint Rounds | Increases hit damage. | Shared A module grows; this branch adds a receiver/ammunition block. | Pending |
| A3 — Piercing Round | Hits can chain to one nearby target. | Shared A module grows; this branch adds a muzzle collar aligned to the barrel axis. | Pending |
| A4 — Deadeye | Adds a heavy finishing hit against badly wounded targets. | Existing late-tier muzzle accent and the largest A-path module. | Pending |

### Rifleman — Squad Doctrine (B)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| B1 — Twin Guns | Fires a two-gun volley and marks targets for bonus allied damage. | Existing second barrel/muzzle and B-path attachment. | Pending |
| B2 — Long Calls | Keeps target marks active longer. | This branch adds a squad radio pack and antenna base. | Pending |
| B3 — Squad Drill | Nearby Riflemen gain non-stacking damage and range bonuses. | Existing ground-radius visualization; this branch extends the radio antenna. | Pending |
| B4 — Overwatch Network | Adds a three-gun volley, stronger marks, and improved nearby Rifleman bonuses. | Existing third barrel/muzzle and squad radius; this branch adds a beacon. | Pending |

### Shotgunner — Riot (A)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| A1 — Wide Choke | Widens impact and improves damage against runners and swarms. | Existing forward choke fitting; A-path module scales with tier. | Pending |
| A2 — Buckshot | Adds a second close-range shell. | Existing model switches to two barrels and displays the second flash. | Pending |
| A3 — Dragon Breath | Ignites targets; burning targets take extra shotgun damage. | Existing shared A-path hardware changes; no new bespoke flame mesh or sound was added here. | Pending |
| A4 — Riot Storm | Deals substantially more damage when a blast catches a group. | Existing shared A-path hardware at the final tier. | Pending |

### Shotgunner — Breach Control (B)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| B1 — Concussive Buck | Briefly slows close-range targets. | Existing B-path attachment begins to grow with tier. | Pending |
| B2 — Suppression Buck | Applies a stronger slow. | Existing front plate appears at B2. | Pending |
| B3 — Exposed Guard | Marks targets for bonus damage from all towers. | Existing shared B-path attachment grows; no new separate mark animation was added here. | Pending |
| B4 — Breach Shockwave | Widens the slowing blast and relays marked-kill calls. | Existing final-tier B-path hardware treatment. | Pending |

### Sniper — Overwatch (A)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| A1 — Longwatch | Extends range and rewards shots at distant targets. | Existing sight/rail attachment. | Pending |
| A2 — Heavy Caliber | Hits harder, especially against elites and bosses. | Shared A-path hardware grows; no new caliber animation was added here. | Pending |
| A3 — Wall-Piercer | Allows a shot to chain to a nearby target. | Shared A-path hardware grows. | Pending |
| A4 — God's Eye | Adds a devastating finishing hit against badly wounded targets. | Existing late-tier crown and enlarged A-path hardware. | Pending |

### Sniper — Spotter Network (B)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| B1 — Spotter Scope | Marks a priority target so allied towers deal bonus damage. | Existing B-path spotting attachment. | Pending |
| B2 — Radio Relay | Keeps target calls active longer. | Shared B-path hardware grows. | Pending |
| B3 — Priority Broadcast | Spreads target calls after a marked target falls. | Shared B-path hardware grows. | Pending |
| B4 — Kill Order | Extends elite marks and spreads them across a wider group. | Existing late-tier beacon and enlarged B-path hardware. | Pending |

### Tesla — Chain Coil (A)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| A1 — Extra Arc | Adds a chain target and increases damage through successive jumps. | Existing first coil ring; profile gives Tesla its distinctive coil spin. | Pending |
| A2 — Conductors | Expands the area reached by arcs. | Existing second coil ring and larger A-path module. | Pending |
| A3 — Storm Net | Adds more chain targets. | Existing third coil ring and larger A-path module. | Pending |
| A4 — Tempest | Expands chaining and strengthens jumps. | Existing full coil-ring set and final-tier A-path module. | Pending |

### Tesla — Grid Control (B)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| B1 — Static Lock | Briefly stuns targets struck by electrical chains. | Existing B-path hardware begins to grow. | Pending |
| B2 — Conductive Tags | Marks arc targets for bonus damage from allied towers. | Existing side braces appear at B2. | Pending |
| B3 — Arc Lockdown | Adds longer control and slowing pressure. | Shared B-path hardware grows. | Pending |
| B4 — Network Collapse | Extends stuns and spreads marks from defeated targets. | Existing final-tier B-path module; chain VFX remains in the current combat system. | Pending |

### Flamethrower — Inferno (A)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| A1 — Hot Fuel | Makes burns last longer. | Shared A-path hardware changes with tier. | Pending |
| A2 — Sticky Napalm | Extends burn and makes burning targets take extra flame damage. | Existing fuel hardware at A2. | Pending |
| A3 — Firestorm | Widens the attack against packed groups. | Shared A-path hardware grows. | Pending |
| A4 — Wildfire | Burning kills spread fire to nearby zombies. | Existing final-tier A-path hardware; no new propagation effect was added here. | Pending |

### Flamethrower — Firebreak (B)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| B1 — Wide Cone | Widens the attack and slows enemies along a bend. | Shared B-path hardware changes with tier. | Pending |
| B2 — Scald | Allows burning kills to spread flames. | Shared B-path hardware grows. | Pending |
| B3 — Heat Haze | Widens the stream and extends slow exposure. | Existing B3 heat/nozzle ring. | Pending |
| B4 — Wildfire Relay | Spreads burning-kill fire across a wider pocket. | Existing final-tier B-path hardware; no new network animation was added here. | Pending |

### Freezer — Shatter (A)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| A1 — Ice Shards | Adds bonus damage against slowed targets. | Shared A-path hardware changes with tier. | Pending |
| A2 — Frostbite | Enables devastating critical hits against brittle targets. | Existing A2 crystal. | Pending |
| A3 — Brittle Bones | Greatly increases shatter damage against slowed targets. | Shared A-path hardware grows. | Pending |
| A4 — Shatterstorm | Increases brittle-target damage and widens the impact. | Existing final-tier A-path hardware. | Pending |

### Freezer — Cold Front (B)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| B1 — Chill Mist | Widens the slow field and marks exposed enemies. | Shared B-path hardware changes with tier. | Pending |
| B2 — Wide Nozzle | Increases reach and keeps enemies marked. | Existing B2 ice/nozzle attachment; this branch aligns the main nozzle front with forward offset 0.55 and adds its flash. | Pending |
| B3 — Cryo Core | Strengthens the chill pulse and slows enemies. | Shared B-path hardware grows. | Pending |
| B4 — Absolute Zero | Adds a wide chill/mark effect and relays marks on kills. | Existing final-tier B-path hardware. | Pending |

### Rocket — Siege Artillery (A)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| A1 — Long Gun | Extends range and rewards distant-target hits. | Shared A-path hardware changes with tier. | Pending |
| A2 — Demolition Charge | Increases direct-impact damage. | Existing A2 side launcher. | Pending |
| A3 — Cluster Shot | Strengthens wide blasts against groups. | Shared A-path hardware grows. | Pending |
| A4 — Bombardier | Strengthens large shells against long sightlines and bends. | Existing final-tier A-path hardware. | Pending |

### Rocket — Tactical Barrage (B)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| B1 — Tar Shells | Slows targets in explosion areas. | Shared B-path hardware changes with tier. | Pending |
| B2 — Concussion Warhead | Applies a stronger shockwave slow. | Shared B-path hardware grows. | Pending |
| B3 — Signal Flare | Marks targets for bonus damage from all towers. | Existing B3 signal beacon. | Pending |
| B4 — Suppressing Salvo | Adds broad slow fields and relays target calls. | Existing final-tier B-path hardware; launcher ring orientation was corrected in this branch. | Pending |

### Laser — Focus Array (A)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| A1 — Tight Beam | Increases focused-hit damage. | Shared A-path hardware changes with tier. | Pending |
| A2 — Prism Lens | Refines the weapon for stronger contact damage. | Shared A-path hardware grows. | Pending |
| A3 — Fusion Core | Increases range/damage against elite targets. | Existing A3 focus crystal. | Pending |
| A4 — Deathray | Adds a devastating finishing hit against low-health enemies. | Existing final-tier A-path hardware. | Pending |

### Laser — Prism Relay (B)

| Tier / upgrade | Existing gameplay effect | Existing visual treatment / branch delta | Verification |
|---|---|---|---|
| B1 — Beam Splitter | Chains hits and tags targets. | Shared B-path hardware changes with tier. | Pending |
| B2 — Refraction | Reaches more targets and lengthens marks. | Existing B2 focus ring; this branch aligns the ring perpendicular to the weapon axis. | Pending |
| B3 — Thermal Bloom | Ignites targets and adds extra damage against burning targets. | Shared B-path hardware grows. | Pending |
| B4 — Starfall Relay | Chains marks and spreads target calls after a marked kill. | Existing final-tier B-path hardware. | Pending |

## Required verification before marking any tower complete

- [ ] `bun run lint`
- [ ] `bun run test:unit`
- [ ] `bunx tsc --noEmit`
- [ ] `bun run build`
- [ ] `bun run test:e2e` (Playwright)
- [ ] Inspect all eight tower models in the live game at base state and after each path’s meaningful upgrade tiers.
- [ ] Verify idle, target tracking, actual shot frame, muzzle/projectile alignment, recovery, and upgrade state for each tower.
- [ ] Inspect a crowded multi-tower scene for performance, visual clutter, and transform jitter.
- [ ] Run a physical iOS/Android device check before claiming device performance.

This environment could not run the repository checks: the local container has no Bun executable and cannot resolve GitHub for a clone. The GitHub checks endpoint also returned no workflow runs for this branch when queried. These are blockers to verification, not passing results. No physical-device testing was performed.
