# LOWPOLY ZOMBIE DEFENSE — Art Direction Bible

> **Purpose:** Living production specification for the existing React, TypeScript, React Three Fiber and Three.js game.
>
> **Audit baseline:** default branch source tree at commit 25d732e4ae780f8a06c6f607db68565ae360edb4. This document also records the follow-up code change on feat/art-direction-bible-zombie-identity.
>
> **Evidence boundary:** Source structure and configuration were inspected. No live browser screenshot or physical-device session was available during this pass. Apparent contrast on a real phone, frame rate, exact animation alignment in motion and visual correctness during a match remain **UNVERIFIED**. “Verified” below means source-verified unless runtime evidence is explicitly stated.

## Evidence and status vocabulary

- **IMPLEMENTED AND VERIFIED** — present in inspected source. This does not imply that the feature was visually observed in a running game.
- **PARTIALLY IMPLEMENTED** — source contains only part of the intended behavior, or integration/runtime behavior needs confirmation.
- **PROPOSED IMPROVEMENT** — target rule or candidate change, not a claim about the current code.
- **UNVERIFIED** — available evidence does not prove the behavior or live appearance.

## A. Current visual state

### Towers

**IMPLEMENTED AND VERIFIED (source):** The actual tower kinds are Rifleman, Shotgunner, Sniper, Tesla, Flamethrower, Freezer, Rocket and Laser. Their canonical list and combat identity/accent values live in src/game/engine.ts (TOWER_KINDS and TOWER_INFO). Hand-built low-poly geometry is in src/components/game/TowerModel.tsx; it uses Three.js primitives rather than an externally loaded model library.

| Tower | Source-visible model identity | Existing upgrade / motion hooks |
|---|---|---|
| Rifleman | Compact body and forward barrel | Additional barrels at path-B tiers; muzzle meshes; weapon-group recoil; path-A attachments |
| Shotgunner | Broad low chassis and chunky barrel geometry | Path A can change weapon geometry to paired barrels; muzzle flash has secondary barrel support |
| Sniper | Elevated receiver and long straight barrel with optic-like cylinder | Tier-gated scope/receiver attachments; weapon-group recoil |
| Tesla | Tall coil body with stacked rings and bright core | Signature rings rotate; core pulses |
| Flamethrower | Twin tank-like cylinders, central machinery and forward nozzle | Nozzle group recoil, warm muzzle shape and tier-gated attachments |
| Freezer | Wide circular base, faceted body and bright crystal-like parts | Signature group rotates; ice-colored upgrade hardware |
| Rocket | Heavy chassis, raised launch structure and barrel/warhead pieces | Aiming/recoil group and tier-gated hardware |
| Laser | Circular base, faceted emitter, coil ring and core | Emitter group recoil and coil/core illumination |

**Roster correction:** the supplied concept reference mentions “Mortar,” but TOWER_KINDS, TOWER_INFO and TowerModel contain **Rocket**, not Mortar. Do not document Mortar as implemented or rename Rocket in a visual polish pass. A Mortar tower would be a separate roster/gameplay feature.

**Existing strengths:** tower-specific silhouettes and accents exist; in-run upgrades use tower.a and tower.b; TowerMesh in Scene.tsx rotates toward tower.aim and snaps the aim at high recoil on the shot frame; recoil, muzzle visibility, rotating signatures and tier hardware are already represented. src/game/towerUpgradeDesign.ts defines two four-tier paths for each of the eight existing tower kinds.

**Current risks / opportunities:** models share a global base, two path-marker attachments and glow treatment, and their overall size increases modestly with level. This means some upgrade identity is expressed through universal markers instead of only the weapon that was specialized. Actual sightline overlap, target-camera readability and barrel-to-projectile alignment need visual review. Avoid adding meshes unless a silhouette or attack-read improvement is perceptible at gameplay scale.

### Enemies and bosses

**IMPLEMENTED AND VERIFIED (source):** src/game/enemyPresentation.ts maps enemy kinds 0–7 to Walker, Runner, Brute, Splitter, Bomber, Guardian, Healer and Swarm. src/components/game/Scene.tsx uses pooled groups with per-kind body/head geometry, generated face geometry, different proportions, role attachments, status markers, boss signatures, optional health bars and gore-part visibility. src/game/zombiePresentation.ts defines eight gait/silhouette profiles and deterministic model scales; boss scaling multiplies the archetype scale by 1.16.

**Existing strengths:** Runner uses a smaller, forward-leaning pose; Brute has larger/heavier proportions; Splitter has a core; Bomber has a pack; Guardian has a shield-like signature; Healer has an aura; Swarm is small and moves quickly. Bosses have aura/crown/core and archetype signature colors, with an enraged color change. The game uses simple faceted meshes and a fixed render pool rather than spawning a new React model for every zombie.

