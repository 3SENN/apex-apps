# Getting started

You need Apex and a text editor. Node is only needed for bundled apps (your
build tool) and for the packaging tools in [`tools/`](../tools).

## A pack is a folder

```
my-first-app/
  apex-pack.json      the manifest: what the pack adds and what it may reach
  app/
    index.html        the page that opens
    main.js           your code
```

`apex-pack.json`:

```json
{
  "format": "apex-pack",
  "manifestVersion": 2,
  "id": "my-first-app",
  "name": "My first app",
  "version": "0.1.0",
  "description": "Says hello and counts clicks.",
  "contributes": {
    "apps": [{ "id": "main", "name": "My first app", "build": "kit", "kind": "tool", "sidebar": true }]
  },
  "permissions": {}
}
```

- `id`: 2 to 32 lowercase letters, digits and dashes. It is the pack's
  identity: its storage, its address (`apex-pack://my-first-app/`) and who may
  update it all hang on it. Pick it once.
- `manifestVersion: 2` is needed for apps, worlds and most of what this guide
  covers.
- The app's `root` defaults to `app` and its `entry` to `index.html`.
- `"build": "kit"` means readable modules with no build step. `"bundled"`
  means a build tool's output (see [the Vite example](../examples/vite-app)).
- `permissions: {}` asks for nothing. Add what you need; every line shows on
  the review.

`app/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="color-scheme" content="light dark">
<title>My first app</title>
<script type="module" src="./main.js"></script>
</head>
<body>
<button id="go" type="button">Click me</button>
<p id="out" role="status"></p>
</body>
</html>
```

`app/main.js`:

```js
const out = document.getElementById('out')
let clicks = Number(await apex.storage.get('clicks')) || 0

document.getElementById('go').addEventListener('click', async () => {
  clicks++
  out.textContent = `${clicks} clicks`
  await apex.storage.set('clicks', clicks)
  await apex.status.set({ badge: clicks })
  apex.test?.ready({ clicks })
})
```

`window.apex` is there on every page of a pack. See [api.md](api.md).

## Load the folder

1. Open the Packs page: `apex://packs`, or type "packs" in the command bar.
2. Choose **Load a folder…** and pick the folder that holds `apex-pack.json`.
3. Apex checks the pack and shows the review: the permission lines in plain
   words, the files, and every problem it found. Fix problems in your files;
   the review can't be installed until there are none.
4. Install. The app gets a row in the sidebar (because of `"sidebar": true`)
   and the command bar offers "Open My first app".

A loaded folder is linked, not copied:

- Apex reloads the pack, and any of its open tabs, a moment after you save a
  file. **Reload from folder** on the pack's page does the same by hand.
- It is installed unsigned. That is fine on your computer; sign the file you
  share (see [sharing-and-the-index.md](sharing-and-the-index.md)).
- Its `.env` and `.env.local` fill `env` values and `secrets` of the same name,
  and its app may reach `localhost` and `127.0.0.1` without listing them (see
  [servers-keys-and-sign-in.md](servers-keys-and-sign-in.md)).
- Apex reads **every** file in the folder, except `.git`, `.env` files,
  `.npmrc`, `.DS_Store`, `Thumbs.db` and `__MACOSX`. Keep `node_modules`, build
  sources and server code out of it: give a project a separate pack folder, as
  [vite-app](../examples/vite-app) and [server-app](../examples/server-app) do.

If your organisation turned sideloading off, the Packs page has no **Load a
folder…**; ask your IT team.

## Debugging

- **Developer Tools** work on an app's tab like on any page: View ›
  Developer › Developer Tools on macOS, More Tools › Developer Tools in the
  main menu on Windows and Linux.
- **The pack's log**, on its page in Packs: errors from the app's console, calls
  Apex refused and why, `apex.log(...)` lines, and tool calls. **Save log…**
  writes it to a file.
- **Refusals are errors.** Every `apex.*` call returns a promise; a call Apex
  refuses rejects with a sentence that says why. Show it to the person.

## Common problems

| You see | Why | Fix |
|---|---|---|
| `contributes.apps.0.entry: app/index.html is not in the pack.` | The entry page is missing, or a bundled app isn't built yet | Check `root` and `entry`; run the build |
| `A pack holds at most 5000 files.` or a path in `node_modules` | The folder holds a whole project | Load a folder that holds only the pack |
| `… looks minified.` | A long line (over 2,000 characters) in a `.js` file outside a bundled app | Ship readable code, or make the app `"build": "bundled"` |
| `… a .env file holds keys …` | A `.env` file in a pack that was zipped by hand | Leave `.env` files out; `pack.mjs` and Load a folder skip them |
| A `fetch` fails with no response | The host isn't in `permissions.network`, or the server doesn't answer CORS for `apex-pack://<id>` | List the host; allow the origin on the server |
| `Only an app's own pages use the cast.` | `apex.cast` called from a panel or tool | Use it from an app with `"cast"` |
| `Add "cast": { "min", "max" } to this app…` | The app has no `cast` | Add it to the app in the manifest |
| `A pack can use the model 60 times an hour.` | The model budget | Show it to the person; see [ai.md](ai.md) |
| `It isn't signed, but the one you installed was signed by its author.` | A signed version of the same id is installed | Remove it first, then load the folder |

## Next

- Draw the person's companion: [kit-and-cast.md](kit-and-cast.md)
- Use the AI: [ai.md](ai.md)
- Talk to a server: [servers-keys-and-sign-in.md](servers-keys-and-sign-in.md)
- Before you share: [best-practices.md](best-practices.md) and
  [publish-checklist.md](publish-checklist.md)
