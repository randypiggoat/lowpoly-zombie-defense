# Zombie Character, Animation & Combat-Feedback Overhaul

**Branch:** `feat/zombie-character-overhaul-2026-11-01`  
**Implementation status:** Source changes committed; automated verification and live visual inspection pending.

## Scope and design intent

The eight existing enemies remain the same gameplay archetypes. Their default palette identities, boss signatures, gore masks, health/damage rules, pathing, targeting and spawn behavior are preserved. The visual direction is a cohesive premium low-poly roster: sculpted faceted volumes, asymmetrical anatomy, readable silhouettes and short, intentional procedural motion.

The implementation extends the existing pooled Three.js renderer in `src/components/game/Scene.tsx`. It does not create one React component, skeleton, or animation mixer per zombie. Shared archetype geometries are generated once and reused by the 60 existing pooled enemy slots.

## Archetype briefs and source implementation

| Archetype | Shape language | Motion / combat character |
|---|---|---|
| **Walker** | Hunched, uneven baseline silhouette; broad, battered head; loose limbs | Slow, uneven gait, loose arm swing, small idle movement, readable directional flinch and a crooked collapse |
| **Runner** | Narrow torso, elongated head/limbs and forward-set posture | Fast cadence, larger step lift, forward drive, sharper directional stagger and a tumbling death silhouette |
| **Brute** | Very broad torso, heavy skull, thick arms and legs, enlarged shoulders | Slow planted steps, restrained idle motion, heavy breathing/pulse, reduced stagger and a weightier fall |
| **Splitter** | Off-center head/body volumes, irregular torso profile and exposed core signature | Unstable torso twist, asymmetric arm response, twitching idle, side-biased impact and a pronounced twisting collapse |
| **Bomber** | Swollen abdomen and thick torso with a rear pack signature | Unstable body pulse, pronounced hit compression and reactive pack motion; explosion gameplay remains owned by the existing simulation |
| **Guardian** | Wide reinforced body, thick limbs and a faceted raised shield | Braced, slow gait, restrained flinch and a shield response; shield geometry is now bevelled/extruded instead of a flat sheet |
| **Healer** | Narrower organic body and distinctive aura signature | Gentle hover, deliberate movement, organic pulse and a restrained interruption on impact |
| **Swarm** | Compact body, oversized head relative to torso and short limbs | Fast skitter cadence, pronounced step lift, lively idle twitch and quick small-scale hit/death motion |

The authored profiles are in `src/game/zombiePresentation.ts`. Each profile defines gait cadence, stride, arm swing, body sway, head movement, idle rate, lean, hit recoil, hit twist, death fold, step lift, torso twist, arm asymmetry, body pulse, idle jitter, hit stagger, side roll and death twist. The eight profiles intentionally differ instead of sharing one universal motion preset.

The per-kind silhouette geometry is authored by `ZOMBIE_BODY_FORMS`, `ZOMBIE_HEAD_FORMS`, `ZOMBIE_ARM_WIDTHS`, and `ZOMBIE_LEG_WIDTHS` in `Scene.tsx`. Ring-based low-poly volumes produce faceted anatomy with low segment counts. Body, head, arm and leg geometries are generated once per archetype, shared by pooled instances, and disposed with the renderer.

## Hit reactions

The simulation already stores render-facing impact data on each zombie: `hitReact`, `hitX`, `hitZ`, `hitForce` and `hitKind`. The renderer now consumes those fields instead of relying only on the generic flash value.

- The world-space hit vector is transformed into the enemy's local frame using its facing direction.
- Impact force drives short body displacement, torso lean/roll, head snap and asymmetric arm/leg response.
- Existing weapon identity is used to distinguish stronger explosive/shotgun motion, electrical twitching, fire flinch, freezing response and precision-hit head snap.
- Existing slow/stun states reduce locomotion amplitude.
- Reduced-motion mode scales secondary movement and impact accents down.

The change is presentation-only. Damage, knockback physics, path following, targeting, hitboxes, abilities and enemy health remain simulation-owned.

## Performance and lifecycle decisions

- Keep the existing fixed 60-zombie pool.
- Generate each archetype's geometry once; do not allocate geometry in the frame loop.
- Reuse the existing body-part meshes and signature attachments rather than adding a large child hierarchy to every enemy.
- Preserve current gore part visibility and the existing 64-gib cap.
- Dispose body/head/arm/leg geometries and shield geometry on component cleanup.
- Preserve the default per-archetype palettes and allow existing unlocked cosmetic skins to override them.
- No full-screen post-processing, new per-zombie animation mixer, runtime network asset fetch, or physics ragdoll was added.

## Free-asset research and licensing notes

The following free sources were checked as potential future geometry / animation contributors:

1. **Quaternius — Zombie Apocalypse Kit**  
   https://quaternius.com/packs/zombieapocalypsekit.html  
   The pack page lists 60 models, FBX/OBJ/Blend/glTF formats, a CC0 license badge, and describes four playable characters with 20 animations each plus four enemies and two dogs. It says the kit is free for personal and commercial projects.
2. **Quaternius — Animated Zombie Pack**  
   https://quaternius.com/packs/animatedzombie.html  
   The pack page lists two models, FBX/OBJ/Blend formats, a CC0 badge and an atlas-textured animated zombie.
3. **Quaternius — FAQ**  
   https://quaternius.com/faq.html  
   The FAQ says the models may be used in commercial projects, modified and combined, and that attribution is not required under the stated CC0 releases.

**Asset-use boundary for this implementation:** no third-party model binary or animation clip has been added to the runtime in this pass. The inspected packs are useful candidates, but their supplied character rigs do not directly match the game's lightweight pooled procedural body-part renderer; importing them without a deliberate conversion/retarget pipeline would add complexity and could increase mobile cost. The current integrated meshes are original procedural geometry authored in this repository. Re-evaluate any future download against the exact pack's current license and format before adding it; retain the source and license record with the asset.

## Verification status

**Implemented in source:** archetype geometry profiles, shared geometry pools, per-archetype procedural motion profiles, directional/weapon-specific hit response, death pose variation and a dimensional Guardian shield.

**Added automated coverage:** `src/game/zombiePresentation.test.ts` checks all eight presentation profiles, including finite/non-negative motion values, per-archetype variation, and sensible bounds for step lift / hit / death accents, alongside the existing palette, scale, hit-direction and weapon reaction tests.

**Still required before calling the overhaul verified:** run Bun unit tests, lint, TypeScript check, production build and Playwright on this exact branch head; inspect captured gameplay at desktop and phone viewports; confirm each archetype, status effect, weapon-hit type, gore transition and death behavior in a live scene. No runtime screenshot, frame-time measurement or physical-device test is claimed by this document.