**Source issue fixed in this branch:** the original Scene renderer contained eight authored ZOMBIE_LOOKS palettes, but its kind-change path applied the equipped cosmetic palette to every enemy type. Because the default Outbreak skin matched Walker colors, default enemies lost their intended archetype color differences after initialization or pool reuse. The feature branch moves those exact eight palettes to src/game/zombiePresentation.ts as ZOMBIE_ARCHETYPE_PALETTES, and resolves them with zombiePaletteForKind. The default zombie-default cosmetic now retains the per-kind palette; non-default earned cosmetics such as Nightfall still intentionally recolor the roster. This code and regression test are written on the branch; test execution is not yet confirmed.

**Current risks / opportunities:** enemy bodies are built from relatively simple torso/limb primitives. Improve silhouette, posture, head/face and role attachments before adding clothing detail. Pooled model geometry, materials and scale/visibility restoration should be reviewed during live play.

### Projectiles and combat feedback

**IMPLEMENTED AND VERIFIED (source):**
- Scene.tsx uses shared per-kind projectile geometry: Rifleman icosahedron, Shotgunner octahedron, Sniper box, Tesla dodecahedron, Flamethrower tetrahedron, Freezer octahedron, Rocket cone and Laser box. Projectiles orient to their target and trails update in the same renderer; memoized geometries are disposed on cleanup.
- src/components/game/CombatVFX.tsx caps hit/kill/heal bursts at 24. Each pooled burst contains a ring, core and four sparks. Reduced-motion mode suppresses burst spawning.
- Scene.tsx defines caps of 60 zombie groups, 64 gibs and MAX_ACTIVE_BULLETS bullets; the engine defines MAX_ACTIVE_BULLETS as 64.
- Mark and stun indicators, boss-specific signatures, health bars for threatening enemies/bosses, hit/kill/heal bursts and a physical rotating gold coin reward are implemented in source.

**PARTIALLY IMPLEMENTED:** tower projectiles vary by geometry and accent color, but that alone does not prove every attack has a distinctive, readable flight/impact sequence in motion. A true continuous flame-stream effect was not confirmed in the inspected source; do not infer one just from the Flamethrower nozzle and projectile/trail setup.

**Current risks / opportunities:** preserve bounded pools and geometry reuse. Distinguish attack families with silhouette, motion, timing and duration in addition to hue. Live effect overlap during crowded waves remains UNVERIFIED.

### Maps, terrain and environmental props

**IMPLEMENTED AND VERIFIED (source):** src/game/maps.ts defines 20 map identities, path points/widths, base positions, bounds, build/tower clearance, obstacle/blocked-zone data and placement hints. src/game/stageEnvironments.ts defines 20 themed environments, authored props and landmarks. src/game/environmentVisuals.ts maps each environment to building, road and base styles, ambient prop kinds and a nine-token palette. Rendering comes through ThemedRoads.tsx, ThemedBuildings.tsx, ThemedBase.tsx, StageEnvironment.tsx and SpecialTerrain.tsx. src/game/stageThemes.ts supplies stage-specific sky/ground/path colors and lighting.

The environment set includes suburban, orchard, market, rail yard, river checkpoint, jungle ruins, mangrove, redwood, frozen lab, ice cavern, harbor, desert bazaar, redrock canyon, deep mine, military outpost, abandoned city, foundry, graveyard, volcano and blacksite. Landmark shapes include a market arcade, rail signal, frozen lab, ice cave, skyscraper, foundry furnace, cathedral, volcano crater and reactor.

**Existing strengths:** roads have separate surfaces, edges and markings; environments have distinct biome palettes and themed bases; special terrain can render broken ice from blocked-zone definitions. Small viewports receive fewer scenery props and a smaller shadow map.

**Current risks / opportunities:** primitive prop styles may read as generic boxes/cylinders in isolation. Upgrade a few high-salience landmark silhouettes/material groupings before increasing scenery density. Decorations are not placement truth: actual tower placement and collision/clearance rules are defined in maps.ts. Visual appearance alone does not prove an object blocks placement or range.

### Interface

**IMPLEMENTED AND VERIFIED (source):** src/components/game/HUD.tsx includes a base-lives bar, animated counters, progression and tower-path panels. src/components/game/GameCanvas.tsx composes the Canvas, HUD and navigation/screen UI. src/styles.css defines a unified Rotwood interface system with dark layered surfaces, muted text, gold emphasis, danger tokens, a life display with critical/impact states and responsive sizing. Playwright specs exist for UI foundation, navigation, core loop and visual smoke.

**Current risks / opportunities:** touch-target comfort, selected-range visibility against every biome, text clipping and the balance between HUD and 3D play area require live mobile review. Source presence is not visual proof.

### Rendering and performance baseline

