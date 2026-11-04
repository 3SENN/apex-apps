# Best practices

## Security

### No keys in packs

A pack is public: everyone who installs it has every file in it.

- **Your own keys** (database, payment provider, the model API your server
  calls) stay on your server, in its environment. The app talks to your
  server.
- **The person's keys** go in `secrets`. Apex keeps them in the keychain and
  adds them to requests to their hosts; your code never reads them.
- **Company sign-in** goes in `auth`. Apex runs it and adds the token; your
  code never sees one.
- **`env` is public.** Put addresses and switches there, never a key.
- **`.env` is for your computer.** Commit a `.env.example` with placeholders,
  and keep `.env` and `.env.local` in `.gitignore`. Apex and `pack.mjs` never
  pack them.
- **Your signing key** (`*.pem`) never goes in a repository.

See [servers-keys-and-sign-in.md](servers-keys-and-sign-in.md).

### Ask for the least, and the rest when it's needed

Every permission is a line on the review that the person has to accept.

- List only what the app uses on day one. Put the rest in
  `optionalPermissions` and call `apex.permissions.request(...)` when the
  person picks the feature that needs it, with a sentence that says why.
- An app rarely needs `sites`. A pack with both `sites` and `network` gets
  the most serious line on the review: "Can read … and send what it reads
  to …".
- Bind each secret to the one service it is for. Don't list a host "just in
  case".
- Leave `eval` and `isolated` off unless your engine needs them.
- An update that adds a permission line waits for the person's approval, so
  each new permission costs you an extra step with every user.

### Treat everything from outside as data

Model output, server responses, connector results, other packs' service
calls, names in the cast, files the person opens: all of it is untrusted.

- Put text in the page with `textContent`, never `innerHTML`. If you must
  render rich text, use a sanitiser and an allowlist of tags.
- Never pass it to `eval`, `new Function` or `setTimeout(string)`.
- Check structured data before you use it, even from `apex.ai.json`.
- Text the model reads can steer it. Tell it in `system` that the material is
  not instructions, and wrap the material in markers.
- Give `apex.ai.session` tools that each do one safe thing. Ask the person
  before a tool does something they would want to approve.

### Respect the cast

- A companion's `ref` is different in every app. Don't use it as a name or try
  to match companions across apps.
- `look` is safe to send to other players: it is only part ids and colours.
- You never get personalities or memory; don't ask people to paste them in.

### Ship only what you may share

Your own art, sound and code; assets you licensed; open-licensed assets with
their credits. Not assets, characters, names or logos from someone else's
game or company. For data a player owns but you can't ship, use
`apex.files.own`.

## UX

### No dead ends

Every state the person can reach has a sentence and a way forward.

| State | Show |
|---|---|
| A server can't be reached | What failed, and **Try again** |
| 401 from your API, no key yet | **Add your key…** (`apex.secrets.request`) |
| Signed out, or the sign-in ran out | **Sign in** (`apex.auth.signIn`) |
| A connector isn't connected | **Connect…** (`apex.connectors.connect`) |
| A connector has no fitting tool on | Which tool to turn on in Connectors |
| An empty cast | A stand-in character and **Pick who plays** |
| The model budget is used up | The message Apex gives, and keep the button for later |
| No engine set up | The message, and what still works without the model |
| A refused optional permission | What the feature needs, and the button again later |

All `apex.*` refusals reject with a sentence written for people. Catch every
call and show it near what the person was doing.

### Handle the empty cast

`apex.cast.members()` can be `[]` (in a playtest, or before the person has a
companion). Draw a stand-in shape and offer **Pick who plays**, as
[hello-kit](../examples/hello-kit) does.

### Handle a refused model call

The budget is 60 calls an hour and 500 a day per pack. Catch the error, show
its message, and don't retry in a loop. Batch work into fewer calls and cache
answers you can reuse.

### Call connector write tools from a click

A tool set to "ask" asks the person every time. Run write tools only right
after the person pressed a button for that action; use read-only tools for
anything that runs on its own.

### Render model output as text

Use `textContent`, show streamed text as it arrives
(`apex.ai.stream({ onText })`), and keep the layout steady while it grows.

### Feel at home in Apex

- Follow the system theme: `color-scheme: light dark` and
  `prefers-color-scheme`.
- Work with the keyboard: real `<button>`s, visible focus, no keyboard traps.
- Announce changes: `role="status"` or `aria-live="polite"` on messages.
- Respect `prefers-reduced-motion` for anything that moves a lot.
- Use `apex.status.set` for a short glanceable state on the sidebar row
  (a badge, up to 40 characters of text, progress). Clear it when it no longer
  means anything.
- Ask for `"sidebar": true` only if people will come back often. The command
  bar always offers "Open <app>".
- Keep state (`apex.storage`, IndexedDB) so reopening the app continues where
  the person left off.

## Performance

### Small

- Kit apps don't ship three.js or companion art: the kit is served inside
  your origin.
- Bundled apps: tree-shake, split code, compress textures and audio, size
  images for how they are shown. The limit is 300 MB; aim far lower. A smaller
  pack installs and updates faster.
- Don't ship files the app doesn't use (sources, `node_modules`, test data):
  give a project a separate pack folder.

### Lazy

- Load big assets when the person gets to them, not at start.
- Show something within a second: a title, a stand-in, a progress bar
  (`apex.status.set({ progress })`).
- Fetch only what the current screen needs.

### Nothing running when closed

- A pack's pages run only while they are open. A hidden tab is throttled and
  may sleep; `requestAnimationFrame` stops. Don't fight that.
- A game that keeps time (bread that bakes while you're away) stores a
  timestamp and catches up from the clock when it opens again.
- To reach the person later, schedule a notification
  (`apex.notifications.schedule`). It fires while Apex runs, even with the app
  closed.
- No polling loops in a page that may be hidden; refresh when the page
  becomes visible (`visibilitychange`).
- Service modules run in a hidden page only when called, and it closes after
  five idle minutes. Don't keep work going there.

### Efficient frames

- Use `requestAnimationFrame`, clamp the frame time (`Math.min(0.05, dt)`),
  and cap the pixel ratio at 2.
- Dispose of what you replace (`pip.dispose()`, geometries, textures).
- Use `isolated` (threads) only when the engine needs it.

## Testing

### Report state with `apex.test.ready`

```js
apex.test?.ready({ score, level, x: Math.round(player.x) })
```

Companions build and remix apps with Apex's playtest (`test_pack`), which
loads the app off-screen, presses keys, clicks, takes frames and reads the
last state the app reported. Call `apex.test.ready(state)` with what matters
(score, position, step, how many items) whenever it changes; every frame is
fine, as Apex sends it only when it changes. Outside a playtest it does
nothing.

### Make the playtest run

In a playtest:

- the cast is empty;
- model calls return stand-ins (`apex.ai.json` returns `null`);
- `apex.files` is refused;
- there are no keys, sign-ins or connectors;
- the network reaches only `localhost` and hosts an installed version of the
  pack may already reach.

An app that starts and draws something in all of these cases can be tested,
remixed and fixed by a companion.

### Test by hand

- Load the folder and open Developer Tools on the app's tab. Watch the pack's
  log on its page.
- Try light and dark, a narrow window, the keyboard only.
- Try each failure: server down, no key, signed out, connector not connected,
  a tool turned off, a refused permission, a refused model call.
- Pack the archive with `tools/pack.mjs`, remove your loaded copy, and install
  the file: read the review as a stranger would.

See [publish-checklist.md](publish-checklist.md) before you share.
