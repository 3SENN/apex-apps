# Make things for Atelier

Atelier is the browser you make your own. In Atelier you can describe a tool and
your companion builds it. This repository is for building one yourself:
apps, games, tools, worlds and art, packed so anyone can add them to their
browser with one yes.

A pack is a folder: an `atelier-pack.json` manifest and the files it names.
Nothing here needs a backend or an SDK. Everything a pack can reach is written
in its manifest and shown to the person before they install it. The guides
and examples here pass Atelier's own checks.

New to Atelier? Start with [how it works](docs/how-it-works.md): where a pack
runs, what it can reach, how it shows up in the browser and how it travels.

| Repository | For |
|---|---|
| **atelier-apps** (this one) | Building packs: guides, working examples and the packing tools. |
| [atelier-packs](https://github.com/3SENN/atelier-packs) | The Atelier community index: finished packs, signed and reviewed in the open. Atelier lists it on Packs › Browse. |

## What you can build

| You want | Use | Example |
|---|---|---|
| A game or a tool in its own tab | an **app**: a full web page under the pack's own origin, with WebGL, WebAssembly, workers and storage | [hello-kit](examples/hello-kit), [notes-tool](examples/notes-tool) |
| An existing web project (Vite, React, a game engine's web export) | a **bundled** app: the build tool's static output | [vite-app](examples/vite-app) |
| An app that uses the person's AI | `atelier.ai` on the person's own engine: no API key in your app | [notes-tool](examples/notes-tool) |
| The person's companions as characters | the **cast** and the **Atelier kit** (three.js plus the companion runtime) | [hello-kit](examples/hello-kit) |
| An app on your own server, or the person's own accounts | `network`, `secrets`, `env` and `auth` | [server-app](examples/server-app), [company-dashboard](examples/company-dashboard) |
| Phones as controllers, a second screen, local multiplayer | `atelier.server`: a small server the app runs, on this computer or the Wi-Fi | [phone-controller](examples/phone-controller) |
| A place to walk around in | a **world**: JSON with kit props, residents and places that open apps | [world](examples/world) |
| New art or sound for someone's app | an **asset pack** that fills one of the app's slots | [winter-art](examples/winter-art) |
| A tool for your company | an app with sign-in and connectors, deployed by policy | [company-dashboard](examples/company-dashboard), [organisations](docs/organisations.md) |

Packs can also add panels beside the page, tools for the companion, new tab
cards, commands, page menu items, skills and services for other packs. See
[docs/manifest.md](docs/manifest.md).

## Your first pack in five minutes

1. Copy [`examples/hello-kit`](examples/hello-kit) somewhere of your own.
2. In Atelier, open the Packs page (`atelier://packs`) and choose
   **Load a folder…**. Pick the folder.
3. Read the review (it lists everything the pack can do) and install.
4. Open **Hello kit** from the sidebar, or type its name in the command bar.
5. Edit `app/main.js` and save. Atelier reloads the app.

A loaded folder runs in place: no copy, no signature, no build step for a kit
app. Change the `id` in `atelier-pack.json` before you build something of your
own. More in [docs/getting-started.md](docs/getting-started.md).

## Share what you made

- **A file.** A pack travels as one signed zip: `.atelierapp` for a pack with an
  app, `.atelierworld` for one that holds only worlds, `.atelierpack` for anything
  else. Build it with [`tools/pack.mjs`](tools). Anyone can double-click it or
  drop it on Atelier and gets the same review.
- **A link.** `atelier://packs?install=<https address of the file>`, or Packs ›
  **Install from link…**.
- **An index.** An https JSON file that lists packs with their SHA-256. Browse
  shows every index the person added. Atelier adds the Atelier community index on
  first run, and offers it again if the person removed every index. Build your
  own with [`tools/make-index.mjs`](tools).

Sign every version with the same key: Atelier pins a pack to the key that signed
its first install. See [docs/sharing-and-the-index.md](docs/sharing-and-the-index.md).

The [Atelier community index](https://github.com/3SENN/atelier-packs) takes packs,
apps and worlds by pull request, each signed, reviewed in the open and put on
a shelf in Browse. Apps too big for that repository are listed from a release
asset of your own.

## Docs

| | |
|---|---|
| [how-it-works.md](docs/how-it-works.md) | The map: the sandbox, the bridge and the network gate, where packs show up, how they travel |
| [getting-started.md](docs/getting-started.md) | A first app, how loading a folder works, debugging |
| [manifest.md](docs/manifest.md) | Every field of `atelier-pack.json`, with types, defaults, rules and limits |
| [api.md](docs/api.md) | `window.atelier`: every call that works today, including a server for phones on the Wi-Fi |
| [kit-and-cast.md](docs/kit-and-cast.md) | The Atelier kit (three.js, companions, props) and the cast |
| [ai.md](docs/ai.md) | `atelier.ai`: tiers, JSON, streaming, sessions with tools, quick decisions, the budget |
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

Every example passes Atelier's manifest checks (`vite-app` once it is built).

| | |
|---|---|
| [hello-kit](examples/hello-kit) | Kit app: the person's companion drawn with `atelier-kit/character.js`, an asset slot, the test hook |
| [notes-tool](examples/notes-tool) | Tool app: `atelier.ai.json` and `atelier.files` |
| [sorter](examples/sorter) | Tool app: `atelier.ai.decide` quick decisions that act only when sure |
| [phone-controller](examples/phone-controller) | Phones on the same Wi-Fi scan a QR code and become controllers: `atelier.server` with `lan` |
| [vite-app](examples/vite-app) | Bundled app built with Vite |
| [server-app](examples/server-app) | Own server: `network`, a secret, `env`, `.env.example`, a local server with CORS |
| [company-dashboard](examples/company-dashboard) | OAuth sign-in, connectors, `env`, and the policy that deploys it |
| [world](examples/world) | A world pack |
| [winter-art](examples/winter-art) | An asset pack for Hello kit |

[`index/example-index.json`](index/example-index.json) is a sample
community index (its addresses and hashes are made up).

## Licence

[MIT](LICENSE).

---

[atelierbrowser.eu](https://atelierbrowser.eu) · [How packs work](https://atelierbrowser.eu/packs.html)
