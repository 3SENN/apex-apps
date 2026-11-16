# The manifest: `apex-pack.json`

Every pack has an `apex-pack.json` at the root of its folder. Apex checks it,
and the files it names, every time it reads the pack: when you load a folder,
open an archive, install from a link or an index, and update.

General rules:

- UTF-8 JSON, at most 64 KB.
- **Unknown keys are refused**, at every level. A typo is a problem on the
  review, not a silent no-op.
- Strings marked *text* are trimmed and may not be empty.
- A manifest with a `manifestVersion` newer than the Apex reading it is
  refused with "made for a newer version of Apex".

## Top level

| Field | Type | Default | Rules |
|---|---|---|---|
| `format` | `"apex-pack"` | required | Exactly this. |
| `manifestVersion` | `1` or `2` | required | `2` for apps, worlds, `optionalPermissions`, `provides`, `uses`, `events`, `requires`, `secrets`, `env`, `auth` and `permissions.connectors`. Use `2`. |
| `id` | string | required | `^[a-z0-9][a-z0-9-]{1,31}$`: 2 to 32 lowercase letters, digits and dashes. |
| `name` | text | required | Up to 80 characters. |
| `version` | string | required | `major.minor.patch`, each part 0 to 999999, no leading zeros (`1.0.0`). |
| `description` | text | required | Up to 500 characters. |
| `author` | `{ "name": text }` | none | Name up to 80 characters. Shown on the review. |
| `builtBy` | text | none | Up to 80. The companion that built it; shown, never trusted. |
| `homepage` | https address | none | Up to 2,048 characters. |
| `updateUrl` | https address | none | Where the newest archive lives (see [sharing](sharing-and-the-index.md#updates)). |
| `forkedFrom` | `{ id, version, hash }` | none | Set by Remix. `hash` is 64 lowercase hex. |
| `contributes` | object | `{}` | What the pack adds. See below. |
| `permissions` | object | `{}` | What its code may reach. See below. |
| `optionalPermissions` | object | none | What it may ask for later. |
| `secrets` | array | none | Keys the person enters. |
| `env` | object | none | Public settings. |
| `auth` | array | none | Sign-ins Apex runs. |
| `provides` | array | none | Services for other packs. |
| `uses` | array | none | Services it needs. |
| `events` | object | none | Events it sends and hears. |
| `requires` | object | none | Other packs it needs. |

## `contributes`

Each list holds at most 50 entries unless a row says otherwise. Item `id`s
(apps, panels, commands, menus, cards, themes, boosts, routines, asset sets)
are `^[a-z0-9][a-z0-9-]{0,31}$` and unique within their list.

### `apps` (at most 5)

| Field | Type | Default | Rules |
|---|---|---|---|
| `id` | item id | required | Unique in the pack. |
| `name` | text | required | Up to 80. |
| `root` | path | `"app"` | The app's folder. Everything under it is served with the app sandbox. Must be a folder, and two apps' roots may not overlap. |
| `entry` | path | `"index.html"` | The page that opens, relative to `root`. Must exist and end in `.html` or `.htm`. |
| `build` | `"kit"` or `"bundled"` | required | `kit`: readable modules, reviewed like any pack code. `bundled`: a build tool's output; may be minified; the review says it can't show it. |
| `kind` | `"game"` or `"tool"` | `"tool"` | Games may go full screen and lock the pointer without asking. |
| `icon` | path | none | `.png` or `.svg`, up to 64 KB. Shown on its sidebar row. |
| `sidebar` | boolean | `false` | A row in the sidebar's Packs block that opens it. |
| `orientation` | `"any"`, `"landscape"`, `"portrait"` | none | |
| `isolated` | boolean | `false` | Serves the app cross-origin isolated (COOP `same-origin`, COEP `require-corp`) for `SharedArrayBuffer`: threaded WebAssembly. Everything it loads from a network host must then allow it. |
| `eval` | boolean | `false` | Lets its scripts use `eval` and `new Function`. A notice on the review. |
| `kit` | integer | none | The kit major it builds on. Only `1` exists. With it, the app's pages get an import map for `three`, `three/addons/…` and `apex-kit/…`. Set it when you import from the kit. |
| `cast` | `{ min, max }` | none | It uses the person's companions as characters. `min` 0 to 8, `max` 1 to 8, `min` ≤ `max`. |
| `assets` | array (at most 10) | none | Slots asset packs may fill: `{ id, name (up to 60), description (up to 500), layout? }`. Slot ids are unique within the pack; `layout` is a folder inside the app's `root`. |

A pack with an app may hold 5,000 files, 50 MB per file and 300 MB in all.

### `assets` (asset sets for another pack's app)

| Field | Type | Rules |
|---|---|---|
| `id` | item id | Unique in the pack. |
| `name` | text | Up to 80. |
| `for` | `{ pack, app, slot }` | Another pack's id (never this pack's), its app id and the slot id. |
| `root` | path | This pack's folder for the set. It must hold files, and none of them may be code (`.js`, `.mjs`, `.cjs`, `.html`, `.htm`, `.xhtml`, `.wasm`). It may not overlap an app's folder. |

An asset pack gets the same larger limits as a pack with an app.

### `worlds` (at most 10)

Paths to `.json` world files. Each is checked as a world (see
[worlds.md](worlds.md)); two worlds in one pack may not share an `id`; a place
that opens an app of this same pack must name one of its apps.

### Everything else a pack can add

| Field | Entry | Rules |
|---|---|---|
| `panels` | `{ id, title (60), html, sidebar?, icon? }` | `html` an `.html` file outside every app's folder. Opens in a tab, or beside the page. Panels have a stricter sandbox than apps: no inline scripts, no workers, no direct network. |
| `tools` | `{ name, description (2,000), inputSchema, module }` | Agent tools for the person's companion. `name` `^[a-z][a-z0-9_]{0,23}$`, unique. `inputSchema` a JSON Schema object (`type` `"object"` if given, up to 8,000 characters). `module` a `.js` or `.mjs` file outside every app's folder that exports `async function run(input, ctx)`. |
| `cards` | `{ id, title (60), module, open? }` | New tab page cards. `module` (`.js`/`.mjs`, outside app folders) exports `async function run(ctx)` and returns a string or up to 5 lines of up to 160 characters. `open` is a run (below). |
| `commands` | `{ id, title (80), run }` | Command bar rows. |
| `menus` | `{ id, title (80), context, run }` | Page menu items; `context` is `"page"`, `"selection"` or `"link"`. |
| `skills` | path | A folder with `SKILL.md` (front matter `name` and `description`, then instructions). |
| `routines` | `{ id, name (80), prompt (10,000), schedule }` | Routine templates the person can add. A `prompt` that starts with `/name` must name one of the pack's skills. |
| `boosts` | `{ id, match (1 to 20 hosts), subdomains?, css?, js? }` | CSS and scripts on sites. Each host must be in `permissions.sites`; `js` needs `permissions.pageScripts`; `"*"` is refused. |
| `themes` | `{ id, name (40), accent }` | Accent colours, `#rrggbb`. |
| `companions` | path | Companion files to add. They may not carry memory. |
| `connectors` | `{ id, name (48), url? , command?, args? }` | MCP connectors to add: either a `url` (https, or http on localhost) or a local `command` with `args`. |

A **run** is `skill:<name>`, `panel:<id>`, `app:<id>` or `tool:<name>`, and
must name something in this pack.

## `permissions`

All optional. What a pack doesn't list, it can't do.

| Field | Type | Default | What it allows |
|---|---|---|---|
| `network` | host list (up to 50) | `[]` | Requests to these hosts: an app's own `fetch`, WebSocket, EventSource, images and media, and `apex.fetch` / `apex.open` from any page. https and wss; http and ws only for `localhost` and `127.0.0.1`. `"*"` is refused. |
| `sites` | host list (up to 100) | `[]` | Reading pages on these sites (`apex.page.*`) and boosts. `["*"]` means every site (never sign-in pages). |
| `model` | boolean | `false` | `apex.ai.*` and `apex.ask` on the person's engine. |
| `speak` | boolean | `false` | `apex.cast.speak`. Needs `model` and an app with `cast`. |
| `files` | boolean | `false` | `apex.files.*`. |
| `notifications` | boolean | `false` | `apex.notify` and `apex.notifications.*`. |
| `clipboard` | boolean | `false` | `apex.clipboard.write`. |
| `worlds` | boolean | `false` | `apex.worlds.*`: lists, reads, changes and opens the person's worlds. |
| `connectors` | list (up to 10) | `[]` | The person's connectors this pack's apps use, by directory id (`atlassian`, `github`) or a server's name: `^[a-z0-9][a-z0-9-]{0,63}$`, no duplicates. |
| `pageScripts` | boolean | `false` | Boost scripts. Needs at least one boost with `js`. |
| `server` | `{}` or `{ "lan": true }` | none | `apex.server.*`: a small web server the app's own page runs. `{}` for this computer only; `{ "lan": true }` for phones and computers on the same Wi-Fi too (a warning line on the review; an update that adds it asks again). Needs an app. See [api.md](api.md#a-server-on-this-computer-apps). |

Least privilege is enforced: `network`, `model`, `notifications`,
`clipboard`, `files`, `worlds`, `connectors`, `secrets`, `auth` and
`optionalPermissions` need code that can use them (a panel, an app, a tool or
a card), and `server` needs an app.

### Host rules

- A host is a name like `api.example.com`; `www.` is dropped. A scheme or path
  in the entry is ignored, so write bare host names.
- `*.example.com` covers `example.com` and every subdomain. A wildcard needs
  at least two labels under it: `*.com` is refused.
- A pack that can read sites and send requests gets the most serious review
  line: "Can read … and send what it reads to …".

## `optionalPermissions`

What the pack may ask for while it runs, one feature at a time, with
`apex.permissions.request(...)`. Nothing here is granted at install.

| Field | Type |
|---|---|
| `network` | host list (up to 50); `"*"` refused |
| `sites` | host list (up to 100) |
| `notifications` | boolean |
| `model` | boolean |
| `clipboard` | boolean |

Entries already in `permissions` are dropped. `files`, `speak`, `worlds`,
`connectors` and `server` can't be optional.

## `secrets`

Keys and tokens the person enters for their own accounts. At most 10.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Like an environment variable: `^[A-Z][A-Z0-9_]{0,63}$`. Unique. |
| `name` | text | Up to 60. What the person is asked for. |
| `description` | text | Up to 300. Where to find it. |
| `hosts` | host list (1 to 10) | Where Apex sends it. Each must be in `permissions.network` or `optionalPermissions.network`; a wildcard host needs a wildcard at least as wide there. `"*"` refused. |
| `header` | string | The request header, `^[A-Za-z0-9-]{1,64}$`. Not one the browser owns: `Cookie`, `Host`, `Origin`, `Referer`, `Connection`, `Content-Length`, `Content-Type`, `Keep-Alive`, `TE`, `Trailer`, `Transfer-Encoding`, `Upgrade`, `Via`, `Proxy-*`, `Sec-*`. |
| `prefix` | string | Up to 40 characters, no control characters, written before the value (`"Bearer "`). |

A value the person enters is one line of up to 8,192 characters.

## `env`

Public settings the pack's pages read as `apex.env.NAME`.

- At most 50 names, `^[A-Z][A-Z0-9_]{0,63}$`, each value a string of up to
  2,000 characters.
- A name can't also be a secret.
- A value that looks like a key is refused, because `env` is readable by
  everyone who installs the pack. Apex knows the formats of Anthropic and
  OpenAI API keys, AWS access keys, GitHub and Slack tokens, Stripe secret
  and restricted keys, SendGrid keys, Google OAuth client secrets, private
  keys and Supabase service keys, and also catches `password: "…"` and the
  like. Keys made to be public (a Firebase web `apiKey`, a Maps browser key,
  a Supabase anon key, Stripe's `pk_`) pass.

## `auth`

Sign-ins Apex runs (OAuth 2 or OpenID Connect, authorization code with PKCE).
At most 4.

| Field | Type | Rules |
|---|---|---|
| `id` | string | `^[a-z][a-z0-9-]{0,31}$`. Unique. |
| `name` | text | Up to 60. What the person signs in with ("Contoso account"). |
| `issuer` | string | The identity provider's https address (http only on `localhost` or `127.0.0.1`), no query or `#`. Apex reads its metadata under `/.well-known/`. |
| `clientId` | string | 1 to 200 characters, no control characters. A public client (no secret). |
| `scopes` | list (up to 20) | Each 1 to 200 printable characters, no spaces or quotes. |
| `hosts` | host list (1 to 10) | Where the access token goes. Each in `permissions.network` or `optionalPermissions.network`. A host can't get both a sign-in and a secret in `Authorization`. |

See [servers-keys-and-sign-in.md](servers-keys-and-sign-in.md).

## `provides`, `uses`, `events`, `requires`

| Field | Shape | Rules |
|---|---|---|
| `provides` | `[{ service, description (500), methods, module?, agent? }]`, at most 10 | `service` `^[a-z][a-z0-9-]{1,47}$`, not one of Apex's own names (`ai`, `apex`, `assets`, `auth`, `cast`, `connectors`, `events`, `files`, `guide`, `kit`, `notify`, `pad`, `rooms`, `status`, `storage`, `world`). `methods`: 1 to 30, names `^[a-z][A-Za-z0-9_]{0,31}$`, each `{ description?, input }` with `input` a JSON Schema object. `module`: a `.js`/`.mjs` file outside app folders. |
| `uses` | list of service names, at most 20 | Not its own services; no duplicates. Apex's own services can't be listed yet. |
| `events` | `{ emits?, on? }` | `emits`: up to 20 names `^[a-z][a-z0-9-]{0,31}$`. `on`: up to 30, each `<pack-id>/<event>` (not this pack's) or `apex.theme`. |
| `requires` | `{ packs: { "<pack-id>": "1.2.0" or ">=1.2.0" } }` | Up to 20; both forms mean that version or newer; not itself. |

See [services-and-events.md](services-and-events.md).

## Files

- **Paths the manifest names**: relative, `/`-separated segments of
  `[A-Za-z0-9._-]` (up to 100 characters each, never only dots), up to 300
  characters, nothing under `__apex/`.
- **Files inside an app's folder** (and an asset set's) may also use spaces
  and `& ' ( ) + , ! @ [ ] ~ =`, up to 120 characters a segment and 400 a path.
  Never `# % ?`, a leading or trailing space, a trailing dot or a Windows
  device name (`con`, `nul`, `com1`…).
- **No two paths may differ only by case.**
- **No `.env` files** of any kind.
- **Readable code**: a `.js` or `.mjs` file with a line over 2,000 characters
  is refused as minified, except inside a bundled app's `root`.
- **The review shows all code**: scripts, pages and SVG files (outside bundled
  apps and asset sets) stay under 1 MB together.

| Limit | A pack | A pack with an app or asset set |
|---|---|---|
| Files | 200 | 5,000 |
| One file | 2 MB | 50 MB |
| Whole pack | 10 MB | 300 MB |
| Manifest | 64 KB | 64 KB |

## A full example

```json
{
  "format": "apex-pack",
  "manifestVersion": 2,
  "id": "team-board",
  "name": "Team board",
  "version": "1.2.0",
  "description": "Your team's board, with your own account.",
  "author": { "name": "Contoso IT" },
  "homepage": "https://contoso.example/team-board",
  "updateUrl": "https://downloads.contoso.example/team-board/latest.apexapp",
  "contributes": {
    "apps": [{
      "id": "main",
      "name": "Team board",
      "build": "bundled",
      "root": "dist",
      "kind": "tool",
      "icon": "icon.png",
      "sidebar": true
    }]
  },
  "permissions": {
    "network": ["api.contoso.example"],
    "notifications": true
  },
  "optionalPermissions": { "network": ["files.contoso.example"] },
  "secrets": [{
    "id": "BOARD_TOKEN",
    "name": "Board token",
    "description": "From contoso.example › Settings › Tokens.",
    "hosts": ["api.contoso.example"],
    "header": "Authorization",
    "prefix": "Bearer "
  }],
  "env": { "API_URL": "https://api.contoso.example" }
}
```
