# Server app

An app that talks to its own server: it lists and adds notes on
`notes.contoso.example`, with the person's own token, and a local server to
develop against.

```
server-app/
  server.mjs            a dependency-free development server (Node 18+)
  pack/                 the pack folder: load and pack this one
    atelier-pack.json
    .env.example        copy to .env while you develop (never commit .env)
    app/index.html
    app/main.js
    app/style.css
```

The server sits outside `pack/` so it never ships in the pack.

## What it shows

- `permissions.network`: the app's pages reach `notes.contoso.example`
  directly with `fetch`. Normal CORS applies: the page's origin is
  `atelier-pack://server-notes`, so the server allows that origin (or `*`).
- `secrets`: the person's token for that service. They enter it on the pack's
  page (or the app calls `atelier.secrets.request('NOTES_TOKEN')`). Atelier keeps it
  in the system keychain and puts `Authorization: Bearer <token>` on requests
  to `notes.contoso.example` only. The app's code never reads it.
- `env`: `SERVER_URL` is a public setting the app reads as
  `atelier.env.SERVER_URL`.
- `.env` while you develop: in a folder loaded with **Load a folder…**, `.env`
  and `.env.local` override `env` values and fill `secrets` with the same
  names. The app may also reach `localhost` and `127.0.0.1` without listing
  them. Neither file is ever packed.
- Every failure (no connection, 401, other errors) shows a sentence and a way
  forward: Try again, or Add your token.

## Run it

```sh
node server.mjs                 # http://127.0.0.1:8787
cp pack/.env.example pack/.env  # Windows: copy pack\.env.example pack\.env
```

Then in Atelier: Packs › **Load a folder…**, pick `pack/`, install, and open
**Server notes**. Add a note; the server's console shows the request and
its origin.

## Before you publish

- The published manifest names only `notes.contoso.example`: no `localhost`.
- `.env` and `.env.local` stay on your computer. `pack.mjs` and Atelier both skip
  them, and Atelier refuses a pack that contains one.
- Never put your own server's keys in the app. Keep them on the server.
