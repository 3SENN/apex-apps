# Sharing, signing and the index

A pack travels as one file, a zip of its files plus a signature. People open
it from a file, a link or an index, and always see the same review before
anything is installed.

## The archive

| Extension | For |
|---|---|
| `.apexapp` | a pack with an app |
| `.apexworld` | a pack that holds only worlds |
| `.apexpack` | anything else (asset packs, panels, tools, skills…) |

The bytes are the same in each; the extension picks the file icon and the
review sheet. Inside:

- every file of the pack, at its path;
- `__apex/signature.json`: the signature (absent when unsigned);
- optionally `__apex/share.json` (a note, up to 500 characters) and
  `__apex/share.png` (a picture), which Share… adds. Neither is signed, so the
  review attributes them only to "whoever shared it".

**The pack hash** is SHA-256 over one line per file, sorted by path: the path,
a NUL character, the file's own SHA-256 in hex, and a newline. It names the content, not the zip, so the same files give the
same hash however they were zipped.

**The signature** is Ed25519 over that hash (as UTF-8 text):

```json
{
  "format": "apex-pack-signature",
  "version": 1,
  "hash": "<64 hex>",
  "keyId": "<first 16 hex of the SHA-256 of the public key>",
  "publicKey": "<SPKI DER, base64>",
  "signature": "<base64>"
}
```

## Signing keys

```sh
node tools/pack.mjs --new-key ~/keys/apex-author.pem
node tools/pack.mjs examples/hello-kit hello-kit-1.0.0.apexapp --key ~/keys/apex-author.pem
```

See [tools/README.md](../tools/README.md) for every option.

**Trust on first use.** The first install of a pack id pins it to the full
fingerprint of the key that signed it. After that:

- every update and reinstall must be signed with the same key, or Apex
  refuses it ("signed by a different author");
- an unsigned pack can later move to a signed one (and is pinned to that key),
  never the other way;
- to accept a different author, the person removes the installed pack first.

So:

- **One key per author, kept for good.** Back it up. Lose it and people must
  remove your pack to install a new one under the same id.
- **Never commit it.** Whoever holds it can publish updates people's Apex
  accepts.
- **Apex has its own author key.** Packs you build or export inside Apex are
  signed with a key Apex keeps in the system keychain, made the first time you
  export. It is a different key from your `.pem`, and there is no way to move
  one into the other. Pick one way to sign each pack id and stay with it.
- A folder you load with **Load a folder…** installs unsigned, and exporting
  it from Apex gives an unsigned file. Sign what you publish with `pack.mjs`.

**Someone else's pack** keeps its author's signature when exported. Remix
makes a copy under a new id (`<id>-remix`), with `forkedFrom` filled in and no
author or update address.

## From inside Apex

On an installed pack's page:

- **Export…** saves `<id>-<version>.apexapp` (or `.apexworld`, `.apexpack`).
- **Share…** (packs with an app) adds a note and a picture made from the
  app's still, saves the archive and puts the picture (`.png`) beside it.

Before a file leaves the computer, Apex refuses it if a file is a `.env` file
or holds text in a known key format.

## Opening a pack

- **File**: double-click it, drop it on Apex, or Packs › **Install from
  file…**.
- **Link**: `apex://packs?install=<https address>`, or Packs › **Install from
  link…**. Downloads are https only (http only on this computer), follow at
  most five redirects, and stop at about 301 MB.
- **Index**: Packs › **Browse**.

Every way in shows the same review: the permission lines, the author and key,
the files, the code (for readable packs), what its skills and tools tell the
assistant, and every problem.

## Updates

```json
"updateUrl": "https://downloads.example.com/hello-kit/latest/hello-kit.apexapp"
```

- Point `updateUrl` at an address that always serves the newest archive, with
  a file name that doesn't change.
- Apex checks it when the person presses **Check for updates**, and about once
  a day while it runs.