- src/game/renderQuality.ts chooses shadow map 512 and 22 scenery props for viewport widths below 700; 768 and 30 for widths below 1100; 768 and 38 at 1100 or wider. These are current source settings, not invented budgets.
- The scene uses theme background and fog, a hemisphere light and one directional shadow caster. Pooled zombie meshes have castShadow disabled.
- Enemy groups, bullets, gibs and CombatVFX bursts use fixed-size caps or pools. Several geometry families are created once and disposed on cleanup. Transforms and feedback are mostly changed through useFrame.
- **UNVERIFIED:** target-device frame time, GPU load, memory usage, draw calls, thermal throttling, long-session resource behavior and exact iPhone/Android rendering differences. No performance improvement should be claimed without measurement.

## B. Target visual identity

The target is premium readable low-poly 3D, not realism. The signature should be a colorful miniature defense diorama: faceted shapes, strong silhouettes, warm collectible rewards, friendly machined forms, expressive infected silhouettes and richly themed but subordinate maps.

1. **Silhouette before surface detail.** Each tower class should read through its largest two or three shapes at gameplay zoom. Optics, bolts, straps and tiny decals are optional.
2. **Limit dominant materials.** Prefer one primary body, one mechanical secondary and one functional accent. Avoid a rainbow of equally prominent details.
3. **Weapons explain behavior.** Long barrel = precision; broad muzzle = close-range crowd control; tanks/nozzle = sustained heat; coils = electrical chain; faceted core = cold/control; launch tube = heavy splash; focused emitter/lens = beam.
4. **Upgrade changes need a gameplay reason.** A tier alters a module associated with its existing ability and valid tower.a/tower.b state. No decorative tier should exist independently of combat progression.
5. **Friendly and hostile forms separate immediately.** Friendly structures use deliberate machined forms and restrained accents. Zombies use asymmetric body shapes, expressive faces and role silhouettes.
6. **Environment frames the path.** Continuous road edges outrank scenery details. Landmarks sit behind the combat read and must not compete with enemies, indicators or HUD.
7. **Every effect earns screen space.** Favor a crisp, timed shape and quick dissipation over opaque persistent clouds. Use shape/motion as well as color for gameplay communication.
8. **Share construction rules, not copy-paste design.** Reuse geometry and material conventions, but preserve signature shapes, firing movement and attack feedback for each tower.

Avoid photoreal materials, tiny high-frequency surface detail, muddy terrain contrast, constant idle motion, excessive emissive glow, thick projectile trails, generic effects for all attacks and broad transparent overlays.

## C. Color and material specification

Values marked EXISTING below are exact values read from source. CSS uses OKLCH where the source uses it; those values are retained exactly instead of being mislabeled as HEX. Color must support shape and animation, never serve as the only indicator of a gameplay state.

### Tower identity accents — existing

| Token / tower | Exact HEX | Intended role | Contrast requirement | Status |
|---|---|---|---|---|
| Rifleman accent | #e9b44c | Basic weapon / target identity | Distinguish from dark steel and enemy red | EXISTING |
| Shotgunner accent | #d98a3c | Close-range blast weapon | Warm but distinguishable from flame | EXISTING |
| Freezer accent | #79c7e3 | Cold control weapon | Stay visible on snow/ice; outline with dark body | EXISTING |
| Sniper accent | #8fb98a | Precision weapon | Remain distinct on green maps; keep barrel dark | EXISTING |
| Tesla accent | #b892ff | Electrical chain identity | Separate from mark gold and ice cyan | EXISTING |
| Flamethrower accent | #f2703b | Heat / sustained burn identity | Separate hot core from terrain and kill flashes | EXISTING |
| Rocket accent | #e2725b | Heavy projectile / impact identity | Preserve projectile silhouette against hot terrain | EXISTING |
| Laser accent | #63e6c3 | Focused beam / high-tech identity | Favor a narrow bright cue rather than a wide opaque glow | EXISTING |
| Tower primary body | #6d7477 | Neutral shell without a body cosmetic | Accent hardware should remain clear | EXISTING |
| Tower secondary body | #b5b0a3 | Light panel / shell variation | Do not use as the complete weapon silhouette | EXISTING |
| Cosmetic secondary body | #d8d2c5 | Secondary material when custom body color is equipped | Separate from pale terrain | EXISTING |
| Weapon dark | #384047 | Barrel and mechanical parts | Retain edge/highlight separation on dark terrain | EXISTING |
| Weapon deep | #252c31 | Mechanical inset | Keep small on night stages | EXISTING |
| Tower mounting plate | #343a3e | Shared faceted base | Separate base from ground without excessive glow | EXISTING |

### Default enemy palettes — existing authored values

Default Outbreak uses separate colors by archetype. Special non-default zombie cosmetics intentionally override the roster with a unified finish.

| Enemy | Skin HEX | Cloth HEX | Leg HEX | Silhouette / role |
|---|---|---|---|---|
| Walker (0) | #6f9f55 | #42513f | #35404a | Baseline infected |
| Runner (1) | #e4ad37 | #c9662d | #6f452d | Fast, forward-leaning |
| Brute (2) | #8f332f | #5d2428 | #3f292d | Heavy shoulders / tank |
| Splitter (3) | #89a36c | #53614a | #36443d | Asymmetric core |
| Bomber (4) | #c7b59b | #8b4c35 | #4c3940 | Pack-heavy body |
| Guardian (5) | #9bb4b7 | #3f5960 | #2e3c43 | Wide defensive stance |
| Healer (6) | #d49aa5 | #6a4d63 | #40384d | Slender support |
| Swarm (7) | #77b85b | #35583d | #2e4035 | Small coordinated enemy |

