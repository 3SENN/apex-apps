# Connectors

People connect services to Apex (Jira and Confluence, GitHub, Notion,
Linear and others, or an MCP server of their own) under Connectors. An app
can use those connectors, so it builds on what the person already connected
instead of asking for its own access.

## Ask for them

```json
"manifestVersion": 2,
"permissions": { "connectors": ["atlassian", "github"] }
```

- Name each connector by its id in Apex's connector directory (`notion`,
  `atlassian`, `asana`, `linear`, `github`, `sentry`, `figma`, `stripe`,
  `supabase` and more), or by the name of an MCP server the person added
  themselves. `^[a-z0-9][a-z0-9-]{0,63}$`, at most 10, no duplicates.
- Only code calls connectors, so the pack needs an app (or a panel, tool or
  card).
- The review says "Uses your connectors: Jira and Confluence, GitHub. It can
  read and do what they allow, tool by tool as you set them in Connectors"
  (a warning). An update that adds a connector asks again.

## Use them

```js
const { atlassian } = await apex.connectors.status()
// { connected: true, name: 'Jira and Confluence' } or { connected: false, name }

if (!atlassian.connected) {
  // Opens Apex's Connectors at this service so the person can connect it.
  await apex.connectors.connect('atlassian')
}

const tools = await apex.connectors.tools('atlassian')
// [{ name, title, description, readOnly, inputSchema }]: only tools the person has on

const { text, data, isError } = await apex.connectors.call('atlassian', toolName, input)
```

- `status()` covers every connector the manifest names: whether it is
  connected here, and its name. Never its address or credentials.
- `tools(ref)` lists what the person has turned on. Tools they turned off
  aren't there.
- `call(ref, tool, input)` runs one tool inside Apex, through the connector's
  own session, and returns `{ text, data, isError }`: the text result, the
  structured result (or `null`), and whether the tool reported an error.
  `input` is checked against the tool's `inputSchema`.
- Each tool runs **as the person set it** in Connectors: a tool that is off is
  refused, and a tool set to "ask" asks them every time.

## Good practice

- **Read the tool list; don't hard-code tool names.** Connectors change their
  tools. Find what you need by `readOnly`, `name` and `inputSchema`, and say
  plainly when it isn't there ("No search tool is on. Turn one on in
  Connectors.").
- **Call write tools from a click.** A tool set to "ask" shows the person a
  question. That makes sense right after they pressed a button, not on load
  or on a timer.
- **Prefer read-only tools** for anything that runs without the person
  asking.
- **Handle every state:** not connected (offer **Connect…**), connected with
  no fitting tool, a refusal (the person said no, or the tool is off), and
  `isError: true`. Show each as a sentence.
- **Check again when the person comes back.** After `connect()`, the person is
  in another tab. Listen for `visibilitychange` and call `status()` again.
- **Treat results as data.** Render `text` with `textContent`.

## For organisations

The audit log records each connector call (connector and tool), and the
`PackPermissionCeiling` policy can limit which connectors packs may use. See
[organisations.md](organisations.md).

Apex's playtest uses no connectors: `status()` reports them as not connected.

See the [company-dashboard](../examples/company-dashboard) example.