- A newer version (by `version`) signed by the same key applies on its own if
  it asks for nothing new. One that adds a permission line above *info* (a
  host, a key's host, a sign-in, a tool, a connector, model use…) or changes
  what its skills or tools tell the assistant waits on the pack's page for the
  person's approval.
- An older version is refused.
- A pack an index withdrew gets no updates.

## The community index format

An index is one https JSON file, at most 2 MB:

```json
{
  "format": "apex-pack-index",
  "name": "Example index",
  "packs": [
    {
      "id": "hello-kit",
      "name": "Hello kit",
      "description": "Your companion on a little stage.",
      "version": "1.0.0",
      "url": "https://packs.example.com/hello-kit-1.0.0.apexapp",
      "sha256": "<64 hex: the SHA-256 of the archive file>",
      "author": "Apex examples",
      "kind": "app",
      "image": "https://packs.example.com/hello-kit-1.0.0.png",
      "category": "games",
      "size": 6144,
      "color": "#6b5bff"
    }
  ],
  "withdrawn": [{ "id": "old-tally", "reason": "Replaced by vite-tally." }]
}
```

| Field | Required | Rules |
|---|---|---|
| `id` | yes | A pack id. One entry per id. |
| `name` | yes | 1 to 80 characters. |
| `description` | no | Up to 500. |
| `version` | yes | `major.minor.patch`. |
| `url` | yes | https (http only on this computer). |
| `sha256` | yes | 64 hex characters: the hash of the **archive file**. A download that doesn't match is refused. |
| `author` | no | Up to 80. |
| `kind` | no | `pack` (the default), `app` or `world`. |
| `image` | no | https address of a PNG or JPEG, up to 4 MB. |
| `category` | no | `games`, `tools`, `worlds`, `creative`, `learning`, `productivity`, `companions` or `other`. |
| `size` | no | The archive's size in bytes. |
| `color` | no | `#rrggbb`: the colour its card is washed in. |

- Up to 2,000 entries. An entry that doesn't parse is skipped, not fatal.
- Browse shows each entry with its picture, kind, shelf, size and author.
  Install downloads the archive, checks the hash, and shows the review.

[`index/example-index.json`](../index/example-index.json) is a sample. Its
hashes are zeros and its addresses are made up: it parses, but nothing in it
installs.

## Making and hosting an index

```sh
mkdir site
cp hello-kit-1.0.0.apexapp hello-kit-1.0.0.png site/
node tools/make-index.mjs site https://packs.example.com "Example index"
# Wrote site/index.json with 1 pack.
```

Host the folder over https (a static host, a GitHub repository's raw files or
GitHub Pages) and add `<base url>/index.json` in Apex: Packs › **Browse** ›
**Add a community index**.

**Big archives.** An app can be too big for an index repository. Upload it as
a release asset, print its entry with `pack.mjs --entry <its address>`, and
add the entry to `index.json` by hand. `make-index.mjs` keeps entries hosted
elsewhere when it runs again.

**Pictures.** A `.png` beside an archive with the same name becomes its
`image`. Share… in Apex saves one.

## Withdrawing an item

Add its id to `withdrawn`, with a short reason:

```json
"withdrawn": [{ "id": "old-tally", "reason": "Replaced by vite-tally." }]
```

- Apex stops offering it and its updates, even if an entry for it is still
  listed.
- Installed copies keep working and show a notice with the reason. Apex never
  deletes anything.
- The notice clears once every index can be read and none lists the id.
- Indexes are read when the person opens Browse, and during the daily update
  check only if something they have came from an index.

## The Apex community index

Browse offers the Apex community index
(`https://raw.githubusercontent.com/3SENN/apex-packs/main/index.json`) when a
person has no index yet; they add it with one click, can remove it, and can
add others. Items are added by pull request. The
index pins each author's key and checks every request: signatures and pins,
hashes, Apex's file rules, and that the sources match the packs.

What you may share there:

- your own art, sound, code and characters;
- assets you licensed for this use, and open-licensed assets with their
  credits.

Not assets taken from someone else's game, and not other games' or
companies' characters, names or logos. A project that started from someone
else's game can ship its code and ask players for their own copy's files
(`apex.files.own`).

## Organisations

A company can run a private index behind its sign-in, choose the only indexes
its people see, force-install packs and trust its own signing key. See
[organisations.md](organisations.md).