These exact values now live in src/game/zombiePresentation.ts as ZOMBIE_ARCHETYPE_PALETTES. The palette fix is committed on the feature branch and is not merged to main.

### Enemy, status, reward and VFX identity — existing

| Token | Exact HEX | Meaning | Secondary cue | Status |
|---|---|---|---|---|
| Walker health | #e24b4b | Baseline enemy bar | Identity/body silhouette | EXISTING |
| Runner health | #facc15 | Fast enemy bar | Lean and crest | EXISTING |
| Brute health | #fb923c | Tank enemy bar | Large body/shoulders | EXISTING |
| Splitter health | #2dd4bf | Splitter bar | Core attachment | EXISTING |
| Bomber health | #f87171 | Bomber bar | Visible pack | EXISTING |
| Guardian health | #60a5fa | Guardian bar | Shield signature | EXISTING |
| Healer health | #4ade80 | Healer bar | Aura / support posture | EXISTING |
| Swarm health | #c084fc | Swarm bar | Small size and pack motion | EXISTING |
| Boss / mark / reward gold | #e9b44c | Boss core, mark and reward family | Crown/aura; mark ring; physical coin | EXISTING |
| Boss enraged core / emission | #ff6b4a / #ff4f36 | Enraged state | Larger/pulsing core and boss signature | EXISTING |
| Stun | #fff1a8 | Stun indicator | Floating octahedron / rotation | EXISTING |
| Hit burst | #fff1c7 | Standard hit | Short-lived ring/core/sparks | EXISTING |
| Kill burst | #ffd66d | Defeat confirmation | Burst motion / short duration | EXISTING |
| Heal flash | #8ee6a0 | Healing cue | Green pulse | EXISTING |

### Environment material palette — existing

| Token | Exact HEX | Use | Contrast rule | Status |
|---|---|---|---|---|
| Wood | #6f4c35 | Trunks and timber | Separate from path edge using value | EXISTING |
| Light wood | #a67a4c | Boards and timber trim | Limit broad use beside sand | EXISTING |
| Leaf | #2f6b45 | Foliage | Keep path/enemies more contrasty | EXISTING |
| Light leaf | #4d8b56 | Foliage planes | Group into simple faceted masses | EXISTING |
| Pine | #28513d | Conifers | Avoid hiding green Walker silhouette in dense foreground | EXISTING |
| Stone | #77776f | Stone/rocks | Edge value against ground | EXISTING |
| Dark stone | #4e504d | Ruins / shadow masses | Bright trim should separate it in night maps | EXISTING |
| Snow | #e8eff2 | Snow | Dark edges separate from pale towers | EXISTING |
| Ice | #79b9ca | Ice props/trim | Faceting separates it from Freezer accent | EXISTING |
| Pale ice | #b6e2ea | Ice structures/crystals | Avoid large transparent layers | EXISTING |
| Sand | #c89b61 | Desert props | Preserve road-marker separation | EXISTING |
| Metal | #56616a | Industrial props | Edge contrast on blacksite ground | EXISTING |
| Dark metal | #30363c | Dark mechanical elements | Do not flatten into ground shadows | EXISTING |
| Hazard | #c86b45 | Barriers/warning props | Shape and location must also signal warning | EXISTING |
| Gold | #e3b550 | Props/rewards | Differentiate from Rifleman projectiles by scale/motion | EXISTING |
| Water | #4f9bb3 | Water surface/shore | Not the sole cue for a Freezer effect | EXISTING |
| Glass | #8fc9d6 | Window panels | Prefer opaque low-poly panel if readability suffers | EXISTING |
| Brick | #71433d | Sheds/masonry | Keep distinct from red enemies with silhouette/trim | EXISTING |
| Bone | #d3c5a5 | Grave markers/pale props | Avoid large pale regions behind status bars | EXISTING |
| Dark | #20252a | Deep prop details | Reserve for edges/insets in night themes | EXISTING |
| Neon | #8bd3cf | High-tech environment accent | Small intentional highlight areas | EXISTING |
| Lava / hot highlight | #db6847 / #f0a34b | Volcano/foundry hot props | Do not let scenery mimic every weapon impact | EXISTING |

Theme-specific sky, fog, ground, alternate ground, path, path edge, marker, hemisphere colors and lighting live in src/game/stageThemes.ts. Each environment’s building/buildingAlt/trim/roof/glass/roadEdge/roadAccent/base/baseAccent values live in src/game/environmentVisuals.ts. Use those theme-aware systems instead of injecting unrelated colors into Scene.tsx.

