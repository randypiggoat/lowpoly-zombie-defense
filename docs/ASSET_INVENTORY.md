# External Asset Inventory

All fourteen bundled external 3D assets documented here are selected Kenney low-poly
environment models released under **CC0 1.0 Universal**: buildings, graveyard
architecture, gravestones, trees, palms, and cactus. Commercial use, modification,
and distribution in the game are permitted. Attribution is appreciated but not
required.

## Kenney — City Kit (Suburban)

- Creator: Kenney
- Pack: City Kit (Suburban)
- Official source page: https://kenney.nl/assets/city-kit-suburban
- Source files: self-contained GLB derivatives from https://github.com/Hidencod/tge-assets
- License: CC0 1.0 Universal
- License evidence: source repository LICENSE and README; both identify Kenney as
  creator and state CC0 1.0 applies to the converted GLB files.
- Date obtained: 2026-11-02 UTC
- Modifications: none to the source mesh or embedded texture; the game applies
  object transforms at render time.
- Commercial game use: permitted
- Attribution: not required; Kenney is credited here as a courtesy
- Distribution note: only selected individual models are bundled, not the
  entire asset pack.

| Asset | Repository path | Source file size |
|---|---|---:|
| Building Type A | `public/models/kenney/city-kit-suburban/building-type-a.glb` | 110,408 bytes |
| Building Type F | `public/models/kenney/city-kit-suburban/building-type-f.glb` | 150,356 bytes |

## Kenney — City Kit (Commercial)

- Creator: Kenney
- Pack: City Kit (Commercial)
- Official source page: https://kenney.nl/assets/city-kit-commercial
- Source files: self-contained GLB derivatives from https://github.com/Hidencod/tge-assets
- License: CC0 1.0 Universal
- License evidence: source repository LICENSE and README; both identify Kenney as
  creator and state CC0 1.0 applies to the converted GLB files.
- Date obtained: 2026-11-02 UTC
- Modifications: none to the source mesh or embedded texture; the game applies
  object transforms at render time.
- Commercial game use: permitted
- Attribution: not required; Kenney is credited here as a courtesy
- Distribution note: only selected individual models are bundled, not the
  entire asset pack.

| Asset | Repository path | Source file size |
|---|---|---:|
| Building Skyscraper A | `public/models/kenney/city-kit-commercial/building-skyscraper-a.glb` | 122,376 bytes |
| Building F | `public/models/kenney/city-kit-commercial/building-f.glb` | 159,976 bytes |

## License copy

A copy of the applicable CC0 notice and source references is stored at
`public/models/kenney/LICENSE.txt`.

The app loads these files from its own static public assets. It does not fetch
models from Kenney, GitHub, or any other external host at runtime.


## Kenney — Graveyard Kit

- Creator: Kenney
- Pack: Graveyard Kit
- Official source page: https://kenney.nl/assets/graveyard-kit
- Source files: self-contained GLB derivatives from https://github.com/Hidencod/tge-assets
- License: CC0 1.0 Universal
- License evidence: source repository LICENSE and README; both identify Kenney
  as creator and state CC0 1.0 applies to converted GLB derivatives.
- Date obtained: 2026-11-02 UTC
- Modifications: none to source meshes or embedded textures; model transforms
  and prop selection are performed at runtime.
- Commercial game use: permitted
- Attribution: not required; Kenney is credited here as a courtesy
- Distribution note: four selected models only; the full pack is not bundled.

| Asset | Repository path | Source file size |
|---|---|---:|
| Gravestone Cross | `public/models/kenney/graveyard-kit/gravestone-cross.glb` | 31,576 bytes |
| Gravestone Bevel | `public/models/kenney/graveyard-kit/gravestone-bevel.glb` | 26,844 bytes |
| Gravestone Broken | `public/models/kenney/graveyard-kit/gravestone-broken.glb` | 23,912 bytes |
| Crypt Small | `public/models/kenney/graveyard-kit/crypt-small.glb` | 47,856 bytes |

These models replace selected decorative cemetery props only. Their placement
comes from the existing authored stage-environment prop coordinates.


## Kenney — Nature Kit

