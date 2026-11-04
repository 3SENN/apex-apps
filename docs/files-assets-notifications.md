# Files, assets and notifications

## Files: `permissions.files`

One permission covers all of `apex.files`. The review says the pack "can open
and save files you choose, keep a folder you pick, and ask for files of your
own".

### Files the person picks

```js
const files = await apex.files.open({ accept: ['.txt', '.md'], multiple: true })
// [{ name, size, data: Uint8Array }], [] when cancelled
const text = new TextDecoder().decode(files[0].data)

const { saved, name } = await apex.files.save('story.md', text) // the person picks where
```

- `open`: up to 50 files, 50 MB each. `accept` lists up to 30 extensions.
- `save`: a string or a `Uint8Array`, up to 50 MB. `saved` is `false` when the
  person cancels.

### A folder the person picks

```js
const folder = await apex.files.folder()           // { name }, or null
const entries = await apex.files.list('chapters')  // [{ name, kind: 'file' | 'folder', size }]
const bytes = await apex.files.read('chapters/one.md')
await apex.files.write('chapters/two.md', 'It was a quiet morning.')
```

- `folder()` asks once. Apex keeps the folder for the pack until the person
  takes it back on the pack's page; later calls return it without asking.
- Paths are relative to that folder, `/`-separated, and stay inside it.
- `list` returns up to 2,000 entries; `read` and `write` handle up to 50 MB.

### The person's own files

For data you can't ship: files from a game the person owns, their own photos
or recordings.

```js
const { files } = await apex.files.own({ folder: true, note: 'Choose the data folder from your copy of the game' })
img.src = apex.files.ownUrl(files[0])
```

- Apex copies what the person picks into the app's private space on this
  computer (up to 10,000 files and 2 GB) and serves it read-only inside the
  app's origin. `ownUrl(path)` is the address, at once.
- The files never leave the computer and are never part of the pack: not in
  Export, Share…, Remix or an index. The pack's page lists their size and lets
  the person remove them.

Apex's playtest refuses `apex.files` (nobody is there to pick a file).

## Asset slots and asset packs

An app can let other packs replace some of its files: its art, its voices, a
level set.

### In the app

```json
{
  "id": "main",
  "name": "Hello kit",
  "build": "kit",
  "assets": [
    { "id": "art", "name": "Art", "description": "backdrop.svg and palette.json.", "layout": "app/art" }
  ]
}
```

```js
img.src = apex.assets.url('art', 'backdrop.svg')
const palette = await fetch(apex.assets.url('art', 'palette.json')).then((r) => r.json())
const active = await apex.assets.active('art') // { pack, packName, set, setName } or null
```

- A slot has an `id` (unique in the pack), a `name` (up to 60), a
  `description` (up to 500) and an optional `layout`: the app's own folder
  for the slot, inside its `root`. At most 10 slots an app.
- `apex.assets.url(slot, path)` returns at once, so it works in `src`
  attributes and CSS. It serves the chosen asset pack's file, or the app's own
  `<layout>/<path>` when no pack is chosen **or** the chosen pack lacks that
  file. A pack can replace just some files.
- Without `layout`, document the slot's files in `description` or a README.
- The person picks a pack on the app's page, under **Look and sound**. The app
  reloads, so it never has to swap art while it runs.

### An asset pack

```json
{
  "format": "apex-pack",
  "manifestVersion": 2,
  "id": "hello-kit-winter",
  "name": "Hello kit: winter",
  "version": "1.0.0",
  "description": "A snowy backdrop and cold colours for Hello kit.",
  "contributes": {
    "assets": [{ "id": "winter", "name": "Winter", "for": { "pack": "hello-kit", "app": "main", "slot": "art" }, "root": "winter" }]
  }
}
```

- Files only: images, sound, video, fonts, models, JSON and text. `.html`,
  `.htm`, `.xhtml`, `.js`, `.mjs`, `.cjs` and `.wasm` are refused. SVG is
  served with a sandboxing CSP, so it runs nothing.
- Keep the app's file names (copy its `layout` folder and change files).
- The review says only "Changes how Hello kit looks or sounds".
- An asset pack gets the larger limits (5,000 files, 50 MB each, 300 MB).
- Share only art you made, licensed, or took under an open licence, with its
  credits.

See [hello-kit](../examples/hello-kit) and [winter-art](../examples/winter-art).

## Notifications: `permissions.notifications`

```js
await apex.notify({ title: 'Your bread is ready', body: 'Come and take it out.' })

await apex.notifications.schedule({ id: 'bread', at: Date.now() + 20 * 60_000, title: 'Your bread is ready', body: 'Come and take it out.' })
await apex.notifications.cancel('bread')
const pending = await apex.notifications.list()
```

- `title` 1 to 120 characters, `body` up to 500.
- A scheduled notification fires while Apex runs, **even with the app
  closed**. One missed while Apex was closed fires when it starts again, if
  it is less than an hour late.
- The same `id` replaces the earlier one. At most 50, up to 30 days ahead.
- Clicking one opens the app, or brings its open tab forward. For a pack with
  several apps (or none), it opens the pack's page.

Use scheduled notifications instead of keeping a page running: a game that
keeps time catches up from the clock when it opens again.

## Asking for more: `optionalPermissions`

Install with the least, and ask for the rest when a feature needs it:

```json
"optionalPermissions": { "network": ["api.weather.example"], "notifications": true }
```

```js
const { granted } = await apex.permissions.request({ notifications: true })
if (!granted) showWhyItHelps()
```

- `network`, `sites`, `notifications`, `model` and `clipboard` can be optional.
- Nothing optional is granted at install; the review says only that the pack
  may ask for more.
- `request` shows the person the same plain-words lines as the review. A
  refusal holds for the rest of the session. The person can take a grant back
  on the pack's page at any time.
- Ask right after the person chose the feature, with a sentence that says why.
