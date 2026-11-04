# Hello kit

A kit app: the person's companion on a small stage, drawn with
`apex-kit/character.js`. "Say hi" (or a click on the companion) makes it
happy for a moment and counts on the app's sidebar row.

What it shows:

- `"build": "kit"` with `"kit": 1`: plain modules, no build step. `three` and
  `apex-kit/…` resolve through the import map Apex adds to the page.
- `"cast": { "min": 1, "max": 1 }`: `apex.cast.members()` gives the person's
  active companion, `apex.cast.pick()` lets them choose another.
- An empty cast (a test run, or nobody picked) draws a stand-in shape.
- Opened from a world's place (see [../world](../world)), it uses
  `apex.world.context()` and greets whoever is there.
- An asset slot, `art`, with its files in `app/art/`. The
  [winter-art](../winter-art) pack replaces them.
- `apex.status.set` for the sidebar row, and `apex.test?.ready(state)` every
  frame for Apex's playtest.

It asks for no permissions: the review says it adds an app and uses your
companions as characters (names and looks).

## Try it

1. In Apex, open Packs, choose **Load a folder…** and pick this folder.
2. Install from the review, then open **Hello kit** from the sidebar or the
   command bar.
3. Edit `app/main.js`. Apex reloads the app when a file changes.

## Files

```
apex-pack.json
icon.svg              sidebar icon (64 KB at most)
app/index.html        the entry page
app/main.js           everything that runs
app/style.css
app/art/backdrop.svg  slot "art": the picture behind the stage
app/art/palette.json  slot "art": floor and light colours
```
