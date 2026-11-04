# The kit and the cast

The **kit** is what makes an app look like Apex: three.js, the companion
runtime, props and a world renderer, versioned together. The **cast** is the
person's companions as characters in your app. Both are offers: an app with
its own art and characters doesn't need either.

## The kit

Add `"kit": 1` to a `"build": "kit"` app. Apex then adds an import map to the
app's pages, so these bare names work:

| Import | What it is |
|---|---|
| `three` | three.js 0.186.1, the version the companions use |
| `three/addons/loaders/GLTFLoader.js` | |
| `three/addons/libs/meshopt_decoder.module.js` | |
| `three/addons/utils/BufferGeometryUtils.js` | |
| `three/addons/utils/SkeletonUtils.js` | |
| `three/addons/controls/OrbitControls.js` | |
| `apex-kit/character.js` | A companion in your own scene |
| `apex-kit/guide.js` | The person's companion in a corner of the page, with a speech bubble |
| `apex-kit/props.js` | Twenty props in the companions' style, coloured from a palette |
| `apex-kit/world.js` | A world file as a three.js scene |

The kit's files are served inside your app's own origin at `/__apex/kit/1/`,
so modules, workers and cross-origin isolated apps load them like your own
files. Your pack stays small: the libraries and art aren't in it.

A kit major never changes under you: an app that says `"kit": 1` gets kit 1's
versions whatever Apex version runs it. Not in kit 1 yet: Phaser, Preact,
Rapier, and walk, run and jump clips. For 2D, use plain canvas or the DOM, or
bundle a library yourself in a `"bundled"` app.

### A companion in your scene

```js
import * as THREE from 'three'
import { character } from 'apex-kit/character.js'

const [member] = await apex.cast.members()
const pip = await character(member.look, { mood: 'idle' })
scene.add(pip.object3d)

// every frame
pip.update(dt)

// every few seconds
pip.blink()

// when something happens
pip.setMood('happy')

// when you're done
pip.dispose()
```

- `character(look, { mood })` resolves to `{ object3d, bounds, update(dt),
  setMood(mood, fade?), blink(), dispose() }`. Pass the member's `look`, not
  the member.
- Moods: `idle`, `listening`, `thinking`, `working`, `talking`, `approval`,
  `happy`, `sad`, `sleeping`. Each has its clip and face.
- `bounds` is the rest pose's `{ min: [x, y, z], max: [x, y, z] }`, for
  placing and framing.
- Scale: +Y is up, and 1 unit is about the height of the round rig's body.
- Light it with a `HemisphereLight` and a `DirectionalLight`.
  `MeshToonMaterial` matches the companions' flat, toon-shaded look.

### The guide

```js
import { guide } from 'apex-kit/guide.js'

const g = await guide({ corner: 'bottom-right', size: 160 })
g.say('Drag the pieces onto the board.', { mood: 'happy' })
g.quiet()        // hides the bubble
g.show(false)    // hides the guide
g.dispose()
```

The guide draws the first member of the cast, so the app needs `cast`;
`guide()` rejects when there is nobody. `say(text, { mood, ms })` shows the
bubble for `ms`, or until the next `say`. `corner` is `bottom-right` or
`bottom-left`; `size` 96 to 320 pixels.

### Props

```js
import { prop, PROPS, PALETTES } from 'apex-kit/props.js'

const bench = prop('bench', { palette: 'meadow', tint: { accent: '#ff8a5c' } })
scene.add(bench) // a Group standing on y = 0
```

Ids: `tree`, `pine`, `bush`, `flowers`, `rock`, `bench`, `table`, `chair`,
`lamp`, `fence`, `house`, `shop`, `stall`, `counter`, `table-tennis-table`,
`fountain`, `sign`, `crate`, `barrel`, `umbrella`. `PROPS` lists each id's name
and footprint in tiles; `PALETTES` holds the colours of `meadow`, `seaside`,
`city`, `snow` and `dusk`.

### A world in your scene

```js
import { createWorldView } from 'apex-kit/world.js'

const view = createWorldView(worldFile)
scene.add(view.root, view.lights)
scene.background = view.sky
```

`view.ground` is the mesh to raycast for a tile, `view.fog` has `near` and
`far`, `view.setLabels(visible)` shows the places' outlines and names,
`view.rebuild(changedWorld)` redraws it, and `view.dispose()` frees it.

### Bundled apps and the kit

A bundled app can't import the kit's JavaScript modules: they need the kit's
own three.js. It can still load kit files by address (`/__apex/kit/1/…`) and
draw the cast's looks its own way.

## The cast

Add `cast` to the app:

```json
{ "id": "main", "name": "Paddles", "build": "kit", "kit": 1, "kind": "game", "cast": { "min": 1, "max": 2 } }
```

The review then says the app "uses your companions as characters (their
names and looks, never what they know)".

```js
const members = await apex.cast.members()
// [{ ref, name, rig, look }]: who the person picked for this app, else their active companion

const picked = await apex.cast.pick({ max: 2 })
// Apex asks the person who plays; a cancel keeps the cast as it was
```

- `look` is the companion's rig, parts, face and colours: part ids and colours
  only. It is safe to send to other players if your app is online, and
  `character(look)` draws it.
- `ref` is opaque, stable within your app, and different in every other app.
  Never store or show it as a name, and don't try to match companions across
  apps.
- Your app never gets a companion's personality, instructions, memory, chats
  or settings, nor the companions the person didn't pick.

### Lines in character

With `permissions.model` and `permissions.speak`:

```js
const line = await apex.cast.speak(member.ref, { situation: 'lost a long rally 9-11', mood: 'disappointed' })
```

Apex writes one short line (about 25 words at most) from the companion's
personality. Your app sends only the situation and gets back the text.
Each line counts toward the pack's model budget. Show it as text.

### When the cast is empty

`members()` can be `[]`: in Apex's playtest, or before the person has a
companion. Draw a stand-in (a simple shape, a default name) instead of
failing. See [hello-kit](../examples/hello-kit).

### Opened from a world

When a world's place opens your app, `apex.world.context()` returns the cast
there: the visitor's companion first, then the residents of that place.
Guests from the world have refs of their own in your app and speak through
`apex.cast.speak(ref)` like companions. See [worlds.md](worlds.md).