### Interface tokens — exact source CSS (OKLCH)

| Token | Existing value | Use | Status |
|---|---|---|---|
| --rw-ink | oklch(0.12 0.022 252) | Deep neutral | EXISTING |
| --rw-panel | oklch(0.235 0.03 253 / 0.97) | Primary panel | EXISTING |
| --rw-panel-raised | oklch(0.30 0.035 253 / 0.98) | Raised surface | EXISTING |
| --rw-panel-inset | oklch(0.145 0.022 252 / 0.82) | Inset surface | EXISTING |
| --rw-line | oklch(0.95 0.02 90 / 0.12) | Subtle border | EXISTING |
| --rw-line-strong | oklch(0.82 0.12 80 / 0.42) | Emphasized gold edge | EXISTING |
| --rw-text | oklch(0.97 0.012 90) | Primary copy | EXISTING |
| --rw-muted | oklch(0.77 0.025 248) | Secondary copy | EXISTING |
| --rw-gold | oklch(0.82 0.15 80) | Currency / emphasis | EXISTING |
| --rw-danger | oklch(0.68 0.19 25) | Danger / low-life states | EXISTING |

**PROPOSED IMPROVEMENT:** if two adjacent materials become indistinguishable on a phone, tune material value/roughness or add an edge/shape cue before expanding the palette. Do not add a new token until a specific readability issue is demonstrated.

## D. Geometry, silhouettes and proportions

### Recovered conventions

- World objects are positioned in X/Z; vertical is Y. The Scene content group is scaled to 0.74 and shifted along Z. This is a scene transform, not a universal physical unit.
- TowerMesh places the model group at Y = 1.18 + level * 0.1. TowerModel uses hand-authored local coordinates; do not compare raw local tower and zombie numbers as metres.
- The shared tower mounting cylinder uses radii around 0.9–1.05 local units, while body widths differ by tower.
- Zombie geometry and proportions vary by kind and can be assigned to pooled meshes. Reused slots must restore scale, transforms, geometry, materials and visibility.
- Tower aim is a Y-axis rotation; the forward barrel convention is generally local +Z. Preserve the coordinate frame used by projectile origin/creation in src/game/towerCombat.ts.

### Reusable rules

- **PROPOSED IMPROVEMENT:** inspect every new part at the in-game camera distance. Keep each tower’s largest two or three forms separated from the chassis and nearby effects.
- Align muzzle attachments to the actual engine projectile origin and forward axis. Never move a muzzle based only on visual guesswork.
- Use broad planes and low-sided primitives with meaningful facet breaks. Prefer one clear silhouette-changing module over many decorative bits.
- Zombie identity should come from proportions, forward lean, head/face shape and role accessory. Do not make enemy types differ only by hue.
- Environment props must remain clear of placement cells/lanes unless their map geometry intentionally accounts for them. Only maps.ts governs gameplay placement.
- Omit microgeometry that disappears at gameplay zoom. The code does not define a single universal physical asset grid; do not assert unverified metre/pixel measurements.

## E. Materials, lighting and rendering

### Current implementation

- Tower/environment meshes frequently use meshStandardMaterial with flatShading. AccentMaterial uses same-color emissive response, roughness 0.72 and metalness 0.08 by default. Some tower parts override roughness/metalness.
- Stage props share a simple Mat helper. Brief highlights and effects use meshBasicMaterial.
- Scene background and fog follow stage theme; a hemisphere light and a directional light at [12, 18, 8] provide the base lighting. The directional light casts the scene shadow map.
- The UI uses dark stacked surfaces and gold emphasis, intentionally separate from world materials.

### Production rules

1. Prefer existing standard materials unless an object clearly needs an unlit marker or short VFX.
2. Reuse geometry/materials where safe. Do not share mutable color/emissive materials across elements that need different values.
3. Keep important gameplay objects opaque or mostly opaque. Reserve transparency for selected rings, small status auras and short effects already present.
4. Evaluate emissive accents under daytime and dark stage themes, plus icy/pale terrain.
5. Keep current quality profiles: viewport below 700 => shadow map 512 / scenery 22; below 1100 => 768 / 30; otherwise 768 / 38.
6. Do not introduce global post-processing, costly reflections, extra shadow casters or broad full-screen effects as default polish.
7. Avoid per-frame geometry/material creation, repeated React state updates for transforms, and resources without cleanup.

The inspected helper does not define a GPU, draw-call, memory or thermal budget. Establish measurements on target devices before proposing numeric targets.

## F. Animation and combat feel

### Current behavior

