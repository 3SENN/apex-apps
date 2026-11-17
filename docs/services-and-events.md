# Packs that work together

Packs can offer services to each other, send and hear events, and require
other packs. Everything a pack adds goes away with it: turn it off or remove
it, and its services, listeners and rows go too. All of this needs
`"manifestVersion": 2`.

## Offering a service: `provides`

```json
"provides": [{
  "service": "story-library",
  "description": "The stories in Story shelf.",
  "methods": {
    "list": { "description": "Lists the stories.", "input": { "type": "object", "properties": {} } },
    "append": {
      "input": {
        "type": "object",
        "properties": { "storyId": { "type": "string" }, "text": { "type": "string" } },
        "required": ["storyId", "text"]
      }
    }
  },
  "module": "services/library.js",
  "agent": true
}]
```

Answer it in one of two ways (an open page wins over the module):

- **From an open page** of your pack:

  ```js
  atelier.services.provide('story-library', {
    list: async () => loadStories(),
    append: async ({ storyId, text }, ctx) => addText(storyId, text, ctx.from),
  })
  ```

- **From a module** that runs in the pack's hidden tool page while no page
  serves it. It exports one async function per method:

  ```js
  // services/library.js
  export async function list(input, ctx) {
    return (await atelier.storage.get('stories')) ?? []
  }
  ```

  The module shares the pack's origin, so it reads the same `atelier.storage`,
  IndexedDB and `localStorage` as the app. Keep it outside every app's folder.

`ctx.from` is the calling pack's id, or `"companion"` when the person's
companion called it.

Rules:

- `service`: `^[a-z][a-z0-9-]{1,47}$`. Atelier keeps some names for itself:
  `ai`, `atelier`, `assets`, `auth`, `cast`, `connectors`, `events`, `files`,
  `guide`, `kit`, `notify`, `pad`, `rooms`, `status`, `storage`, `world`.
- 1 to 30 methods, named `^[a-z][A-Za-z0-9_]{0,31}$`. Each `input` is a JSON
  Schema object (`type` `"object"` if given). Atelier checks every call's input
  against it.
- Answers must be JSON, up to 1 MB. A call times out after 30 s.
- At most 10 services a pack.
- `agent: true` also offers the service to the person's companions, which find
  methods by their descriptions. The review says "Lets your companion use …".
  Write each `description` for that reader.
- The review lists every service a pack offers.

## Using a service: `uses`

```json
"uses": ["story-library"]
```

```js
const stories = await atelier.services.call('story-library', 'list', {})
```

- The pack waits until a pack that is on provides it; its page says what it
  waits for.
- The review says "Uses a service from other packs: story-library".
- At most 20. Atelier's own services can't be listed in `uses` yet; use
  `window.atelier` directly.

## Events

```json
"events": {
  "emits": ["chapter-done"],
  "on": ["other-pack/achievement", "atelier.theme"]
}
```

```js
atelier.events.emit('chapter-done', { chapter: 3 })

const stop = atelier.events.on('other-pack/achievement', (data, name) => {
  showBadge(data)
})
stop() // stops listening
```

- `emits`: your own names, `^[a-z][a-z0-9-]{0,31}$`, up to 20. Others hear
  them as `<your pack id>/<name>`.
- `on`: `<pack id>/<event>` of other packs, or `atelier.theme` (Atelier's own theme
  change), up to 30. A pack doesn't listen to its own events.
- Packs only observe events: a listener can't change or stop one.
- Up to 64 KB of data per event, 50 events a second.

## Requiring other packs

```json
"requires": { "packs": { "story-shelf": ">=1.2.0" } }
```

`1.2.0` and `>=1.2.0` both mean that version or newer. The pack waits until
each required pack is installed and on. At most 20; a pack can't require
itself.

## Good practice

- Keep a service small and stable. Add methods; don't change what an existing
  one takes or returns. Version breaking changes as a new service name.
- Validate inside your methods too: the schema checks shape, not meaning.
- Treat what another pack sends you as untrusted data, like any input.
- Only code can use services and events: a panel, app, tool, card or service
  module.
