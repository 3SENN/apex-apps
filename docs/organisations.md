# Atelier for organisations

For IT admins. Atelier reads policies the way Chrome reads its enterprise
policies: from the registry on Windows, a configuration profile on macOS and a
file on Linux. They decide which packs your people can install and from
where, how far any pack may go, and how your own apps are configured.

Without a policy, Atelier behaves as it does for everyone: every rule here is a
no-op.

## Where policies live

| System | Where | Format |
|---|---|---|
| Windows | `HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Atelier` (every user), then `HKEY_CURRENT_USER\SOFTWARE\Policies\Atelier` (one user) | One named value per policy, directly under the key. Lists and objects are JSON text on one line in a string value (`REG_SZ`). `true`/`false` is a `REG_DWORD`, `1`/`0`. For a policy set in both, the machine's value wins. |
| macOS | A configuration profile for the preference domain `com.atelier.browser` (read from `/Library/Managed Preferences/`) | One key per policy: plist arrays, dictionaries and booleans, or JSON text in a string. The computer-level profile wins over a user-level one. |
| Linux | `/etc/atelier/policies.json` | One JSON object with a key per policy. |

- Atelier reads the policy once, in the background, shortly after it starts. It
  never delays start-up. **Restart Atelier after you change a policy.**
- Each value is checked on its own. A value that doesn't parse is ignored and
  noted in Atelier's log; the others still apply.
- With any policy set, the Packs page says "Your organisation manages some of
  this."

