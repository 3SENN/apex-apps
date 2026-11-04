# Worlds

A world is a place to walk around in: a grid of ground, kit props, named
places, residents and a sky. The person walks it as their companion; stepping
into a place opens that place's app, with the residents there as its cast.

A world is data. It runs no code, so a pack that holds only worlds asks for no
permissions. It travels as `.apexworld`.

```json
"manifestVersion": 2,
"contributes": { "worlds": ["worlds/riverside.json"] }
```

Apex's own Worlds app shows worlds and edits the person's own. It comes
turned off; opening a world (the pack page's **Open**) turns it on. See the
[world example](../examples/world).

## The file

```json
{
  "format": "apex-world",
  "version": 1,
  "id": "riverside",
  "name": "Riverside",
  "description": "A small town by a river.",
  "palette": "meadow",
  "sky": "morning",
  "size": [24, 18],
  "ground": {
    "base": "grass",
    "paint": [
      { "type": "path", "area": [0, 8, 23, 9] },
      { "type": "water", "area": [0, 14, 23, 17] },
      { "type": "boards", "area": [15, 12, 17, 17] }
    ]
  },
  "props": [
    { "kit": "fountain", "at": [13.5, 0, 4] },
    { "kit": "stall", "at": [16, 0, 3], "turn": 270, "tint": { "accent": "#ff8a5c" } }
  ],
  "places": [
    { "id": "arcade", "name": "Arcade corner", "area": [2, 2, 7, 6], "opens": { "pack": "hello-kit", "app": "main" } },
    { "id": "jetty", "name": "The jetty", "area": [15, 12, 17, 17] }
  ],
  "residents": [
    { "id": "otto", "home": "jetty", "at": [16, 15], "role": "Rents out rowing boats", "guest": { "name": "Otto", "look": { "…": "…" }, "personality": "Slow to speak and quick to laugh." } },
    { "id": "visitor", "home": "arcade", "role": "Plays in the arcade", "companion": "local" }
  ],
  "spawn": [12, 9],
  "camera": { "at": [12, 16, 30], "lookAt": [12, 0, 8] }
}
```

(`look` is shortened here; see the full file in the example.)

| Field | Type | Rules |
|---|---|---|
| `format` | `"apex-world"` | required |
| `version` | `1` | required |
| `id` | string | `^[a-z0-9][a-z0-9-]{0,47}$`. Unique among the pack's worlds. |
| `name` | text | Up to 80. |
| `description` | string | Up to 500. |
| `palette` | `meadow`, `seaside`, `city`, `snow`, `dusk` | Colours the props and ground. |
| `sky` | `morning`, `midday`, `late-afternoon`, `dusk`, `night` | Light, background and fog. |
| `size` | `[width, depth]` | Integers, 8 to 128 tiles each. |
| `ground.base` | a ground type | The whole grid. |
| `ground.paint` | `[{ type, area }]`, up to 2,000 | Painted rectangles; the last paint covering a tile wins. |
| `props` | `[{ kit, at, turn?, tint? }]`, up to 5,000 | Kit props only. |
| `places` | `[{ id, name, area, opens? }]`, up to 64 | Named areas. |
| `residents` | up to 32 | Guests and open spots. |
| `spawn` | `[x, z]` | Where the visitor starts; else the middle. |
| `camera` | `{ at: [x, y, z], lookAt: [x, y, z] }` | Where the camera starts, for the first frame and the share picture. |

A world file is at most 2 MB; a pack holds at most 10 worlds; a person keeps
at most 100 of their own.

### Coordinates

- One unit is one tile, about a companion's height. `x` runs across, `z`
  runs into the picture, `y` is up.
- An **area** is `[x0, z0, x1, z1]` in whole tiles, both corners included,
  with `x0 ≤ x1` and `z0 ≤ z1`. It must lie inside the world: `x1` at most
  `width - 1`, `z1` at most `depth - 1`.
- A prop's `at` is `[x, y, z]`, its middle (`y` is usually 0). `x + 0.5`
  centres it on a tile. `turn` is in degrees (-360 to 360).
- A resident's `at` is `[x, z]`; without it, they stand in the middle of
  their home.

### Ground

`grass`, `path`, `sand`, `boards`, `stone`, `floor`, `snow`, and `water`, which
isn't walkable.

### Props

| Id | Footprint | | Id | Footprint |
|---|---|---|---|---|
| `tree` | 1×1 | | `house` | 3×3 |
| `pine` | 1×1 | | `shop` | 3×3 |
| `bush` | 1×1 | | `stall` | 2×1 |
| `flowers` | 1×1 | | `counter` | 2×1 |
| `rock` | 1×1 | | `table-tennis-table` | 2×1 |
| `bench` | 2×1 | | `fountain` | 2×2 |
| `table` | 1×1 | | `sign` | 1×1 |
| `chair` | 1×1 | | `crate` | 1×1 |
| `lamp` | 1×1 | | `barrel` | 1×1 |
| `fence` | 2×1 | | `umbrella` | 1×1 |

`tint: { "accent": "#rrggbb" }` recolours a prop's accent.

### Places

- `id` follows the world id pattern; ids are unique.
- `name` up to 60 characters.
- `opens: { "pack": "<pack id>", "app": "<app id>" }` makes stepping in open
  that app. It may be any pack's app: a world never waits for one. If the
  visitor has it but it's off, Apex turns it on; if they don't have it, Apex
  opens Browse at that pack. A place that opens an app of the world's own
  pack must name one of its apps.

### Residents

Each resident is either a **guest** or an **open spot**, never both:

```json
{ "id": "otto", "home": "jetty", "at": [16, 15], "role": "Rents out rowing boats",
  "guest": { "name": "Otto", "look": { … }, "personality": "Slow to speak and quick to laugh." } }

{ "id": "visitor", "home": "arcade", "role": "Plays in the arcade", "companion": "local" }
```

- `home` names one of the world's places; `role` (up to 120 characters) says
  what they do there, and is also what they talk about.
- A **guest** carries a `name` (up to 24 characters), a `look` and a short
  `personality` (up to 1,000 characters). Never memory or instructions. The
  personality reaches the model as a description of a character, not as
  instructions.
- A **look** is a companion look: `rig` (`A`, `B` or `C`), `parts` (`head`,
  `ears`, `hair`, `hat`, `eyeAccessory`, `earAccessory`, `prop`; all but
  `head` may be `null`), `face` (`eyes`, `brows`, `mouth`) and `colors`
  (`skin`, `hair`, `accent`, `outfit` as `#rrggbb`), from the catalogue below.
  The easiest way to get a look you like is to make the world in Apex's
  Worlds app and copy it from there.
- An **open spot** (`"companion": "local"`) is filled with one of the
  visitor's own companions: they walk as their active companion, and their
  other companions fill the open spots in order.
- Residents talk when the visitor walks up to them: Apex writes one short
  line in character, within the Worlds app's model budget. Nothing runs while
  the world isn't open.

### The look catalogue

| Slot | Ids |
|---|---|
| `head` | `head-round`, `head-oval`, `head-soft-square`, `head-drop`, `head-bean`, `head-cloud` |
| `ears` | `ears-cat`, `ears-bear`, `ears-bunny`, `ears-elf` |
| `hair` | `hair-tuft`, `hair-bob`, `hair-spiky`, `hair-curls`, `hair-bun`, `hair-sideswept`, `hair-pigtails`, `hair-mohawk` |
| `hat` | `hat-beanie`, `hat-cap`, `hat-crown`, `hat-wizard`, `hat-beret`, `hat-flower-crown` |
| `eyeAccessory` | `glasses-round`, `glasses-square`, `monocle`, `visor` |
| `earAccessory` | `headphones`, `earring-hoop`, `earring-star` |
| `prop` | `prop-coffee`, `prop-book`, `prop-laptop`, `prop-wand`, `prop-magnifier`, `prop-balloon`, `prop-keypad` |
| `face.eyes` | `eyes-round`, `eyes-oval`, `eyes-sparkle`, `eyes-sleepy`, `eyes-dot`, `eyes-wide`, `eyes-cat`, `eyes-lash` |
| `face.brows` | `brows-soft`, `brows-bold`, `brows-thin`, `brows-none` |
| `face.mouth` | `mouth-smile`, `mouth-cat`, `mouth-grin`, `mouth-small`, `mouth-fang` |

Some hats only go with some hair and ears; look at the result in the Worlds
app before you publish.

## In the app a place opens

```js
const here = await apex.world.context()
// null when no world opened this app, else:
// {
//   world: { ref, name, palette, sky },
//   place: { id, name },
//   cast: [{ ref, name, look, guest, role }]   // the visitor first, then the residents there
// }
```

Guests get a ref of their own in your app and speak through
`apex.cast.speak(ref, { situation })` like companions (with
`permissions.model` and `permissions.speak`). Draw them with
`character(member.look)`.

## Working with worlds from code

A pack with `permissions.worlds` can list, read, save and open the person's
worlds through `apex.worlds` (see [api.md](api.md#worlds)). The review says it
"shows, changes and opens your worlds, and lets the people in them talk". Most
packs don't need it: shipping a world file is enough.

## Rules Apex checks

- The schema above; unknown keys are refused.
- Every painted area, place area, prop, resident and `spawn` inside the world.
- Place and resident ids unique; every `home` is a place.
- Each resident a guest or an open spot.
- Guest looks use known rigs, parts, faces and colours.
