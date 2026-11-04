# Publish checklist

Go through this before you share a pack, and again before each new version.

## The manifest

- [ ] `id` is final. It can't change without becoming a different pack.
- [ ] `version` is higher than the last published one.
- [ ] `name` and `description` say what it is in plain words.
- [ ] `author.name` is set; `homepage` points somewhere useful.
- [ ] `updateUrl` points at an address that always serves the newest archive.
- [ ] `"manifestVersion": 2`.

## Permissions

- [ ] Every permission is used. Remove the ones that aren't.
- [ ] Features not everyone uses ask for theirs through `optionalPermissions`.
- [ ] No `localhost` or `127.0.0.1` in `network`: the loaded folder reached
      them without listing.
- [ ] Each secret's `hosts` are only the service it is for.
- [ ] The review reads well. Install your archive on a clean setup and read
      every line as a stranger would.

## Keys and privacy

- [ ] No key, token or password in any file. Search your folder for
      `sk-`, `ghp_`, `AKIA`, `BEGIN PRIVATE KEY`, `password`, `secret`.
- [ ] No `.env` in the pack; a `.env.example` with placeholders in your repo.
- [ ] `env` holds only public values.
- [ ] Your own server checks the person's token or sign-in on every request.
- [ ] Your server answers CORS for `apex-pack://<id>` only (or `*` if it is a
      public API), including `OPTIONS`.

## Files

- [ ] The pack folder holds only what ships: no `node_modules`, sources,
      tests, server code or design files.
- [ ] A bundled app is freshly built, with relative addresses (`base: './'`).
- [ ] Kit app code is readable (no line over 2,000 characters).
- [ ] An icon (`.png` or `.svg`, up to 64 KB) for the sidebar row.
- [ ] Every asset is yours to share, with credits for open-licensed ones.

## Behaviour

- [ ] Starts with an empty cast, without a model, keys, sign-in or
      connectors, and says what is missing.
- [ ] Every error has a sentence and a way forward.
- [ ] Model output, server data and connector results are shown as text.
- [ ] Connector write tools run only from a click.
- [ ] Nothing keeps running when the app is closed; later reminders use
      scheduled notifications.
- [ ] Light and dark, keyboard and a narrow window all work.
- [ ] `apex.test?.ready(state)` reports what matters.
- [ ] The pack's log is clean after a normal session.

## Signing and the file

- [ ] Signed with your usual key (`tools/pack.mjs --key`). Same key as every
      earlier version.
- [ ] The right extension: `.apexapp` (with an app), `.apexworld` (only
      worlds), `.apexpack` (anything else).
- [ ] Installed from the file itself, not the folder, and opened once.

## Listing it

- [ ] The archive is uploaded exactly as built (the SHA-256 must match).
- [ ] Its index entry has the right `url`, `sha256`, `version`, `kind` and,
      if you like, `image`, `category` and `color`
      (`tools/pack.mjs --entry`, or `tools/make-index.mjs`).
- [ ] Older items you no longer offer are in `withdrawn`, with a reason.