- Creator: Kenney
- Pack: Nature Kit
- Official source page: https://kenney.nl/assets/nature-kit
- Source files: self-contained GLB derivatives from https://github.com/Hidencod/tge-assets
- License: CC0 1.0 Universal
- License evidence: source repository LICENSE and README identify Kenney as
  creator and state CC0 1.0 applies to the converted GLB derivatives.
- Date obtained: 2026-11-02 UTC
- Modifications: none to source meshes or embedded textures; the game uses
  measured source bounds to scale each model to its authored prop size.
- Commercial game use: permitted
- Attribution: not required; Kenney is credited here as a courtesy
- Distribution note: four selected models only; the full pack is not bundled.

| Asset | Repository path | Source file size |
|---|---|---:|
| Tree Oak | `public/models/kenney/nature-kit/tree-oak.glb` | 14,644 bytes |
| Tree Pine Tall A Detailed | `public/models/kenney/nature-kit/tree-pinetalla-detailed.glb` | 10,708 bytes |
| Tree Palm Detailed Tall | `public/models/kenney/nature-kit/tree-palmdetailedtall.glb` | 28,204 bytes |
| Cactus Tall | `public/models/kenney/nature-kit/cactus-tall.glb` | 9,668 bytes |

The models are used only for authored environment decoration in compatible
biomes. They do not add collision or modify map placement rules.


## Measured source bounds

The following source bounds were read from the GLB position accessors. Values are
in source model units (width × height × depth), before game scaling.

| Model | Source bounds (W × H × D) | Ground minimum Y |
|---|---:|---:|
| City Kit Suburban — Building Type A | 2 × 2 × 2 | -1 |
| City Kit Suburban — Building Type F | 2.0000002 × 2.1375 × 2.0000002 | -1 |
| City Kit Commercial — Building Skyscraper A | 2.0000002 × 3.88 × 2.0000002 | -1 |
| City Kit Commercial — Building F | 2 × 2.693 × 2 | -1 |
| Graveyard Kit — Gravestone Cross | 2 × 2 × 2 | -1 |
| Graveyard Kit — Gravestone Bevel | 2 × 2 × 2 | -1 |
| Graveyard Kit — Gravestone Broken | 2 × 2 × 2 | -1 |
| Graveyard Kit — Crypt Small | 2 × 2 × 2 | -1 |
| Nature Kit — Tree Oak | 0.640554 × 1.22623992 × 0.739648 | 0 |
| Nature Kit — Tree Pine Tall A Detailed | 0.386272922 × 1.529606 × 0.39195 | 0 |
| Nature Kit — Tree Palm Detailed Tall | 1.034329 × 1.247613 × 1.034329 | 0 |
| Nature Kit — Cactus Tall | 0.39624995 × 0.75 × 0.339082063 | 0 |

These bounds drive the shared `KenneyModel` transform. The component scales each
axis using the model's measured dimensions and offsets the model by its measured
minimum Y so the mesh sits on the ground plane. The nature assets use their own
narrower source footprints rather than assuming every GLB is a unit cube.


## Kenney — Car Kit

- Creator: Kenney
- Pack: Car Kit
- Official source page: https://kenney.nl/assets/car-kit
- Source files: self-contained GLB derivatives from https://github.com/Hidencod/tge-assets
- License: CC0 1.0 Universal
- License evidence: source repository LICENSE and README identify Kenney as
  creator and state CC0 1.0 applies to converted GLB derivatives.
- Date obtained: 2026-11-02 UTC
- Modifications: none to source meshes or embedded textures; game transforms
  use measured source bounds.
- Commercial game use: permitted
- Attribution: not required; Kenney is credited here as a courtesy
- Distribution note: two selected vehicle models only; the full pack is not bundled.

| Asset | Repository path | Source file size |
|---|---|---:|
| Sedan | `public/models/kenney/car-kit/sedan.glb` | 184,504 bytes |
| SUV | `public/models/kenney/car-kit/suv.glb` | 219,840 bytes |

The sedan is used in suburban and market scenery. The SUV is used in the
abandoned-city scenery. Both are decorative props and do not introduce collision
or modify map placement and line-of-sight rules.

## Vehicle source bounds

| Model | Source bounds (W × H × D) | Ground minimum Y |
|---|---:|---:|
| Car Kit — Sedan | 2 × 2.15 × 2.55 | -1 |
| Car Kit — SUV | 2 × 2.1 × 2.55 | -1 |