The examples below show each policy as JSON (what goes in the Linux file, and
the value's shape everywhere) and as a `.reg` file for Windows. To use a
`.reg` example: change the addresses to yours, save it as an ASCII `.reg` file
and run `reg import <file>.reg` as an administrator, or set the same values
with Group Policy Preferences (Registry items) or your MDM. Use
`HKEY_CURRENT_USER` instead to set a policy for one user. Atelier doesn't ship an
ADMX template.

## What applies when

- **Blocked, not allowed, or over the permission ceiling** applies to packs
  already installed too: such a pack stops, and its page says why. A review
  shows the reason as a problem, so Install is never offered for something
  the policy refuses.
- **Where a pack may come from** (`PackSideloading`, `PackIndexes`) applies to
  new installs. A pack already installed keeps working.
- **Force-installed packs**, and the packs Atelier itself brings, are always let
  in.

## The policies

| Policy | Type | What it does |
|---|---|---|
| [`PackIndexes`](#packindexes) | list | The only indexes Browse reads; may include private indexes behind your sign-in |
| [`PackForceInstall`](#packforceinstall) | list | Packs that are installed, on, and can't be removed |
| [`PackAllowlist`](#packallowlist-and-packblocklist) | list | Only these packs (ids, author keys or `*`) |
| [`PackBlocklist`](#packallowlist-and-packblocklist) | list | Never these packs |
| [`PackTrustedKeys`](#packtrustedkeys) | list | Author keys whose packs are allowed |
| [`PackPermissionCeiling`](#packpermissionceiling) | object | How far any pack may go |
| [`PackSideloading`](#packsideloading) | boolean | `false`: no installs from files, links or folders |
| [`PackAuditLog`](#packauditlog) | boolean | Each pack's log records what it used and where it connected |
| [`AppConfig`](#appconfig) | object | Per pack: `env` values, `secrets` and sign-in settings |
| [`AiProvider`](#aiprovider) | object | Your own model gateway for every pack's AI calls |

## PackIndexes

The indexes Browse reads. People can't add or remove any (Browse says your
organisation chooses them), and installs from an index are allowed only from
these.

```json
{
  "PackIndexes": [
    "https://packs.contoso.example/index.json",
    "https://raw.githubusercontent.com/3SENN/atelier-packs/main/index.json"
  ]
}
```

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Atelier]
"PackIndexes"="[\"https://packs.contoso.example/index.json\",\"https://raw.githubusercontent.com/3SENN/atelier-packs/main/index.json\"]"
```

- Up to 20 https addresses. Each entry is an address, or an object
  `{ "url", "name", "auth" }` (below).
- The list is the whole of Browse: people can't add or remove indexes. To
  offer the Atelier community index too, list it as above.

### A private index

An index behind your company's sign-in:

```json
{
  "PackIndexes": [
    {
      "url": "https://apps.contoso.example/index.json",
      "name": "Contoso apps",
      "auth": {
        "issuer": "https://login.contoso.example",
        "clientId": "atelier-index",
        "scopes": ["openid", "email", "offline_access"]
      }
    }
  ]
}
```

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Atelier]
"PackIndexes"="[{\"url\":\"https://apps.contoso.example/index.json\",\"name\":\"Contoso apps\",\"auth\":{\"issuer\":\"https://login.contoso.example\",\"clientId\":\"atelier-index\",\"scopes\":[\"openid\",\"email\",\"offline_access\"]}}]"
```

- Browse reads it only once someone has signed in. Until then it shows that
  the index is your organisation's, with **Sign in**.
- The sign-in is OAuth 2 / OpenID Connect with PKCE, like an app's: register a
  public client (no secret) that allows the redirect
  `http://127.0.0.1/callback` on any port. `issuer` is https without a query;
  `clientId` up to 200 characters; up to 20 `scopes`; `name` up to 80.
- The token goes on every request to the index's own host (the index, its
  archives and pictures, updates there) and nowhere else. A redirect to
  another host leaves it behind. An index that answers 401 or 403 offers
  **Sign in** again.

## PackForceInstall

Packs that are installed for everyone, stay on, and can't be turned off or
removed. Their pages say your organisation installed them.

```json
{
  "PackForceInstall": [
    "https://apps.contoso.example/contoso-dashboard.atelierapp",
    {
      "url": "https://apps.contoso.example/contoso-helpdesk-2.1.0.atelierapp",
      "sha256": "0000000000000000000000000000000000000000000000000000000000000000"
    }
  ]
}
```

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Atelier]
"PackForceInstall"="[\"https://apps.contoso.example/contoso-dashboard.atelierapp\",{\"url\":\"https://apps.contoso.example/contoso-helpdesk-2.1.0.atelierapp\",\"sha256\":\"0000000000000000000000000000000000000000000000000000000000000000\"}]"
```

- Up to 50 https addresses, each an address or `{ "url", "sha256" }`.
- Atelier downloads each address once, checks the file's SHA-256 when you give
  one (`pack.mjs --entry` prints it; the zeros above are a placeholder), and
  installs it through the same checks as any install.
- Newer versions arrive like any pack's: through the pack's own `updateUrl`.
  Atelier doesn't download an address again for a pack it already has.

## PackAllowlist and PackBlocklist

```json
{
  "PackBlocklist": ["*"],
  "PackAllowlist": ["contoso-dashboard", "notes-tool", "key:1a2b3c4d5e6f7a8b"]
}
```

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Atelier]
"PackBlocklist"="[\"*\"]"
"PackAllowlist"="[\"contoso-dashboard\",\"notes-tool\",\"key:1a2b3c4d5e6f7a8b\"]"
```

- Entries are a pack id, `key:<key id>` for every pack signed by an author key
  (the 16 hex characters the review and `pack.mjs --new-key` show), or `*`.
  Up to 1,000 each.
- With an allowlist, only packs on it (or signed by a trusted key) are let
  in.
- The allowlist and trusted keys win over the blocklist. `PackBlocklist: ["*"]`
  with a short allowlist reads as "only these".
- A blocklist alone (`["games-pack", "key:…"]`) refuses just those.

## PackTrustedKeys

Your organisation's signing keys. Packs signed with them are allowed,
whatever the allow and block lists say, and their review says "Signed by your
organisation".

```json
{
  "PackTrustedKeys": ["1a2b3c4d5e6f7a8b"]
}
```

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Atelier]
"PackTrustedKeys"="[\"1a2b3c4d5e6f7a8b\"]"
```

- Up to 50 key ids (16 lowercase hex characters).
- Make one key for your organisation's packs
  (`node tools/pack.mjs --new-key`), keep the private key in your release
  pipeline's secret store, and sign every version with it: Atelier pins each pack
  to the key that signed its first install.

## PackPermissionCeiling

How far any pack may go. A pack that asks for more, in its permissions or its
optional permissions, is refused, and an installed one stops.

```json
{
  "PackPermissionCeiling": {
    "network": ["*.contoso.example"],
    "sites": ["*.contoso.example"],
    "model": true,
    "files": false,
    "notifications": true,
    "clipboard": true,
    "pageScripts": false,
    "secrets": false,
    "localConnectors": false,
    "connectors": ["atlassian", "github"]
  }
}
```

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Atelier]
"PackPermissionCeiling"="{\"network\":[\"*.contoso.example\"],\"sites\":[\"*.contoso.example\"],\"model\":true,\"files\":false,\"notifications\":true,\"clipboard\":true,\"pageScripts\":false,\"secrets\":false,\"localConnectors\":false,\"connectors\":[\"atlassian\",\"github\"]}"
```

| Field | Type | Meaning |
|---|---|---|
| `network` | host list | The only hosts packs may send requests to (`*.contoso.example` covers the domain and its subdomains). |
| `sites` | host list | The only sites packs may read. |
| `model` | boolean | `false`: no pack may use a model account. |
| `files` | boolean | `false`: no pack may open, save or keep files. |
| `notifications` | boolean | `false`: no notifications. |
| `clipboard` | boolean | `false`: no copying to the clipboard. |
| `pageScripts` | boolean | `false`: no scripts on web pages. |
| `secrets` | boolean | `false`: no pack may ask people for keys. |
| `localConnectors` | boolean | `false`: no pack may add a connector that runs a program on the computer. |
| `connectors` | list | The person's connectors packs may use (directory ids such as `atlassian`, or server names); `[]` for none. |

Leave a field out to leave it unlimited. Lists hold up to 200 hosts and 100
connectors.

## PackSideloading

`false` lets packs in only from indexes (and force-install). The Packs page
then offers no **Install from file…**, **Install from link…** or **Load a
folder…**, and says why. Packs already installed keep working.

```json
{
  "PackSideloading": false
}
```

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Atelier]
"PackSideloading"=dword:00000000
```

## PackAuditLog

```json
{
  "PackAuditLog": true
}
```

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Atelier]
"PackAuditLog"=dword:00000001
```

- Each pack's log also records each permission it uses, the hosts its app
  connected to, where its keys and sign-ins were sent (once per host every
  ten minutes), and each connector call (connector and tool).
- People can't clear the log. **Save log…** on the pack's page writes it to a
  file as JSON lines.
- Under this policy the log keeps the last 20,000 lines per pack (500
  without it). Collect it if you need a longer record.

## AppConfig

Per pack, by pack id: the values of its `env`, its `secrets`, and its
sign-ins' settings. One published app can then run against each company's own
servers and tenant.

```json
{
  "AppConfig": {
    "contoso-dashboard": {
      "env": { "API_URL": "https://api.contoso.example/eu", "TEAM": "Operations" },
      "auth": {
        "corp": {
          "issuer": "https://login.contoso.example/eu",
          "clientId": "contoso-dashboard-eu",
          "scopes": ["openid", "email", "offline_access", "tasks.read"]
        }
      }
    },
    "server-notes": {
      "env": { "SERVER_URL": "https://notes.contoso.example" },
      "secrets": { "NOTES_TOKEN": "replace-with-a-service-token" }
    }
  }
}
```

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Atelier]
"AppConfig"="{\"contoso-dashboard\":{\"env\":{\"API_URL\":\"https://api.contoso.example/eu\",\"TEAM\":\"Operations\"},\"auth\":{\"corp\":{\"issuer\":\"https://login.contoso.example/eu\",\"clientId\":\"contoso-dashboard-eu\",\"scopes\":[\"openid\",\"email\",\"offline_access\",\"tasks.read\"]}}},\"server-notes\":{\"env\":{\"SERVER_URL\":\"https://notes.contoso.example\"},\"secrets\":{\"NOTES_TOKEN\":\"replace-with-a-service-token\"}}}"
```

- `env`: values for `env` names the pack declares, and only those, up to 2,000
  characters each. They win over the manifest's values. The app reads them as
  `atelier.env` as always.
- `secrets`: values for secrets the pack declares, up to 8,192 characters. The
  pack's **Keys** show "Set by your organisation", the person can't change
  them, the app's code never sees them, and Atelier sends each only to its
  secret's hosts.
- `auth`: per sign-in id, the `issuer`, `clientId` and `scopes` to use. The
  pack's page says it was set up by your organisation. For Microsoft Entra ID
  the issuer is `https://login.microsoftonline.com/<tenant id>/v2.0`.
- AppConfig can't widen a pack: keys and tokens still go only to the hosts in
  its manifest, and `env` can't add names.
- People who can read the registry key or the file can read these values.
  Use a token that is scoped to this one app, and rotate it.

## AiProvider

Your own model gateway: any endpoint that speaks Anthropic's Messages API.

```json
{
  "AiProvider": {
    "url": "https://ai.contoso.example",
    "token": "replace-with-the-gateway-token",
    "models": { "fast": "contoso-fast", "smart": "contoso-smart" }
  }
}
```

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Atelier]
"AiProvider"="{\"url\":\"https://ai.contoso.example\",\"token\":\"replace-with-the-gateway-token\",\"models\":{\"fast\":\"contoso-fast\",\"smart\":\"contoso-smart\"}}"
```

- Atelier posts to `<url>/v1/messages`.
- Give `key` (sent as `x-api-key`) or `token` (sent as `Authorization: Bearer`),
  exactly one.
- `models` names the gateway's models for the `fast` and `smart` tiers. Leave
  it out if the gateway takes Claude's model names.
- Every model call a pack makes (`atelier.ai`, `atelier.ask`, companions' lines in
  apps, residents' lines in worlds) goes there instead of the person's own
  account, under the same budget (60 calls an hour and 500 a day per pack).
  The Packs page says "Apps use your organisation's AI service, not your own
  model account."
- Atelier's own chats are not affected.
- As with `AppConfig` secrets, people who can read the policy can read the
  token: scope it to the gateway.

## Putting it together

A private index as the only source of packs, the dashboard installed for
everyone and set up for this company, your signing key trusted, connections
limited to your domain, an audit log, and your own model gateway. Add
`"PackBlocklist": ["*"]` as well if only packs signed with your key may run.

```json
{
  "PackIndexes": [
    {
      "url": "https://apps.contoso.example/index.json",
      "name": "Contoso apps",
      "auth": {
        "issuer": "https://login.contoso.example",
        "clientId": "atelier-index",
        "scopes": ["openid", "email", "offline_access"]
      }
    }
  ],
  "PackForceInstall": ["https://apps.contoso.example/contoso-dashboard.atelierapp"],
  "PackTrustedKeys": ["1a2b3c4d5e6f7a8b"],
  "PackSideloading": false,
  "PackAuditLog": true,
  "PackPermissionCeiling": { "network": ["*.contoso.example"], "localConnectors": false },
  "AppConfig": {
    "contoso-dashboard": {
      "auth": {
        "corp": {
          "issuer": "https://login.contoso.example/eu",
          "clientId": "contoso-dashboard-eu"
        }
      }
    }
  },
  "AiProvider": {
    "url": "https://ai.contoso.example",
    "token": "replace-with-the-gateway-token"
  }
}
```

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Atelier]
"PackIndexes"="[{\"url\":\"https://apps.contoso.example/index.json\",\"name\":\"Contoso apps\",\"auth\":{\"issuer\":\"https://login.contoso.example\",\"clientId\":\"atelier-index\",\"scopes\":[\"openid\",\"email\",\"offline_access\"]}}]"
"PackForceInstall"="[\"https://apps.contoso.example/contoso-dashboard.atelierapp\"]"
"PackTrustedKeys"="[\"1a2b3c4d5e6f7a8b\"]"
"PackSideloading"=dword:00000000
"PackAuditLog"=dword:00000001
"PackPermissionCeiling"="{\"network\":[\"*.contoso.example\"],\"localConnectors\":false}"
"AppConfig"="{\"contoso-dashboard\":{\"auth\":{\"corp\":{\"issuer\":\"https://login.contoso.example/eu\",\"clientId\":\"contoso-dashboard-eu\"}}}}"
"AiProvider"="{\"url\":\"https://ai.contoso.example\",\"token\":\"replace-with-the-gateway-token\"}"
```

On Linux, save the JSON as `/etc/atelier/policies.json`.

On macOS, deliver the same keys in a configuration profile for
`com.atelier.browser`, for example as a custom settings payload in your MDM. The
preference list looks like this (lists and objects may also be JSON text in
a string, as on Windows):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PackSideloading</key>
  <false/>
  <key>PackAuditLog</key>
  <true/>
  <key>PackTrustedKeys</key>
  <array>
    <string>1a2b3c4d5e6f7a8b</string>
  </array>
  <key>PackForceInstall</key>
  <array>
    <string>https://apps.contoso.example/contoso-dashboard.atelierapp</string>
  </array>
  <key>AppConfig</key>
  <string>{"contoso-dashboard":{"auth":{"corp":{"issuer":"https://login.contoso.example/eu","clientId":"contoso-dashboard-eu"}}}}</string>
</dict>
</plist>
```

## Deploying your own apps

1. Build the app with your identity provider in `auth`, your API hosts in
   `permissions.network` and your settings in `env`. Develop it with **Load a
   folder…** (see [getting-started.md](getting-started.md)).
2. Sign every version with your organisation's key and trust that key with
   `PackTrustedKeys`.
3. Host the archives and an index on your intranet, or behind your sign-in as
   a private index ([sharing-and-the-index.md](sharing-and-the-index.md)).
4. Force-install what everyone needs; let people pick the rest from Browse.
5. Set each company's or team's values with `AppConfig`.

[`examples/company-dashboard`](../examples/company-dashboard) has a complete
app and its policy files.

## Data on the device

- An app's data stays in its own partition on the device; removing the app
  removes it.
- Keys and sign-in tokens are encrypted with the system keychain, outside the
  pack's storage.
- Nothing about an app goes to Atelier's servers.
