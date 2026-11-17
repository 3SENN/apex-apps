# Riverside (a world pack)

A world pack: one world file, no code, no permissions. Riverside has an
arcade corner, a market square and a jetty, two guests who live there, and
an open spot that one of the visitor's own companions fills.

```json
"contributes": { "worlds": ["worlds/riverside.json"] }
```

What it shows:

- Ground: a grass base, then painted areas. The last paint that covers a tile
  wins, so the jetty's `boards` go after the `water`.
- Props from the kit: `at` is the prop's middle in tiles, `turn` is in degrees,
  `tint.accent` recolours it.
- Places: named areas. The arcade corner `opens` Hello kit
  (`{ "pack": "hello-kit", "app": "main" }`). A place may open any pack's
  app; if the visitor doesn't have it, Atelier offers to get it.
- Residents: two guests (a name, a look and a short personality, never memory
  or instructions) and one open spot (`"companion": "local"`).
- In the app a place opens, `atelier.world.context()` returns the world, the
  place and the cast: the visitor first, then the residents there.

A pack that holds only worlds travels as `.atelierworld`. The review says it adds
a world to walk around in.

## Try it

1. Load [../hello-kit](../hello-kit) (Packs › **Load a folder…**), then this
   folder.
2. Open Riverside from the pack's page (Open turns on Atelier's Worlds app).
3. Walk into the arcade corner and step in: Hello kit opens with your
   companion as its cast, and names the companion in the open spot (if you
   have a second one).

See [../../docs/worlds.md](../../docs/worlds.md) for every field and limit.