| Element | Existing source behavior | Direction |
|---|---|---|
| Tower idle | Small shared rig bob; recoil-driven scale/roll | Keep subtle at rest, more legible on real attack |
| Tower aim | Parent turret tracks tower.aim; snap on high recoil/shot frame | Verify barrel orientation and projectile match in live play |
| Tower fire | Weapon offset from recoil; muzzle shown when recoil crosses a threshold | Ensure each flash maps to the actual weapon/barrel; do not apply dual-flash style everywhere |
| Tesla/freezer/signatures | Selected groups rotate and pulse by kind | Slow idle movement; clear attack cue rather than perpetual noise |
| Zombie gait | Per-kind gait, stride, arm swing, sway, head bob/turn and forward lean | Keep silhouettes distinct with pooled transform updates |
| Zombie hit/death | Material flash, gore-mask part hiding, fold/fade | Reset transforms and parts on pool reuse |
| Combat burst | Pooled ring/core/sparks; reduced-motion mode stops spawning bursts | Preserve cap and avoid stacking lingering effects |

### Animation rules

- **PROPOSED IMPROVEMENT:** use anticipation where cadence permits, movement at the real shot, and restrained recovery. Continuous/high-rate towers must not jitter with a single-shot animation repeated each simulation sub-step.
- Put the pivot where a weapon attaches to its mount. Avoid rotating an off-center barrel around the tower origin if the hierarchy supports a local pivot.
- Treat the simulation’s target and projectile origin as truth. Cosmetic aiming must never imply a different direction from the actual attack.
- Animate functional parts: rifle recoil, sniper’s deliberate kick, coil pulse, nozzle tracking, launcher settle. Different towers need different timing, not constant synchronized bob.
- Preserve the current reduced-motion prop and preference handling. New camera shake or persistent light pulses must not bypass it.
- Enemy pool reset paths must restore pose, visibility, scale and geometry for the next kind in a pooled slot.

## G. Effects and combat readability

| Family | Source trigger / current presentation | Direction / limit |
|---|---|---|
| Standard projectile | Engine bullet state drives pooled kind-specific mesh and trail in Scene.tsx | Preserve kind silhouette/forward axis; keep trails narrow |
| Hit burst | Zombie flash crosses a threshold in CombatVFX.tsx | Short core/ring; avoid masking face or lane |
| Kill burst | Zombie transitions to dead | Quick confirmation; do not hide death/gib read |
| Heal burst | Heal flash crosses a threshold | Green pulse plus its own shape/timing |
| Mark | Active markTime displays a ring | Distinct from tower-selection/range rings by height/context |
| Stun | Positive stun displays a floating octahedron | Keep above silhouette and clearly different from mark |
| Boss signature | Aura/crown/core and archetype symbols | Preserve role identity in crowded waves |
| Reward coin | Gold cylinder plus glint, lift/spin/fade | Retain physical coin cue; avoid large text clouds |
| Heat/cold/splash/chain | Combat data supports burn, slow, splash, chain and kind-specific projectiles | Full-motion visual implementation is partly unverified; only map effects to real mechanics |

### Effect limits

- Existing caps: 24 burst groups, 60 zombie models, 64 gibs, 64 active bullets. Do not raise without performance and readability evidence.
- Prefer pre-created pooled meshes and mutable transforms. Never allocate Three.js geometry every frame.
- Area impacts should keep a readable center and brief outer cue; do not cover the road with persistent opaque effects.
- **PROPOSED IMPROVEMENT:** precision = thin/direct, sustained heat = narrow directional delivery with burn feedback, cold = crisp faceted/slow cue, chain = successive connected targets, heavy Rocket = compact center plus controlled outer pulse, Laser = narrow focused line/core. These are direction rules, not a claim that every sequence already exists.
- **UNVERIFIED:** overlap in dense waves, phone-scale discernibility, motion discomfort, GPU cost and per-tower effect-to-muzzle alignment.

## H. Environment, map interaction and interface

### Environment

- Preserve all 20 authored maps and environment profiles. Keep road center/edge stronger than scenery detail; markings should clarify road direction rather than decorate every surface.
- Give a landmark one clear large shape readable from a distance. Avoid a bright emissive detail directly behind enemies, projectiles or selected-range indicators.
- Icy biomes are pale: retain dark edge values for Freezer and other towers. Dark stages need edge separation for tower bodies and zombie attachments.
- ThemedBase, ThemedBuilding, ThemedRoads, StageEnvironment and MapSpecialTerrain are presentation. maps.ts is truth for path and placement geometry.
- **UNVERIFIED:** whether every prop fits the authored map visually in a live match and whether visual edges remain readable at phone zoom.

### Interface

- Keep in-match hierarchy simple: base lives, wave/enemy pressure, currency, selected tower and next meaningful path-tier choice.
- Retain current UI tokens: --rw-panel, --rw-panel-raised and --rw-panel-inset; --rw-text and --rw-muted; --rw-gold and --rw-danger.
- Keep gold pickup feedback anchored in the world and separate from the HUD currency count.
- Selection range and Rifleman squad radius are different states; preserve their visual distinction.
- Preserve touch/placement/navigation behavior. Do not add currencies, permanent upgrade mechanics or other gameplay systems as visual polish.
- **PROPOSED IMPROVEMENT:** review actual phone-portrait screenshots for menu, an active wave, selected tower/range, upgrade panel, boss, results, icy and darkest biomes. Check clipping, touch targets, readability and occlusion; screenshots complement tests rather than replacing them.

