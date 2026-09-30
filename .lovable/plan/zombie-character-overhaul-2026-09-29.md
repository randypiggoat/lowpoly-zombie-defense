# Zombie Character & Destruction Overhaul — Research/Design Plan

## Research snapshot (2026-09-29)

| Reference | Relevant technique | Transferable principle | Rotwood Defense adaptation |
| --- | --- | --- | --- |
| Sensor Tower 2026 mobile market | Top mobile games continue to rely on readable, content-rich live updates and strong character/cosmetic presentation | In a mature mobile market, distinctive content must communicate quickly and reward repeated attention | Make enemy identity legible in seconds without increasing combat clutter; character personality becomes part of the game's repeatable visual language |
| GDC — *Bringing Hell to Life: AI and Full Body Animation in DOOM* | Stylized enemies depend heavily on animation quality and robust animation control | Enemy animation sells character and combat more than raw mesh detail | Use shared procedural animation with strong per-archetype timing, posture, anticipation, and reactions rather than heavy skeletal systems |
| GDC — *VFX as a Game Design Language* | Shape/silhouette communicates status and gameplay function; shape can be more reliable than color | Shape language carries gameplay meaning even when color is unavailable or crowded | Give every special zombie a silhouette-defining signature part and keep effects subordinate to readable form |
| GameAnalytics — game feel / “juice” guidance | Layered visual, audio, timing and impact feedback helps players understand actions and adds life | Strong feedback is a coordinated stack, not one large effect | Pair directional hit pose + signature VFX + existing SFX/screen feedback, with a clear intensity hierarchy |
| GDC animation principle coverage | Anticipation → action → reaction improves readability and reward | Preparation and recovery make an impact feel authored rather than random | Add lightweight wind-up/recoil/death timing through procedural transforms, especially for bosses and explosive types |

### Design decisions

1. Preserve the existing low-poly primitive-based art direction.
2. Keep simulation authoritative and renderer-facing; add only compact presentation state to the zombie model when the renderer cannot infer the impact source.
3. Prefer one additional combined face mesh per zombie over many eye/teeth objects.
4. Cache pooled Three.js object references in `userData` so the frame loop does not repeatedly traverse each zombie hierarchy.
5. Use deterministic seeded visual variation from the zombie id so repeated enemies do not animate in lockstep.
6. Make signature parts both visual and mechanical where the simulation already supports it (Runner legs, Brute shoulders, Splitter core, Bomber pack, Guardian shield, Healer aura, Swarm crest).
7. Avoid uncontrolled ragdolls or per-frame physics; use short procedural hit impulses and bounded death motion.
8. Respect Reduced Motion by suppressing secondary shake/twitch/pulse while keeping readable state changes.
9. Keep total zombie/gib caps unchanged unless measurement shows a safe reason to tune them.

## Current audit

The current main branch already has:
- eight typed enemy kinds;
- per-kind body/head primitive geometry and scale transforms;
- pooled rendering for up to 60 enemies;
- a four-part per-archetype gore breakpoint system;
- a persistent `gibMask` in simulation;
- signature destructible parts for special archetypes;
- mobility/ability consequences for several broken signature parts;
- a shared ragdoll/death impulse;
- existing combat feel, SFX, boss effects, and health presentation.

The main gaps are:
- faces have no expressive identity;
- locomotion is mostly one shared bob/roll pattern;
- both legs currently share one animation group, making gait variation weak;
- hit reactions do not encode hit direction or weapon identity;
- destruction uses shared generic debris for the final death burst;
- signature pieces are mostly static geometry rather than visibly integrated anatomy;
- the frame loop repeatedly searches object names instead of caching part references;
- damage-state presentation is mostly a flash, with little readable deterioration between full health and death.

## Planned architecture

- New `src/game/zombiePresentation.ts`: compact immutable visual/animation definitions for all eight archetypes plus attack-style definitions.
- Extend `Zombie` with bounded presentation-only impact fields: hit direction, hit strength/style and a short-lived reaction timer.
- Keep game rules deterministic; only the presentation fields are consumed by the renderer.
- Upgrade the existing pooled `Zombies` renderer in `Scene.tsx` rather than replacing it with 60 React animation components.

## Per-archetype identity targets

- Walker: vacant baseline face, loose posture, simple stagger, readable baseline gore.
- Runner: forward-lean, narrow/alert face, fast leg cycle, strong directional stumble, leg/crest-focused destruction.
- Brute: broad jaw/brow, heavy torso sway, slower but weightier recoil, shoulder/arm destruction and heavier collapse.
- Splitter: asymmetrical face, unstable head/body motion, fracture-like hit response, core-centered split destruction.
- Bomber: wide alarmed face, unstable body pulse, warning-like recoil, pack-focused death/explosion.
- Guardian: stern face, braced stance, shield-forward body language, shield fracture/destruction.
- Healer: odd sympathetic/uncanny face, careful motion, aura pulse, aura collapse and support-readability.
- Swarm: smaller clustered silhouette, skitter/peck-like motion, crest/group identity, crest burst and non-humanoid death read.

## Verification targets

Unit tests will verify:
- every archetype has a complete presentation definition;
- attack styles map to the eight tower kinds;
- impact direction is normalized and clamped;
- visual variation is deterministic;
- signature gore remains archetype-specific.

E2E/visual checks will verify:
- gameplay still boots;
- canvas renders without runtime/console errors;
- reduced motion remains functional;
- pooled zombie presentation does not leak kind-specific parts between recycled slots.
