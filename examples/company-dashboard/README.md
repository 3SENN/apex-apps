# Company dashboard

A company tool: the person signs in with their company account through Apex,
the app reads the company API with that sign-in, and it searches the
person's own Jira through their Apex connector. A `policy/` folder shows how
IT deploys and configures it.

```
company-dashboard/
  pack/                     the pack folder: load and pack this one
    apex-pack.json
    app/index.html
    app/main.js
    app/style.css
  policy/
    policies.json           the same policy for Linux (/etc/apex/policies.json) or as a reference
    contoso-dashboard.reg   the policy for Windows (HKLM\SOFTWARE\Policies\Apex)
```

## What it shows

- `auth`: an OAuth 2 / OpenID Connect sign-in that Apex runs. The manifest
  names the identity provider (`issuer`), a public client (`clientId`, no
  secret), the scopes and the hosts that get the access token. Apex runs the
  authorization code flow with PKCE in a tab, with the redirect
  `http://127.0.0.1:<any port>/callback`, keeps the tokens in the system
  keychain, refreshes them, and adds `Authorization: Bearer <token>` to the
  app's requests to `api.contoso.example`. The app only calls
  `apex.auth.status()`, `signIn('corp')` and `signOut('corp')`.
- `permissions.connectors`: `["atlassian"]` (Jira and Confluence in Apex's
  connector directory). The app checks `apex.connectors.status()`, offers
  `apex.connectors.connect('atlassian')` when it isn't connected, lists the
  tools the person has on with `tools()`, and runs a read-only search with
  `call()` from a click.
- `env`: `API_URL` and `TEAM`, public settings an organisation can set per
  company with `AppConfig`.
- `apex.status.set({ badge })` shows the number of open tasks on the sidebar row.

The review says: "Signs you in to login.contoso.example and sends that
sign-in to api.contoso.example", "Uses your connectors: Jira and Confluence…"
and "Can send requests to api.contoso.example".

## The identity provider

Register a public client (no client secret) that:

- uses the authorization code flow with PKCE (S256);
- allows the redirect URI `http://127.0.0.1/callback` on any port (Apex picks
  a free port for each sign-in);
- publishes its metadata under the issuer's `/.well-known/openid-configuration`
  or `/.well-known/oauth-authorization-server`.

If the provider only gives a refresh token for a scope such as
`offline_access`, add that scope, or people sign in again when the token
runs out.

## The policy

`policy/` force-installs the dashboard and sets, for this company:

- `env.API_URL` and `env.TEAM`;
- the sign-in's `issuer`, `clientId` and `scopes`, so one published app signs
  in to each company's own tenant.

The person sees "Set by your organisation" and can't change those values.
`AppConfig` sets values only for names the pack declares, and it can't widen
what the pack reaches: the token still goes only to the manifest's hosts.

To use the `.reg` file, change the addresses to your own, then import it
(`reg import contoso-dashboard.reg`, as an administrator) or turn it into
Group Policy preferences. See
[../../docs/organisations.md](../../docs/organisations.md).

## Try it without a company

Without a real provider at `login.contoso.example`, the sign-in can't finish.
Point `issuer` at a test provider of your own (Keycloak in a container works),
or at `http://localhost:<port>` while you develop: Apex accepts an http issuer
only on this computer.