## I. Implementation inventory

| Asset / system | Source entry points | Existing tests / integration | Status for this change |
|---|---|---|---|
| Tower catalog/accents | src/game/engine.ts: TOWER_KINDS, TOWER_INFO | towerStats.test.ts, towerUpgradeDesign.test.ts and combat tests | Audited; unchanged |
| Tower geometry/tier hardware | src/components/game/TowerModel.tsx: TowerModel, render helpers, UpgradeGear | Scene.tsx; full-visual-smoke E2E | Follow-up: per-path hardware and weapon-specific recoil |
| Tower aim/range/squad ring | src/components/game/Scene.tsx: TowerMesh | towerCombat/synergy tests and core-loop E2E | Audited; retained |
| Upgrade state/copy | src/game/towerUpgradeDesign.ts; src/game/towerStats.ts | towerUpgradeDesign.test.ts; towerStats.test.ts | Audited; no mechanics changed |
| Zombie identity palette | src/game/zombiePresentation.ts: ZOMBIE_ARCHETYPE_PALETTES, zombiePaletteForKind | src/game/zombiePresentation.test.ts | **Changed:** default uses eight palettes; cosmetic skins still override |
| Zombie pooled model/animation | src/components/game/Scene.tsx: Zombies, named parts | zombiePresentation, enemyPresentation, enemyLifecycle tests; visual-smoke E2E | Follow-up: hit response, stable pooled animation, shield/payload silhouettes |
| Enemy labels/health | src/game/enemyPresentation.ts | enemyPresentation.test.ts | Existing; documented |
| Projectile origin/flight | src/game/towerCombat.ts; Scene.tsx: Bullets | towerCombat, projectileImpact, projectileEffects tests | Audited; unchanged |
| Hit/kill/heal VFX | src/components/game/CombatVFX.tsx: CombatVFX | full-visual-smoke E2E | Existing capped pool; no new VFX |
| Environment props/landmarks | src/components/game/StageEnvironment.tsx: EnvironmentPropMesh, StageEnvironment | stageEnvironments/stageThemes tests | Audited; no collision changes |
| Roads/buildings/base/terrain | src/game/maps.ts; ThemedRoads.tsx, ThemedBuildings.tsx, ThemedBase.tsx, SpecialTerrain.tsx | maps, stageThemes, stageEnvironments tests | Follow-up: landmark details and narrowed urban center dashes; map logic unchanged |
| Render quality | src/game/renderQuality.ts: getSceneRenderQuality | src/game/renderQuality.test.ts | Existing three profiles retained |
| HUD, menus, Canvas | HUD.tsx, GameCanvas.tsx, src/styles.css | e2e/ui-foundation.spec.ts, menu-navigation and visual-smoke E2E | Follow-up: keyboard focus and next-tier panel emphasis |
| CI validation | .github/workflows/game-test.yml | lint, unit, TypeScript, build, Playwright | CI is validation source; results must be reported separately |

Supporting code already present and worth using rather than duplicating includes src/game/environmentVisuals.ts, stageThemes.ts, stageEnvironments.ts, zombiePresentation.ts, enemyPresentation.ts, towerUpgradeDesign.ts, towerCombat.ts, projectileEffects.ts and renderQuality.ts. The docs directory did not exist on the audited default-branch tree, so this file establishes the primary entry point.

## J. Definition of done

### Art / gameplay readability
- All eight actual tower models read distinctly at the normal gameplay camera without depending on labels.
- Every visual upgrade follows a reachable, existing tower.a/tower.b state and matches its actual weapon/ability.
- All eight enemy kinds remain distinguishable through shape/proportion/palette/role marker, with default per-kind palettes intact.
- Selection range, Rifleman support radius, marks/stun/health bars, projectile trails and rewards remain distinguishable on light, dark, green and icy themes.
- Road and build-zone readability remain intact; visual-only props never imply unimplemented collisions.

### Engineering / mobile
- Existing pool caps and responsive low-power profiles remain intact unless measured data justifies change.
- No geometry/material is created per frame; new resources and listeners have cleanup.
- Reduced-motion handling and touch placement/selection continue to work.
- Run the repository's actual checks: bun run lint, bun run test:unit, bunx tsc --noEmit, bun run build and bun run test:e2e. Triaged failures must not be suppressed or hidden.
- Review full visual-smoke, UI-foundation, core-loop and mobile-sized contexts where browser tooling exists. Compile success alone does not prove muzzle/impact alignment.
- Measure target-device frame time, memory and resource lifecycle before claiming performance gains or setting new numeric budgets.

### Documentation / handoff
- Source inventory and values match code; completed behavior is not confused with proposals.
- Test and live-visual status are explicit.
- Remaining dependencies/uncertainties stay labeled.
- Pull request includes the exact changes and validation evidence. It is not merged unless separately authorized.

