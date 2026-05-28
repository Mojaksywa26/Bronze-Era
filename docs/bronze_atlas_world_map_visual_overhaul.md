# Bronze Atlas World Map Visual Overhaul

This document records a practical implementation plan for giving the Bronze Era world map an antique parchment / maritime atlas style while keeping EU5 gameplay readable.

The goal is not to invent unsupported systems. The safe path is to use files EU5 already exposes: flatmap textures, water settings, terrain materials, map mode color parameters, borders, decals, map objects, fonts, and post-effect LUTs.

## Vanilla Files Audited

Relevant vanilla roots:

- `D:/SteamLibrary/steamapps/common/Europa Universalis V/game/in_game/gfx/map/`
- `D:/SteamLibrary/steamapps/common/Europa Universalis V/game/in_game/gfx/terrain2/`
- `D:/SteamLibrary/steamapps/common/Europa Universalis V/game/in_game/fonts/`
- `D:/SteamLibrary/steamapps/common/Europa Universalis V/game/in_game/gui/`
- `D:/SteamLibrary/steamapps/common/Europa Universalis V/game/in_game/terrain_decals.json`

Important discovered files:

- `gfx/map/flatmap/flatmap_materials.txt`
- `gfx/map/flatmap/flatmap_detail.dds`
- `gfx/map/flatmap/flatmap_staticbackup.dds`
- `gfx/map/flatmap/terra_incognita.dds`
- `gfx/map/flatmap/material_textures/*.dds`
- `gfx/map/water/water.settings`
- `gfx/map/water/watercolor_rgb_waterspec_a.dds`
- `gfx/map/borders/border_country.dds`
- `gfx/map/borders/border_province.dds`
- `gfx/map/borders/border_location.dds`
- `gfx/map/post_effects/posteffect_volumes.txt`
- `gfx/map/post_effects/colorcorrection_*.tga`
- `gfx/map/map_modes/map_modes.txt`
- `gfx/map/map_modes/readme.txt`
- `gfx/terrain2/materials.txt`
- `gfx/terrain2/decals/decal_definitions.txt`
- `gfx/map/map_objects/layers.txt`
- `gfx/map/map_objects/dynamic_game_objects.txt`
- `fonts/in_game_fonts.font`

## What Is Realistically Moddable

### 1. Political map colors

Country colors are data-driven and can be remapped safely in country setup files. This is the most direct way to remove bright modern strategy colors.

Recommended target palette:

- ochre: `{ 174 128 62 }`
- clay red: `{ 142 71 52 }`
- dusty blue: `{ 89 113 130 }`
- oxidized copper: `{ 76 128 102 }`
- olive pigment: `{ 101 117 70 }`
- faded purple: `{ 111 86 124 }`
- ash grey: `{ 118 112 99 }`
- sand yellow: `{ 188 158 93 }`
- ink violet: `{ 73 63 88 }`
- burnt umber: `{ 109 76 50 }`

Implementation path:

- Keep existing tags and ownership.
- Replace only `color = { R G B }` values.
- Use a deterministic palette script so adjacent countries avoid identical colors.
- Do not use full saturation or pure RGB primaries.

Recommended file scope in the mod:

- `in_game/setup/countries/_default.txt`
- any split country setup files if later introduced.

### 2. Flatmap parchment style

EU5 already has a paper-like zoomed-out map layer through `gfx/map/flatmap`.

Best files to override in the mod:

- `in_game/gfx/map/flatmap/flatmap_detail.dds`
- `in_game/gfx/map/flatmap/flatmap_staticbackup.dds`
- `in_game/gfx/map/flatmap/terra_incognita.dds`
- `in_game/gfx/map/flatmap/material_textures/flatmap_*.dds`
- `in_game/gfx/map/flatmap/flatmap_materials.txt`

Recommended look:

- low-contrast parchment fiber
- faint ink stains
- warm beige base
- irregular dry-brush terrain marks
- no strong satellite-like detail

Important technical note:

`flatmap_materials.txt` maps terrain categories to flatmap textures. The game comments say material indices need to fit into a compressed texture channel, so do not add too many new material texture types. Replace existing flatmap textures instead of multiplying them.

### 3. Terrain material tint

Close and mid zoom terrain uses `gfx/terrain2/materials.txt` and its texture library.

Best strategy:

- Do not rewrite all terrain materials.
- Desaturate and warm the diffuse textures.
- Leave normal maps mostly intact.
- Keep terrain readable at close zoom.

Files to override only after art exists:

- `in_game/gfx/terrain2/materials.txt`
- selected diffuse textures under `in_game/gfx/terrain2/terrain_textures/textures/`
- selected masks under `in_game/gfx/terrain2/terrain_textures/masks/`

Recommended visual values:

- reduce saturation by 20-35 percent
- add warm brown/yellow midtone bias
- reduce green intensity
- increase contrast only slightly near mountains and coastlines

### 4. Water as old maritime chart water

Water is exposed through `gfx/map/water/water.settings` and DDS textures.

Best files to override:

