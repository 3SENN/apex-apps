# Vite app (a bundled app)

A small tally counter built with [Vite](https://vite.dev). Any build tool
works the same way: Atelier serves its static output as a `"bundled"` app.

```
vite-app/
  package.json        vite as a dev dependency
  vite.config.js      base "./", output into pack/dist
  index.html          Vite's entry page
  src/main.js         the app
  src/style.css
  pack/               the pack folder: load and pack this one
    atelier-pack.json    "build": "bundled", "root": "dist"
    dist/             the build (not committed)
```

## Why a separate `pack/` folder

Atelier reads every file in a pack folder (it skips only `.git`, `.env` files,
`.npmrc`, `.DS_Store`, `Thumbs.db` and `__MACOSX`). A project root holds
`node_modules`, which would break the file rules and limits, and sources that
nobody needs at run time. So the build goes straight into `pack/dist`, and
`pack/` holds only `atelier-pack.json` and the build.

## Build

```sh
npm install
npm run build        # writes pack/dist/
```

`base: './'` makes every address in the build relative. With a single app in
the pack, root addresses (`/assets/x.js`) also work, but relative ones keep
working if you add a second app.

## Develop

1. `npm run watch` rebuilds `pack/dist` whenever a source file changes.
2. In Atelier, Packs › **Load a folder…** and pick `pack/`. Atelier reloads the app
   after each build.
3. `npm run dev` opens the app in a normal browser for quick layout work.
   There is no `window.atelier` there; `src/main.js` uses a small stand-in. Inside
   Atelier, an app's scripts come only from its own files, so Vite's dev server
   can't serve it there: use `watch` and the linked folder instead.

## What the review says

A bundled app's review says it "contains built code that can't be shown
here", and that the code can only do what the other lines allow. This one asks
for nothing else. Minified files are fine inside a bundled app's `root`; they
don't count toward the 1 MB of readable code a pack may otherwise hold.

## Share it

```sh
npm run build
node ../../tools/pack.mjs pack tally.atelierapp --key ~/keys/atelier-author.pem
```

See [../../docs/sharing-and-the-index.md](../../docs/sharing-and-the-index.md).