---

## Change log — 2026-10-22

### Restore default zombie archetype palette differentiation

- **Original source behavior:** eight palette entries existed in Scene.tsx, but the kind-change palette application used the equipped cosmetic for every kind. The default Outbreak palette matches Walker values, so other archetypes inherited Walker colors on initialization/pool reuse.
- **Implemented on feature branch:** moved the eight exact skin/cloth/leg triples to src/game/zombiePresentation.ts; added zombiePaletteForKind; switched Scene.tsx to apply the resolved palette to enemy skin/body/legs; retained all non-default cosmetic overrides.
- **Regression guard added:** src/game/zombiePresentation.test.ts checks all eight default skin colors are distinct and that an earned non-default cosmetic overrides a selected kind.
- **Reason:** restore existing enemy-role differentiation with current geometry/materials and no changes to stats, progression, combat, placement or render budget.
- **Tests:** the regression test has been authored; successful execution has not yet been established at the time of writing.
- **Remaining:** inspect all eight archetypes and cosmetics during live browser/device play, review tower and effect origins in motion, and complete the validation suite before merge.

## Change log — 2026-10-23

### Implement presentation follow-up

- **Tower models:** added tier-specific silhouette hardware across the existing A/B paths, replaced generic path-side markers with tower-specific parts, and differentiated recoil travel by weapon while keeping the weapon movement on the shot axis. Static projectile muzzle offsets and combat rules are unchanged. Idle motion and weapon recoil are suppressed when reduced motion is enabled.
- **Pooled enemies:** added a brief hit lean/twist and body response driven by the existing flash value, made pooled status/signature rotation time-based so it does not accumulate across reused slots, and replaced the Guardian's horizontal ring with a forward-facing shield and the Bomber's box pack with a payload canister. The shared shield geometry is disposed with the zombie pool.
- **Environment/road/UI:** added structural and facade detail to the water tower, frozen lab, skyscraper, foundry and cathedral landmarks; changed urban road dashes to narrow longitudinal lane marks; added visible keyboard focus and a restrained accent edge for the currently available upgrade tier. No route, placement, purchase or navigation rules changed.
- **Validation evidence:** the focused zombie presentation tests and Bun TSX parse pass locally. Full dependency installation was blocked by DNS failures fetching the existing lockfile; no local browser screenshot or physical-device/frame-time review was possible. The previous PR head's GitHub run passed lint, unit, TypeScript, build and 25 Playwright checks (one skipped), but that run does not validate this follow-up.
- **Remaining:** inspect all models, upgrade combinations, attacks and screens in a running browser/device; refine the other themed landmarks and attack-specific impacts where visual review shows a need; rerun the complete repository checks after dependencies are available.


---

## Direct visual follow-up — 2026-10-23

This follow-up adds the following source changes on top of the prior tower/enemy visual commit:

- **Tower footing:** raised the octagonal bearing, added low mechanical skids, and made the shared identity halo/core less universal so the three energy-focused towers retain a more coherent energy read while ballistic towers look more mechanical.
- **Weapon animation:** reduced the amount of recoil squash applied to the complete tower chassis and added a small weapon pitch response keyed to the tower's recoil. The existing recoil travel remains tower-specific and the reduced-motion multiplier remains in place.
- **Zombie silhouettes:** gave Splitter, Bomber, Guardian, Healer and Swarm dedicated pooled body/head/limb proportions so their visual identity is not carried by colors or role markers alone. Runner and Brute keep their existing specialized geometry.
- **Lighting and surfaces:** added low-intensity cool fill without shadows; environment materials now separate rough organic/stone finishes from industrial metal and icy/glass accents.
- **Road and base construction:** added subtle joints to constructed road styles and reinforced shoulders for industrial/military/blacksite roads. Added color-coordinated reinforcement belts to city, ice, industrial and tower-like base designs.

No tower stats, enemy stats, route geometry, collision/placement rules, currency, progression, or combat formulas were intentionally changed.

**Validation note:** source changes are committed as an implementation step. Visual appearance at phone zoom, precise muzzle-to-projectile alignment, memory/frame-time impact, and full automated test results remain unverified until checked against the updated commit and an actual running session.


### Landmark and emissive-material follow-up — 2026-10-23

- Refined high-salience **market arcade, frozen lab, skyscraper, foundry furnace, cathedral, volcano crater and reactor** landmark geometry with caps, bases, facade/floor bands, supports and biome-specific structural layering.
- The shared environment prop material helper now gives restrained emissive response to existing lava, hot-highlight and neon material tokens; this is standard-material emissive, not a new post-processing effect.
- The changes affect presentation geometry only. Map path, obstacle placement, collisions, tower placement, stats, and combat logic are unchanged.
- **Verification boundary:** these source changes are not a substitute for browser/device screenshots. Inspect scale and silhouette at phone gameplay distance and confirm CI for the exact commit.
