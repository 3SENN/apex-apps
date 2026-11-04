# Winter art (an asset pack)

An asset pack for [Hello kit](../hello-kit): a snowy backdrop and cold
colours. It fills Hello kit's `art` slot and carries no code.

```json
"contributes": {
  "assets": [{ "id": "winter", "name": "Winter", "for": { "pack": "hello-kit", "app": "main", "slot": "art" }, "root": "winter" }]
}
```

- `for` names the app's pack id, app id and slot id.
- `root` is this pack's folder for the set. Its files use the same names as
  the app's own slot folder (`app/art/` in Hello kit), so a file this pack
  leaves out comes from the app.
- Asset packs hold files only: images, sound, video, fonts, models, JSON and
  text. `.html`, `.htm`, `.js`, `.mjs`, `.cjs` and `.wasm` are refused.
- The review says only that it changes how Hello kit looks or sounds.

## Try it

1. Load [../hello-kit](../hello-kit) first (Packs › **Load a folder…**).
2. Load this folder the same way.
3. On Hello kit's pack page, under **Look and sound**, pick **Winter**. The
   app reloads with the new art.
