# `window.apex`

Every page of a pack (its apps, its panels, its new tab cards' and tools'
host) gets `window.apex`. Each call goes to Apex, which checks the page, the
pack and the permission before doing anything.

- Almost every call returns a promise. A refused call **rejects** with an
  `Error` whose message is a sentence you can show ("A pack can use the model
  60 times an hour.").
- Arguments are checked. Sizes beyond the limits below are refused.
- "App pages" means pages under an app's `root`. Panels and tools can't use
  the calls marked *apps*.

This page lists what works today. Not yet available: `apex.cast.sprites()` and
`apex.cast.model()` (companions as sprites or glTF for bundled apps),
`apex.guide.say()`, Apex Rooms (`apex.rooms`) and the phone controller
(`apex.pad`).

## The pack

| Call | Needs | Returns |
|---|---|---|
| `apex.pack` | – | `{ id, name, version }` (a plain object, no call) |
| `apex.env.NAME` | – | The manifest's `env` value, a string. In a loaded folder, `.env` / `.env.local` override it; an organisation's `AppConfig` may set it. |
| `apex.log(...values)` | – | Writes a line (up to 10,000 characters) to the pack's log. |

## Storage

| Call | Needs | Notes |
|---|---|---|
| `apex.storage.get(key)` | – | The value, or `null`. |
| `apex.storage.set(key, value)` | – | Any JSON value. 1 MB per pack in all. |
| `apex.storage.remove(key)` | – | |
| `apex.storage.keys()` | – | All keys. |

Keys are 1 to 200 characters. A pack's pages also share `localStorage`,
IndexedDB and the origin private file system in the pack's own partition;
games usually keep saves there. Removing the pack removes all of it.

## Network

| Call | Needs | Notes |
|---|---|---|
| `fetch`, `WebSocket`, `EventSource`, `<img>`, `<audio>`, `<video>` to your hosts | *apps*; the host in `permissions.network` | Normal CORS. The page's origin is `apex-pack://<pack id>`. https and wss; http and ws only to `localhost` and `127.0.0.1`. Scripts, styles, fonts and frames never load from a host. No WebRTC. |
| `apex.fetch(url, init)` | the host in `permissions.network` | Runs in Apex, not the page: no CORS, no cookies. `init`: `{ method, headers, body }`, method `GET`, `HEAD`, `POST`, `PUT`, `PATCH` or `DELETE`, body a string up to 1 MB. Resolves `{ ok, status, statusText, headers, body, url, text(), json() }`; the body is text, up to 5 MB; 20 s timeout. |
| `apex.open(url)` | the host in `permissions.network` | Opens the address in a new tab. At most 5 a minute. |

A secret or sign-in for a host goes on these requests automatically (below).

## Keys and sign-in

| Call | Needs | Returns |
|---|---|---|
| `apex.secrets.status()` | `secrets` in the manifest | `{ NAME: true \| false }`: whether each secret has a value. Never the value. |
| `apex.secrets.request(NAME)` | that secret | Opens the pack's page at that key so the person can enter it. Resolves `{ set: true }` once they save it, or `{ set: false }` after ten minutes. |
| `apex.auth.status()` | `auth` in the manifest | `{ id: { signedIn, user } }`. `user` is the email, username or name from the ID token (the first it has), or `null`. Never a token. |
| `apex.auth.signIn(id)` | that sign-in | Opens the identity provider in a tab. Resolves `{ signedIn, user }` once the person is signed in; rejects if they cancel or it fails. After a cancel, asking again within ten seconds is refused, so call it from a click. |
| `apex.auth.signOut(id)` | that sign-in | Forgets the tokens on this computer. |

See [servers-keys-and-sign-in.md](servers-keys-and-sign-in.md).

## Connectors

| Call | Needs | Returns |
|---|---|---|
| `apex.connectors.status()` | `permissions.connectors` | `{ ref: { connected, name } }` for each connector the manifest names. |
| `apex.connectors.tools(ref)` | the connector in `permissions.connectors` | `[{ name, title, description, readOnly, inputSchema }]`: the tools the person has on. |
| `apex.connectors.call(ref, tool, input)` | the same | `{ text, data, isError }`. Runs as the person set the tool: off refuses, "ask" asks them each time. `input` is checked against the tool's schema. |
| `apex.connectors.connect(ref)` | the same | Opens Apex's Connectors at that service so the person can connect it. |

See [connectors.md](connectors.md).

## AI

| Call | Needs | Returns |
|---|---|---|
| `apex.ai.ask(prompt, { system, tier, maxTokens })` | `permissions.model` | The reply as text. |
| `apex.ai.json(prompt, { schema, system, tier, maxTokens })` | `permissions.model` | A value that fits the JSON Schema (checked, asked again once). |
| `apex.ai.stream(prompt, { onText, system, tier, maxTokens })` | `permissions.model` | Calls `onText(piece)` as the reply arrives; resolves to the whole reply. |
| `apex.ai.session({ system, tier, tools })` | `permissions.model` | A conversation: `send(text)` resolves to the reply, `history()`, `close()`. Tools are `{ name, description, input, run(input) }` and run in your page. |
| `apex.ai.decide(state, questions)` | `permissions.model` | Typed answers with probabilities and no text: `{ answers, source, model, ms }`. Questions are yes or no (`noul`), one of 2 to 64 options (`choice`) or a level on 2 to 10 steps (`score`). |
| `apex.ask(prompt, { system })` | `permissions.model` | The older one-shot call (prompt up to 20,000 characters, system 4,000). Prefer `apex.ai`. |

`tier` is `"fast"` (the default) or `"smart"`. Prompts up to 50,000 characters,
`system` up to 8,000, `maxTokens` 1 to 8,000 (default 2,000). Every model call
counts toward the pack's budget: 60 an hour and 500 a day. `decide` has its
own budget (600 an hour, 5,000 a day) when the person has a decision model on.
See [ai.md](ai.md).

## The cast

| Call | Needs | Returns |
|---|---|---|
| `apex.cast.members()` | *apps*; `cast` on the app | `[{ ref, name, rig, look }]`: who the person picked for this app, else their active companion. Up to `cast.max`. |
| `apex.cast.pick({ max, title })` | *apps*; `cast` on the app | Apex asks the person who plays (up to `max`, 1 to 8, never more than `cast.max`). Resolves to the new members; a cancel keeps the old ones. |
| `apex.cast.speak(ref, { situation, mood })` | *apps*; `cast`, `permissions.model` and `permissions.speak` | One line in character, written by Apex from the companion's personality. `situation` up to 1,000 characters, `mood` up to 60. |

See [kit-and-cast.md](kit-and-cast.md).

## Worlds

| Call | Needs | Returns |
|---|---|---|
| `apex.world.context()` | – | `{ world: { ref, name, palette, sky }, place: { id, name }, cast: [{ ref, name, look, guest, role }] }` when a world's place opened this app, else `null`. |
| `apex.worlds.list()` | `permissions.worlds` | Every world: the person's own, then those packs bring. |
| `apex.worlds.get(ref)` | `permissions.worlds` | `{ world, residents, editable }`; `residents` says who fills each open spot. |
| `apex.worlds.save(world, { copy })` | `permissions.worlds` | Saves a world as one of the person's own; `copy: true` gives it a new id. |
| `apex.worlds.remove(ref)` | `permissions.worlds` | The person's own worlds only. |
| `apex.worlds.apps()` | `permissions.worlds` | `[{ pack, app, name, packName, kind }]`: apps a place can open. |
| `apex.worlds.enter(ref, placeId)` | `permissions.worlds` | Opens the place's app with the residents there as its cast: `{ opened: true }`, or `{ opened: false, missing: { pack, app }, installed }`. |
| `apex.worlds.speak(ref, residentId, { situation, mood })` | `permissions.worlds`, `model` and `speak` | One line from a resident. |
| `apex.worlds.find(packId)` | `permissions.worlds` | Opens Browse at that pack. |
| `apex.worlds.share(ref)` | `permissions.worlds` | Saves one of the person's worlds as an `.apexworld`; the path, or `null`. |

A world `ref` is `own:<id>` or `pack:<pack id>/<path>`. See [worlds.md](worlds.md).

## Files

| Call | Needs | Returns |
|---|---|---|
| `apex.files.open({ accept, multiple })` | `permissions.files` | `[{ name, size, data }]` (`data` a `Uint8Array`), `[]` if cancelled. Up to 50 files, 50 MB each. `accept`: up to 30 extensions such as `".md"`. |
| `apex.files.save(name, data)` | `permissions.files` | The person picks where. `data` is a string or `Uint8Array` up to 50 MB. `{ saved, name }`. |
| `apex.files.folder()` | `permissions.files` | Asks once for a folder the pack may read and write, and keeps it until the person takes it back. `{ name }`, or `null`. |
| `apex.files.list(path)` | a picked folder | `[{ name, kind: "file" \| "folder", size }]`, up to 2,000. `path` defaults to the folder itself. |
| `apex.files.read(path)` | a picked folder | A `Uint8Array`, up to 50 MB. |
| `apex.files.write(path, data)` | a picked folder | Creates folders as needed. |
| `apex.files.own({ accept, multiple, folder, note })` | `permissions.files` | Copies files of the person's own into the app's private space: `{ files: [paths] }`. Up to 10,000 files and 2 GB. `note` (300) is the picker's title. |
| `apex.files.ownUrl(path)` | – | The address of one of those copies (no promise). |

Paths stay inside the folder: no `..`, nothing absolute. See
[files-assets-notifications.md](files-assets-notifications.md).

## Asset slots

| Call | Needs | Returns |
|---|---|---|
| `apex.assets.url(slot, path)` | *apps*; the slot in the app's `assets` | The address of a slot file (no promise, works in `src`): the chosen asset pack's file, else the app's own `<layout>/<path>`. |
| `apex.assets.active(slot)` | the same | `{ pack, packName, set, setName }`, or `null` when the app's own files are used. |

## Notifications

| Call | Needs | Notes |
|---|---|---|
| `apex.notify({ title, body })` | `permissions.notifications` | Now. Title 1 to 120 characters, body up to 500. |
| `apex.notifications.schedule({ id, at, title, body })` | `permissions.notifications` | Later. `at` in ms since the epoch, up to 30 days ahead; `id` `[A-Za-z0-9_-]`, 1 to 64; the same id replaces. At most 50. Fires while Apex runs, even with the app closed; one missed while Apex was closed fires if it is less than an hour late. |
| `apex.notifications.cancel(id)` | `permissions.notifications` | |
| `apex.notifications.list()` | `permissions.notifications` | The scheduled ones. |

## Clipboard

| Call | Needs | Notes |
|---|---|---|
| `apex.clipboard.write(text)` | `permissions.clipboard` | Up to 100,000 characters. |

## Asking for more

| Call | Needs | Returns |
|---|---|---|
| `apex.permissions.request({ network, sites, notifications, model, clipboard })` | the same in `optionalPermissions` | Shows the person the plain-words lines. `{ granted }`. A refusal holds for the session; the person can take a grant back on the pack's page. |

## The sidebar row

| Call | Needs | Notes |
|---|---|---|
| `apex.status.set({ text, badge, progress })` | *apps* | Shows on the app's sidebar row and tab while the app is open. `text` up to 40 characters, `badge` an integer 0 to 999, `progress` 0 to 1; `null` clears one. |
| `apex.status.clear()` | *apps* | |

## A server on this computer (apps)

With `permissions.server`, an app's own page can run a small web server that
other devices open: phones as game controllers, a second screen, local
multiplayer, a tool a colleague opens on the same Wi-Fi. Apex runs the server.
Your page only sees the requests and messages that passed Apex's checks.

| Call | Needs | Returns |
|---|---|---|
| `apex.server.start({ lan, root, token, maxConnections })` | *apps*; `permissions.server` | Starts the server, or tells you about the running one: `{ running, url, lanUrl, port, qr, lan, token, connections }`. `lan: true` (with `"lan": true` in the manifest) opens it to the Wi-Fi. `root` is the pack folder it serves. `token: false` serves at `/` instead of under an unguessable token. `maxConnections` up to 32 (default 16). `qr` is an image data URL of `lanUrl` to show in your page. |
| `apex.server.stop()`, `apex.server.status()` | the same | Stops it; what runs now. |
| `apex.server.onRequest(async (req) => …)` | the same | Answers requests that no file in `root` answers. `req` is `{ method, path, query, headers, body, json }`. Return text, `{ status, headers, body }`, or any value to send as JSON. |
| `apex.server.onConnection((socket) => …)` | the same | A served page opened a socket: `socket.id`, `socket.query`, `socket.remote` (`"local"` or `"lan"`), `socket.send(data)`, `socket.close(code)`, `socket.onMessage((value, text) => …)`, `socket.onClose((code) => …)`. |
| `apex.server.broadcast(data)`, `apex.server.sockets()` | the same | Sends to every socket; the sockets open now. |
| `apex.server.onStop((reason) => …)` | the same | `"stopped"` (your `stop()`), `"person"` (Stop on Apex's bar), `"idle"` or `"closed"` (the page or the pack went away). |

```js
// In the app
const s = await apex.server.start({ lan: true, root: 'phone' })
qr.src = s.qr                 // show it, with s.lanUrl as text
apex.server.onConnection((socket) => {
  socket.onMessage((msg) => move(socket.id, msg))
  socket.onClose(() => leave(socket.id))
})
```

```html
<!-- phone/index.html, served to the phone -->
<script src="__apex/client.js"></script>
<script src="phone.js" defer></script>
```

```js
// phone/phone.js
const link = apexServer.connect({ query: { name: 'Sam' } })
link.onMessage((value) => buzz(value))
button.addEventListener('click', () => link.send({ t: 'tap' }))
```

What it serves, under `/<token>/`:

- the `root` folder of your pack as it is: a folder serves its `index.html`,
  nothing is listed, nothing outside it is reached;
- `__apex/client.js`: `apexServer.connect({ query })` gives `send`, `onOpen`,
  `onMessage`, `onClose` and `close`, and reconnects by itself;
- `__apex/socket`: the WebSocket to your app's page;
- `__apex/kit/…`: Apex UI and the kit, so served pages can look like Apex;
- anything else goes to `onRequest` (404 without a handler).

Rules:

- Without `lan` it listens on this computer only, over http. With `lan` it
  listens on the Wi-Fi over https with Apex's own certificate. A phone warns
  about the certificate once (tell people to go on); phones give motion
  sensors only to secure pages. On a Mac, macOS asks once whether Apex may
  accept incoming connections: tell people to choose Allow.
- Only this computer and private networks get in. A request must name this
  server in its Host header, and a page's Origin must be the server's own, so
  other sites can't drive your app.
- Messages are text; objects go as JSON. 16 KB a message in, 64 KB out, 120
  messages a second per socket (enough for motion at 60 Hz). 60 requests a
  second, bodies up to 64 KB, answers up to 2 MB within 10 s.
- It lives as long as the page that started it. Closing, reloading or leaving
  the page stops it, and so do turning the pack off, `stop()`, Stop on Apex's
  bar and 15 minutes with no request and no socket. The tab doesn't sleep
  while it runs.
- While it runs, Apex draws its own bar over your app's tab: that the app is
  sharing on the Wi-Fi (or running a server on this computer), how many are
  connected, and Stop. Your app can't draw over it.
- The token stays the same while Apex runs, so phones reconnect after your
  app reloads. It is new when Apex starts, and thrown away when the person
  presses Stop. The port is kept per app, so a bookmark keeps working.
- In a playtest the server runs on this computer only: start with `lan`, and
  if that fails, start without it.

## Services and events

| Call | Needs | Notes |
|---|---|---|
| `apex.services.call(service, method, input)` | the service in `uses` | Input checked against the method's schema; the answer is JSON, up to 1 MB; 30 s timeout. |
| `apex.services.provide(service, { method: async (input, ctx) => … })` | the service in `provides` | Serves it from this page while it is open. `ctx.from` is the calling pack's id, or `"companion"`. |
| `apex.events.on(name, fn)` | the name in `events.on` | Returns a function that stops listening. |
| `apex.events.emit(name, data)` | the name in `events.emits` | Others hear it as `<your pack id>/<name>`. Up to 64 KB, 50 a second. |

See [services-and-events.md](services-and-events.md).

## Reading the page (panels and tools)

"The page" is the web tab the person last used in the panel's window, or the
chat's own tab for a tool. Private windows and sign-in pages are never read.

| Call | Needs | Returns |
|---|---|---|
| `apex.page.info()` | the page's host in `permissions.sites` | `{ url, title }`, or `null`. |
| `apex.page.text()` | the same | The visible text, up to 100,000 characters. |
| `apex.page.query(selector)` | the same | The text of up to 50 matching elements. |

## Tools for the companion

A pack's `contributes.tools` modules run in a hidden page Apex makes. Each
module exports `async function run(input, ctx)` and returns a string or
anything JSON can hold; a call times out after 60 s. `apex.tools.serve()`
exists only in that page and Apex calls it for you.

## Testing

| Call | Needs | Notes |
|---|---|---|
| `apex.test.ready(state)` | – | What Apex's playtest reads: any JSON (up to 64,000 characters). Call it whenever the state changes; every frame is fine, as Apex sends it only when it changes and at most four times a second. Ignored outside a test. |

Write `apex.test?.ready(...)` if your code may also run outside Apex.