- `in_game/gfx/map/water/water.settings`
- `in_game/gfx/map/water/watercolor_rgb_waterspec_a.dds`
- `in_game/gfx/map/water/foam.dds`
- `in_game/gfx/map/water/foam_ramp.dds`
- `in_game/gfx/map/water/foam_noise.dds`

Recommended settings direction:

- shallow water: dusty teal / grey blue
- deep water: dark desaturated ink blue
- low specular and low gloss
- weak foam except around coasts

Keep the water readable. Avoid turning oceans fully beige, because coast and navy visibility suffer quickly.

### 5. Borders as ink lines

Border textures are exposed as DDS:

- `gfx/map/borders/border_country.dds`
- `gfx/map/borders/border_province.dds`
- `gfx/map/borders/border_location.dds`
- `gfx/map/borders/border_sea_zone.dds`

Safe art direction:

- country borders: dark brown / black ink, slightly thicker
- province/location borders: lighter brown, lower alpha
- selected/highlighted borders: keep strong enough for gameplay

Do not over-thicken all borders. Use hierarchy:

- country border strongest
- province border medium
- location border subtle
- sea border subtle blue-grey

### 6. Post-effect LUT

`gfx/map/post_effects/posteffect_volumes.txt` references LUTs:

- `colorcorrection_neutral.tga`
- `colorcorrection_hot.tga`
- `colorcorrection_cold.tga`

This can globally push the map toward parchment tones, but it is risky if too strong.

Recommendation:

- create a Bronze Era neutral LUT with mild warmth only
- avoid heavy sepia over the whole game
- keep UI and map mode readability first

### 7. Country labels

`gfx/map/map_modes/map_modes.txt` controls what label type appears per map mode:

- `small_map_names`
- `medium_map_names`
- `large_map_names`
- `small_tooltip_context`
- `medium_tooltip_context`
- `large_tooltip_context`

The file does not expose detailed label typography such as curvature, irregular placement, shadow, or letter spacing. Those appear to be mostly engine-rendered.

Practical options:

- Use existing `country` map names but improve font globally if supported.
- Replace or extend font files in `fonts/in_game_fonts.font`.
- Use Noto Serif already included by vanilla as a safer antique direction.
- Do not rely on curved/irregular country labels unless a later test finds a hardcoded renderer setting.

Recommended first test:

- duplicate `in_game/fonts/in_game_fonts.font` into the mod
- redirect one loaded serif font definition to an antique serif `.ttf`
- test whether map labels inherit it

If labels do not change, map labels are engine-defined and only name content / color is safely controllable.

### 8. Terra incognita and mythical ocean art

There is a real exposed texture:

- `gfx/map/flatmap/terra_incognita.dds`

This is the safest place for a parchment/unexplored-world mood. It can likely be replaced with a darker parchment fog texture.

Hard limitation:

I found script triggers for discovery and exploration, and `map_modes.txt` has `use_fow = yes/no`, but I did not find an exposed, data-driven rule like "draw this decal only if area is undiscovered". Therefore truly dynamic sea monsters tied to the player's exploration state may not be possible through normal data files.

Recommended workaround:

- Use `terra_incognita.dds` for general mystery texture.
- Use static ocean decals for decorative sea beasts, compass roses, wind faces, and rhumb lines in distant seas.
- Place them where most Bronze Age starts will not have full knowledge.
- Keep them faded enough that they are acceptable even after discovery.

## Sea Monster / Maritime Decoration Methods

### Method A: Terra incognita texture replacement

Best for:

- general unknown-world atmosphere
- parchment fog
- faded map grain

Files:

- `in_game/gfx/map/flatmap/terra_incognita.dds`

Pros:

- safest
- discovery-compatible because it uses the game's own TI layer

Cons:

- cannot place unique creature art by exact sea region unless the texture itself supports visible patterning

### Method B: Terrain decals

Files involved:

- `in_game/terrain_decals.json`
- `in_game/gfx/terrain2/decals/decal_definitions.txt`
- custom folder such as `in_game/gfx/terrain2/decals/bronze_atlas_leviathan_01/`

Vanilla already places large decals over the world through `terrain_decals.json`, including 16 heightmap tiles. This is the best candidate for map-wide decorative art.

Use for:

- sea monster engravings
- compass roses
- rhumb lines
- faded sea route marks
- coastal myth symbols

Recommended decal asset format:

- diffuse/albedo with transparent alpha
- subtle normal or flat normal
- low opacity in texture itself
- large scale
- no bright color

Pros:

- precise placement
- mod-friendly if decal definitions are accepted
- good for static art

Cons:

- probably not tied to discovery state
- too many large alpha decals can hurt performance

### Method C: Map objects

Files involved:

- `gfx/map/map_objects/layers.txt`
- `gfx/map/map_objects/*.txt`
- `gfx/models/.../*.asset`

This is more complex. Map objects use meshes, binary transforms, layers, and PDX mesh assets. It is useful for physical models, not ideal for flat old-map drawings.

Recommendation:

- use map objects only if decals fail
- avoid binary locator workflows unless a map editor pipeline is available

