# Your own servers, keys and sign-in

Apps reach their own servers and the person's own accounts directly, without
Atelier in the middle and without a key ever being in the pack.

## Reaching a server

List the hosts in `permissions.network`:

```json
"permissions": { "network": ["api.contoso.example", "*.cdn.contoso.example"] }
```

An app's pages then connect straight to them with `fetch`, `WebSocket`,
`EventSource`, `<img>`, `<audio>` and `<video>`:

- https and wss, on any port; http and ws only to `localhost` and
  `127.0.0.1`.
- **Normal CORS.** The page's origin is `atelier-pack://<pack id>`. Your server
  answers with `Access-Control-Allow-Origin: atelier-pack://<pack id>` (or `*`),
  and answers the preflight (`OPTIONS`) that a request with a JSON body or its
  own headers triggers. This is what lets ordinary clients (a REST or GraphQL
  client, socket.io, a backend's own SDK) run unchanged.
- Requests carry no cookies.
- Scripts, styles, fonts and frames still come only from the pack. WebRTC is
  not available.
- Hosts in `optionalPermissions.network` stay closed until the person grants
  them (`atelier.permissions.request`), and close again if they take the grant
  back.

A minimal server answer, in Node:

```js
const cors = {
  'Access-Control-Allow-Origin': 'atelier-pack://server-notes',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  Vary: 'Origin',
}
if (req.method === 'OPTIONS') return res.writeHead(204, cors).end()
res.writeHead(200, { ...cors, 'Content-Type': 'application/json' }).end(JSON.stringify(notes))
```

The full example is [server-app/server.mjs](../examples/server-app/server.mjs).

**`atelier.fetch`** is the other way: it runs inside Atelier, not the page, so it
needs no CORS, sends no cookies and returns text (up to 5 MB, 20 s). Panels and
tools can only use `atelier.fetch`; apps can use either.

## A pack is public, so no key goes in it

Everyone who installs a pack has every file in it. A key in a pack is a key
for all of them.

- **Your own keys** (your database, your payment provider, the model API your
  server calls) stay on your server. The app talks to your server.
- Atelier refuses a pack with a `.env` file anywhere in it. Export and Share…
  also refuse files with text in a known key format, and `env` values that
  look like keys.
- Keys meant to be public pass: a Firebase web `apiKey`, a Maps browser key, a
  Supabase anon key, Stripe's `pk_`.

## Keys the person brings: `secrets`

When the app works with the person's own account somewhere (their API key
for a service, a token for their company's API), declare it:

```json
"permissions": { "network": ["api.acme.example"] },
"secrets": [{
  "id": "ACME_KEY",
  "name": "Acme API key",
  "description": "From acme.example › Settings › API.",
  "hosts": ["api.acme.example"],
  "header": "Authorization",
  "prefix": "Bearer "
}]
```

- The review says: "Asks you for Acme API key and sends it only to
  api.acme.example (the pack's code never sees it)". An update that sends a
  key to a new host asks again.
- The person enters it on the pack's page, under **Keys**. Atelier keeps it in
  the system keychain, never in the pack's storage, and removes it with the
  pack.
- Atelier puts it in that header on every request to those hosts: the app's own
  `fetch`, a WebSocket's handshake, images, `atelier.fetch`. It replaces whatever
  the page set there. On a request to any other host the header is taken out,
  so a redirect never carries the key on.
- Your code only learns **whether** there is one:

```js
async function things() {
  const { ACME_KEY } = await atelier.secrets.status() // true or false
  if (!ACME_KEY) {
    const { set } = await atelier.secrets.request('ACME_KEY') // opens the pack's page at that key
    if (!set) return null // say why the app needs it, and offer the button again
  }
  const res = await fetch('https://api.acme.example/v1/things') // no Authorization header: Atelier adds it
  return res.json()
}
```

- `request` resolves `{ set: true }` once the person saves the key, or
  `{ set: false }` after ten minutes.
- Bind a key only to the service it is for. A host that echoes requests back
  would show the key to the page.
- Rules: see [manifest.md › secrets](manifest.md#secrets).

## Public settings: `env`

Values that aren't secret but differ between builds or installs (a server's
address, a feature switch) go in `env`, and every page of the pack reads them
as `atelier.env`:

```json
"env": { "SERVER_URL": "https://api.contoso.example", "REALTIME": "on" }
```

```js
const res = await fetch(`${atelier.env.SERVER_URL}/notes`)
```

At most 50 values of up to 2,000 characters, named like secrets and never the
same name as one. A value in a known key format is refused. An organisation
can set `env` values for its people with the `AppConfig` policy.

## While you develop: `.env` and localhost

A pack loaded with **Load a folder…**:

- reads the folder's `.env` and `.env.local` (the later wins). They fill the
  `env` values and `secrets` **with the same names**: only names the manifest
  declares, and nothing else in the file is read. A key entered on the pack's
  page wins over the file; the page says which one is used ("From .env").
- may reach `localhost` and `127.0.0.1` without listing them. So
  `SERVER_URL=http://127.0.0.1:8787` in `.env` points the app at your own
  server, and the published manifest carries no localhost permission.
- reloads when you edit `.env`, like any other file.

Neither file is ever packed: Load a folder and `pack.mjs` skip every `.env`
file, and Atelier refuses a pack that holds one. Commit a `.env.example` with
placeholders instead (see [server-app](../examples/server-app)).

A secret still goes only to its own hosts, also in development. A secret for
`api.acme.example` filled from `.env` is sent to `api.acme.example`, not to
your local server.

## Sign-in: `auth`

For an account the person signs in with (a company's Entra ID, Okta, Google,
Keycloak, or any OAuth 2 / OpenID Connect provider), let Atelier run the sign-in:

```json
"permissions": { "network": ["api.contoso.example"] },
"auth": [{
  "id": "corp",
  "name": "Contoso account",
  "issuer": "https://login.contoso.example",
  "clientId": "contoso-dashboard",
  "scopes": ["openid", "email", "tasks.read"],
  "hosts": ["api.contoso.example"]
}]
```

```js
const { corp } = await atelier.auth.status()      // { signedIn, user }
if (!corp.signedIn) await atelier.auth.signIn('corp') // opens the provider in a tab
const res = await fetch('https://api.contoso.example/v1/tasks') // Atelier adds Authorization: Bearer <token>
await atelier.auth.signOut('corp')                // forgets the tokens here
```

What Atelier does:

- Finds the provider from `issuer`: its metadata under
  `/.well-known/oauth-authorization-server` or
  `/.well-known/openid-configuration`.
- Runs the **authorization code flow with PKCE (S256)** in a tab of the
  person's profile, so a company sign-in they already have carries over.
- Receives the code on a **loopback redirect**,
  `http://127.0.0.1:<port>/callback`, on a free port it picks each time.
- Keeps the tokens in the system keychain and refreshes the access token when
  it is due (when the provider gave a refresh token).
- Adds `Authorization: Bearer <access token>` to the app's requests to the
  sign-in's `hosts` (fetch, WebSocket handshakes, images, `atelier.fetch`), and
  takes it off a request to any other host.
- `user` is the email, username or name from the ID token (the first it has).
- Call `signIn` from a click. If the person closes the sign-in tab, asking
  again within ten seconds is refused, so an app never reopens it in a loop.

What you register at the provider:

- A **public client**: no client secret.
- The redirect URI `http://127.0.0.1/callback`, allowed on **any port**.
- PKCE with S256.
- The scopes you list. If the provider gives a refresh token only for a scope
  such as `offline_access`, add it, or people sign in again whenever the
  access token runs out.

Rules: an https `issuer` (http only on `localhost` or `127.0.0.1` while you
develop) with no query or `#`; every host in `network` or
`optionalPermissions.network`; at most 4 sign-ins; and a host never gets both a
sign-in and a secret in `Authorization` (send a key in its own header, such as
`X-Api-Key`, instead).

The review says: "Signs you in to login.contoso.example and sends that sign-in
to api.contoso.example". An update that changes the issuer or the hosts asks
again. Atelier's playtest never signs in.

**One app, many companies.** An organisation can set its own `issuer`,
`clientId` and `scopes` for your sign-in with the `AppConfig` policy, so one
published app signs in to each company's own tenant. See
[organisations.md › AppConfig](organisations.md#appconfig).

## Checklist

- [ ] Every host the app talks to is in `network` (or optional and asked for).
- [ ] Your server answers CORS for `atelier-pack://<id>`, including `OPTIONS`.
- [ ] No key, token or password in any file; `.env` in `.gitignore`.
- [ ] Keys the person brings are `secrets`, bound to the one service each is for.
- [ ] Sign-in uses a public client with the loopback redirect on any port.
- [ ] The published manifest has no `localhost`.
- [ ] A 401 leads somewhere: Add your key, or Sign in again.
