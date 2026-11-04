# Building for Apex

Apex is a browser with AI companions built in. You extend it with **packs**:
a folder with an `apex-pack.json` manifest and the files it names. This
repository is a practical guide to building packs well: apps, games, tools,
worlds and art, with examples that pass Apex's own checks.

Nothing here needs a backend or an SDK. A pack is plain web files plus a
manifest, and everything it can reach is written in that manifest and shown
to the person before they install it.

## What you can build

| You want | Use | Example |
|---|---|---|
| A game or a tool in its own tab | an **app**: a full web page under the pack's own origin, with WebGL, WebAssembly, workers and storage | [hello-kit](examples/hello-kit), [notes-tool](examples/notes-tool) |
| An existing web project (Vite, React, a game engine's web export) | a **bundled** app: the build tool's static output | [vite-app](examples/vite-app) |
| An app that uses the person's AI | `apex.ai` on the person's own engine: no API key in your app | [notes-tool](examples/notes-tool) |
| The person's companions as characters | the **cast** and the **Apex kit** (three.js plus the companion runtime) | [hello-kit](examples/hello-kit) |
| An app on your own server, or the person's own accounts | `network`, `secrets`, `env` and `auth` | [server-app](examples/server-app), [company-dashboard](examples/company-dashboard) |
| A place to walk around in | a **world**: JSON with kit props, residents and places that open apps | [world](examples/world) |
| New art or sound for someone's app | an **asset pack** that fills one of the app's slots | [winter-art](examples/winter-art) |
| A tool for your company | an app with sign-in and connectors, deployed by policy | [company-dashboard](examples/company-dashboard), [organisations](docs/organisations.md) |

Packs can also add panels beside the page, tools for the companion, new tab
cards, commands, page menu items, skills and services for other packs. See
[docs/manifest.md](docs/manifest.md).

## Five minutes

1. Copy [`examples/hello-kit`](examples/hello-kit) somewhere of your own.
2. In Apex, open the Packs page (`apex://packs`) and choose
   **Load a folder…**. Pick the folder.
3. Read the review (it lists everything the pack can do) and install.
4. Open **Hello kit** from the sidebar, or type its name in the command bar.
5. Edit `app/main.js` and save. Apex reloads the app.

A loaded folder runs in place: no copy, no signature, no build step for a kit
app. Change the `id` in `apex-pack.json` before you build something of your
own. More in [docs/getting-started.md](docs/getting-started.md).

## Share it

- **A file.** A pack travels as one signed zip: `.apexapp` for a pack with an
  app, `.apexworld` for one that holds only worlds, `.apexpack` for anything
  else. Build it with [`tools/pack.mjs`](tools). Anyone can double-click it or
  drop it on Apex and gets the same review.
- **A link.** `apex://packs?install=<https address of the file>`, or Packs ›
  **Install from link…**.
- **An index.** An https JSON file that lists packs with their SHA-256. Browse
  shows every index the person added; Apex starts with the Apex community
  index. Build your own with [`tools/make-index.mjs`](tools).

Sign every version with the same key: Apex pins a pack to the key that signed
its first install. See [docs/sharing-and-the-index.md](docs/sharing-and-the-index.md).

## Docs

| | |
|---|---|
| [getting-started.md](docs/getting-started.md) | A first app, how loading a folder works, debugging |
| [manifest.md](docs/manifest.md) | Every field of `apex-pack.json`, with types, defaults, rules and limits |
| [api.md](docs/api.md) | `window.apex`: every call that works today |
| [kit-and-cast.md](docs/kit-and-cast.md) | The Apex kit (three.js, companions, props) and the cast |
| [ai.md](docs/ai.md) | `apex.ai`: tiers, JSON, streaming, sessions with tools, the budget |
| [servers-keys-and-sign-in.md](docs/servers-keys-and-sign-in.md) | Your own servers, CORS, `secrets`, `env`, `.env` while you develop, OAuth sign-in |
| [connectors.md](docs/connectors.md) | The person's connectors (Jira, GitHub, Notion…) from an app |
| [worlds.md](docs/worlds.md) | The world file format |
| [services-and-events.md](docs/services-and-events.md) | Packs that work together |
| [files-assets-notifications.md](docs/files-assets-notifications.md) | Files, asset slots and asset packs, notifications, asking for more |
| [sharing-and-the-index.md](docs/sharing-and-the-index.md) | Signing, archives, links, updates, indexes, withdrawing |
| [organisations.md](docs/organisations.md) | For IT admins: every policy, with JSON and `.reg` examples |
| [best-practices.md](docs/best-practices.md) | Security, UX, performance and testing |
| [publish-checklist.md](docs/publish-checklist.md) | What to check before you share a pack |

## Examples

Every example passes Apex's manifest checks (`vite-app` once it is built).

| | |
|---|---|
| [hello-kit](examples/hello-kit) | Kit app: the person's companion drawn with `apex-kit/character.js`, an asset slot, the test hook |
| [notes-tool](examples/notes-tool) | Tool app: `apex.ai.json` and `apex.files` |
| [vite-app](examples/vite-app) | Bundled app built with Vite |
| [server-app](examples/server-app) | Own server: `network`, a secret, `env`, `.env.example`, a local server with CORS |
| [company-dashboard](examples/company-dashboard) | OAuth sign-in, connectors, `env`, and the policy that deploys it |
| [world](examples/world) | A world pack |
| [winter-art](examples/winter-art) | An asset pack for Hello kit |

[`index/example-index.json`](index/example-index.json) is a sample
community index (its addresses and hashes are made up).

## Licence

[MIT](LICENSE).
