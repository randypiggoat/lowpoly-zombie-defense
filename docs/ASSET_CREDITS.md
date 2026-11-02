# Asset Credits and Licensing

## Menu art and visual effects

The updated survival menu uses the game's original, locally rendered low-poly illustration and procedural CSS/Three.js presentation. No external image URLs are loaded at runtime, and no new third-party imagery or effects were downloaded for this menu overhaul.

Stage selection and environment visuals continue to use the locally bundled Kenney low-poly models already included in the repository following PR #107. Those models are covered by the CC0 license notice below.

## Kenney low-poly environment models

- **Creator:** Kenney
- **License:** Creative Commons Zero 1.0 Universal (CC0 1.0)
- **Commercial use:** Permitted, including modification and redistribution in a commercial game.
- **Attribution:** Not required; credit is provided as a courtesy.
- **Bundled source derivatives:** Tiny Game Engine's self-contained GLB conversions of selected Kenney source models.
- **Runtime behavior:** Models are included in the repository and loaded locally. The game does not hotlink to Kenney or GitHub.

Official source packs:

| Pack | Source |
|---|---|
| City Kit (Suburban) | https://kenney.nl/assets/city-kit-suburban |
| City Kit (Commercial) | https://kenney.nl/assets/city-kit-commercial |
| Graveyard Kit | https://kenney.nl/assets/graveyard-kit |
| Nature Kit | https://kenney.nl/assets/nature-kit |
| Car Kit | https://kenney.nl/assets/car-kit |

Converted GLB source and license evidence:

- https://github.com/Hidencod/tge-assets
- https://github.com/Hidencod/tge-assets/blob/main/LICENSE

The repository's copy of the license and provenance notice is stored at `public/models/kenney/LICENSE.txt`. The selected model paths are inventoried in `docs/ASSET_INVENTORY.md`.

## Scope of this change

This menu overhaul does not add new third-party assets. It reuses artwork and models already present in the project and creates the updated menu transitions, progress meters, and interface treatments with project CSS and React components. This avoids introducing unverified licensing, external runtime dependencies, or extra downloads that would increase the mobile bundle.