### Method D: Water texture baked decorations

Files:

- `watercolor_rgb_waterspec_a.dds`
- `flowmap.dds`
- `foam_map.dds`

You can bake faint rhumb lines or sea drawings into water color textures, but this is risky because water textures may tile or stretch.

Recommendation:

- use only subtle noise / color variation here
- do not bake detailed art into repeating water textures

### Method E: GUI overlay

Potentially possible only for fixed screen-space decoration. It will not align naturally with map geography.

Recommendation:

- avoid for sea monsters
- use only for decorative frame/atlas UI if desired later

## Recommended Mod Folder Layout

```text
in_game/
  gfx/
    map/
      flatmap/
        flatmap_detail.dds
        flatmap_staticbackup.dds
        terra_incognita.dds
        flatmap_materials.txt
        material_textures/
          flatmap_desert.dds
          flatmap_farmland.dds
          flatmap_hills.dds
          flatmap_marsh.dds
          flatmap_mountain.dds
          flatmap_pine.dds
          flatmap_plains.dds
          flatmap_woods.dds
      water/
        water.settings
        watercolor_rgb_waterspec_a.dds
        foam_ramp.dds
      borders/
        border_country.dds
        border_province.dds
        border_location.dds
      post_effects/
        posteffect_volumes.txt
        colorcorrection_neutral.tga
    terrain2/
      decals/
        decal_definitions.txt
        bronze_atlas_sea_beast_01/
        bronze_atlas_compass_01/
        bronze_atlas_rhumb_lines_01/
  terrain_decals.json
  fonts/
    in_game_fonts.font
    BronzeAtlas/
      BronzeAtlasSerif.ttf
```

## Art Workflow

Recommended tools:

- Krita or Photoshop for 2D painting
- GIMP with DDS plugin as fallback
- Intel Texture Works or NVIDIA Texture Tools for DDS export
- Substance Designer only for procedural parchment/noise if desired

Texture export:

- DDS with mipmaps
- BC7 for high quality color textures when supported
- BC3/DXT5 for alpha decals if BC7 alpha causes issues
- avoid uncompressed huge textures

Parchment workflow:

1. Create base paper grain in grayscale.
2. Add warm beige color map.
3. Add subtle stain/noise layers.
4. Paint terrain readable colors on top.
5. Keep alpha/contrast gentle.
6. Test at close, mid, and flatmap zoom.

Engraving workflow for sea art:

1. Draw in dark brown ink, not black.
2. Add rough paper erosion mask.
3. Lower opacity to 20-45 percent.
4. Add slight blur or antialiasing for zoomed map.
5. Avoid high-frequency hatch density that shimmers with mipmaps.

## Implementation Roadmap

### Phase 1: Safe palette pass

- Remap country colors to muted pigments.
- Keep every country distinct.
- No texture work required.

Risk: low.

Status: implemented in the local mod.

Files updated:

- `in_game/setup/countries/_default.txt`
- `in_game/setup/location_painter/00_location_painter.txt`

Validation:

- 456 country setup colors remapped.
- 405 Location Painter colors remapped.
- Shared tags use matching colors in both files.
- No duplicate country colors in `_default.txt`.
- RGB channel range after remap: 46-184.

### Phase 2: Flatmap parchment pass

- Override flatmap material textures.
- Override `terra_incognita.dds`.
- Tune `flatmap_materials.txt` only if needed.

Risk: low to medium.

### Phase 3: Water and border pass

- Tune `water.settings`.
- Replace water color texture with desaturated maritime blue.
- Replace border DDS with ink-line versions.

Risk: medium because readability can degrade.

### Phase 4: Decorative decal pass

- Add 6-12 large maritime decals first.
- Place them in Atlantic, far Indian Ocean, remote Mediterranean corners, and open seas.
- Test performance and visibility.

Risk: medium because decal support for custom definitions must be validated.

### Phase 5: Font and label experiment

- Try antique serif via `fonts/in_game_fonts.font`.
- If map labels do not inherit it, stop there and avoid fighting engine rendering.

Risk: medium.

### Phase 6: Post-effect LUT

- Add a very gentle warm LUT only after the rest is readable.

Risk: medium to high if overdone.

## Practical Limitations

- Country label curvature, irregular placement, and letter spacing are probably not exposed in normal text data.
- Dynamic "show sea beast only in undiscovered ocean" was not found in exposed files.
- The practical version is: parchment TI + static faded ocean decals + muted water + old-map flatmap.
- Shaders are referenced in assets, but replacing shader behavior is risky and should be avoided unless absolutely necessary.
- Map object placement appears partly binary/generated and is not the first-choice route for flat illustrated art.

## Recommended Final Look

Use a layered approach:

- political colors are dusty pigments
- flatmap is parchment
- TI is darkened old paper with faint marks
- borders are brown ink
- water is desaturated blue-green ink wash
- sea art is static, faded, and sparse
- post-effect is gentle, not heavy sepia

That gives the player the feeling of a Bronze Age atlas while preserving EU5's map readability.
