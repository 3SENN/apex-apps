# Tools

Two Node scripts for packs made outside Apex. They are copies of the scripts
Apex itself uses, kept byte for byte (their usage lines still say
`scripts/packs/…`, the path in Apex's own repository; here they are in
`tools/`).

- `pack.mjs` builds a signed `.apexpack`, `.apexapp` or `.apexworld` from a
  pack folder, with the same hash and signature Apex checks, and can print
  the archive's entry for a community index.
- `make-index.mjs` builds a community index (`index.json`) from a folder of
  archives.

Node 18 or newer. One dependency, `fflate` (zip). Install it once; the
commands below then run from the repository root.

```sh
npm install --prefix tools
```

## Make a signing key (once)

```sh
node tools/pack.mjs --new-key ~/keys/apex-author.pem
# Wrote ~/keys/apex-author.pem. Key id 1a2b3c4d5e6f7a8b.
```

Keep the key outside the repository (here, in `~/keys`).

An Ed25519 private key in PEM, written with mode 0600. It refuses to overwrite
an existing file. The key id (16 hex characters) is what people and
organisations see; `PackTrustedKeys` and `key:<key id>` rules use it.

- Keep the key out of every repository. `.gitignore` here ignores `*.pem`.
- Back it up. Apex pins a pack id to the key that signed its first install:
  every later version must be signed with the same key, or Apex refuses the
  update ("signed by a different author").
- Whoever holds the key can publish updates that people's Apex accepts.

## Pack and sign

```sh
node tools/pack.mjs <folder> <out.apexpack|out.apexapp|out.apexworld> --key <key.pem>
```

- `<folder>` holds `apex-pack.json` at its root.
- Use `.apexapp` for a pack with an app, `.apexworld` for a pack that holds
  only worlds, `.apexpack` for anything else. The bytes are the same zip; the
  extension picks the icon and the review sheet.
- Every file in the folder goes in, except `.git`, `.env` files (`.env`,
  `.env.local`, `.env.example`, any `.env.*`), `.npmrc`, `.DS_Store`,
  `Thumbs.db`, `__MACOSX` and `__apex`. Links are skipped, never followed.
- Paths must follow Apex's rules (letters, digits, `.`, `-`, `_`; inside an
  app's folder also spaces and `& ' ( ) + , ! @ [ ] ~ =`). The script stops at
  the first path that breaks them.
- It does not run every check Apex runs. Load the folder in Apex first (Packs
  › Load a folder…) and fix what the review lists.

For example:

```sh
node tools/pack.mjs examples/hello-kit hello-kit-1.0.0.apexapp --key ~/keys/apex-author.pem
# Wrote hello-kit-1.0.0.apexapp: hello-kit 1.0.0, 8 files, signed by 1a2b3c4d5e6f7a8b.
```

## Print an index entry (`--entry`)

An app's archive is often too big for an index repository, so it goes up as
a release asset and the index lists its address and SHA-256. `--entry` prints
that entry:

```sh
node tools/pack.mjs examples/hello-kit hello-kit-1.0.0.apexapp --key ~/keys/apex-author.pem \
  --entry https://downloads.example.com/hello-kit/v1.0.0/hello-kit-1.0.0.apexapp \
  --image https://downloads.example.com/hello-kit/v1.0.0/hello-kit.png \
  --category games --color "#6b5bff"
```

- `--entry`: the https address the archive will be downloaded from.
- `--image`: the https address of its picture (PNG or JPEG, up to 4 MB).
- `--category`: one of `games`, `tools`, `worlds`, `creative`, `learning`,
  `productivity`, `companions`, `other`.
- `--color`: `#rrggbb`, the colour its card is washed in.

The `kind` (`app`, `world` or `pack`), `size` and `sha256` come from the
archive. Upload the archive exactly as written: any change to its bytes
changes the hash, and Apex refuses a download that doesn't match.

## Build an index

```sh
node tools/make-index.mjs <folder> <https base url> [index name]
```

- Reads every `.apexpack`, `.apexapp` and `.apexworld` in `<folder>`, takes
  the manifest from inside each and the SHA-256 of the file itself, and writes
  `<folder>/index.json`.
- A `.png` with the same name beside an archive becomes its picture.
- An `index.json` already in the folder is read first: entries hosted
  elsewhere (from `--entry`), each entry's `category` and `color`, and the
  `withdrawn` list are kept.
- One version per pack id. Host the folder over https and add
  `<base url>/index.json` on Apex's Packs page › Browse.

```sh
node tools/make-index.mjs site https://packs.contoso.example "Contoso apps"
```

See [../docs/sharing-and-the-index.md](../docs/sharing-and-the-index.md) for
the index format and withdrawing an item.
