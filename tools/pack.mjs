#!/usr/bin/env node
// Builds a signed .apexpack from a pack folder (docs/packs.md › Sharing), for
// packs made outside Apex, such as a community index's starter packs.
//
//   node scripts/packs/pack.mjs <folder> <out.apexpack|out.apexapp|out.apexworld> --key <key.pem>
//        [--entry <https address the archive will be at> [--image <https address of its picture>] [--category <c>] [--color #rrggbb]]
//   node scripts/packs/pack.mjs --new-key <key.pem>      make an Ed25519 key (mode 0600)
//
// With --entry it also prints the archive's entry for a community index
// (docs/apps.md › The community index): an app's archive is too big for the
// index repository, so it goes up as a release asset and the index lists its
// address and SHA-256. A .env or .npmrc file is never packed, like in Apex.
//
// The hash and signature are exactly what Apex checks (src/main/packs/files.ts
// and signing.ts): SHA-256 over the sorted "path NUL sha256(file)" lines,
// signed with Ed25519, in __apex/signature.json. Keep the key file private and
// out of every repository; whoever holds it can publish updates people's Apex
// accepts for packs it signed. Apex itself validates every rule at install.
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { zipSync } from 'fflate'

const IGNORED = new Set(['.DS_Store', 'Thumbs.db', '__MACOSX', '.git', '__apex', '.npmrc'])
const isEnvFile = (name) => /^\.env(\..*)?$/i.test(name)
// The same rules as Apex's (src/shared/packs.ts): manifest-style paths, and inside an app's folder the names games and build tools use.
const SEGMENT = /^[A-Za-z0-9._-]{1,100}$/
const ASSET_SEGMENT = /^[A-Za-z0-9._\-+=,!@&'()[\]~ ]{1,120}$/
const WINDOWS_DEVICE = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i
const CATEGORIES = ['games', 'tools', 'worlds', 'creative', 'learning', 'productivity', 'companions', 'other']
const sha256 = (data) => createHash('sha256').update(data).digest('hex')

function fail(message) {
  console.error(message)
  process.exit(1)
}

const args = process.argv.slice(2)
if (args[0] === '--new-key') {
  const target = args[1]
  if (!target) fail('Usage: node scripts/packs/pack.mjs --new-key <key.pem>')
  if (existsSync(target)) fail(`${target} already exists; not overwriting a key.`)
  const { privateKey } = generateKeyPairSync('ed25519')
  writeFileSync(target, privateKey.export({ format: 'pem', type: 'pkcs8' }), { mode: 0o600 })
  const der = createPublicKey(privateKey).export({ format: 'der', type: 'spki' })
  console.log(`Wrote ${target}. Key id ${sha256(der).slice(0, 16)}.`)
  process.exit(0)
}

const [folder, out] = args
const flag = (name) => {
  const at = args.indexOf(name)
  return at >= 0 ? (args[at + 1] ?? null) : null
}
const keyFile = flag('--key')
if (!folder || !out || !keyFile) fail('Usage: node scripts/packs/pack.mjs <folder> <out.apexpack|out.apexapp|out.apexworld> --key <key.pem> [--entry <https url>]')
if (!/\.(apexpack|apexapp|apexworld)$/i.test(out)) fail(`${out} should end in .apexpack, .apexapp (a pack with an app) or .apexworld (a pack of worlds).`)
const manifestFile = join(folder, 'apex-pack.json')
if (!existsSync(manifestFile)) fail(`${folder} has no apex-pack.json.`)
const appRoots = (() => {
  try {
    const apps = JSON.parse(readFileSync(manifestFile, 'utf8')).contributes?.apps ?? []
    return apps.map((a) => (typeof a?.root === 'string' ? a.root : 'app'))
  } catch {
    return []
  }
})()
const allowed = (rel) => {
  const parts = rel.split('/')
  if (parts.every((s) => SEGMENT.test(s) && !/^\.+$/.test(s))) return true
  return appRoots.some((r) => rel.startsWith(`${r}/`)) && parts.every((s) => ASSET_SEGMENT.test(s) && !/^\.+$/.test(s) && s.trim() === s && !s.endsWith('.') && !WINDOWS_DEVICE.test(s))
}

const files = new Map()
const walk = (dir) => {
  for (const name of readdirSync(dir).sort()) {
    if (IGNORED.has(name) || isEnvFile(name)) continue
    const full = join(dir, name)
    const st = lstatSync(full)
    if (st.isSymbolicLink()) continue
    if (st.isDirectory()) walk(full)
    else if (st.isFile()) {
      const rel = relative(folder, full).split(sep).join('/')
      if (!allowed(rel)) fail(`${rel} is not an allowed file path.`)
      files.set(rel, readFileSync(full))
    }
  }
}
walk(folder)

const hash = sha256([...files.keys()].sort().map((p) => `${p}\u0000${sha256(files.get(p))}\n`).join(''))
const privateKey = createPrivateKey(readFileSync(keyFile))
const publicDer = createPublicKey(privateKey).export({ format: 'der', type: 'spki' })
const signature = {
  format: 'apex-pack-signature',
  version: 1,
  hash,
  keyId: sha256(publicDer).slice(0, 16),
  publicKey: publicDer.toString('base64'),
  signature: sign(null, Buffer.from(hash, 'utf8'), privateKey).toString('base64'),
}

const entries = {}
for (const p of [...files.keys()].sort()) entries[p] = [new Uint8Array(files.get(p)), { level: 6 }]
entries['__apex/signature.json'] = [new TextEncoder().encode(JSON.stringify(signature, null, 2)), { level: 6 }]
const archive = Buffer.from(zipSync(entries))
writeFileSync(out, archive)
const manifest = JSON.parse(files.get('apex-pack.json').toString('utf8'))
console.log(`Wrote ${out}: ${manifest.id} ${manifest.version}, ${files.size} files, signed by ${signature.keyId}.`)

// The archive's entry for a community index, to paste into its "packs" list.
const entryUrl = flag('--entry')
if (entryUrl) {
  const https = (u) => {
    try {
      return new URL(u).protocol === 'https:'
    } catch {
      return false
    }
  }
  if (!https(entryUrl)) fail('--entry is the https address the archive will be downloaded from.')
  const image = flag('--image')
  if (image && !https(image)) fail('--image is the https address of a PNG or JPEG.')
  const category = flag('--category')
  if (category && !CATEGORIES.includes(category)) fail(`--category is one of ${CATEGORIES.join(', ')}.`)
  const color = flag('--color')
  if (color && !/^#[0-9a-f]{6}$/i.test(color)) fail('--color is a #rrggbb colour.')
  const c = manifest.contributes ?? {}
  const kind = (c.apps?.length ?? 0) > 0 ? 'app' : (c.worlds?.length ?? 0) > 0 && Object.keys(c).every((k) => k === 'worlds' || (c[k]?.length ?? 0) === 0) ? 'world' : 'pack'
  const entry = {
    id: manifest.id,
    name: manifest.name,
    description: manifest.description ?? '',
    version: manifest.version,
    url: entryUrl,
    sha256: sha256(archive),
    ...(manifest.author?.name ? { author: manifest.author.name } : {}),
    kind,
    size: archive.length,
    ...(category ? { category } : {}),
    ...(image ? { image } : {}),
    ...(color ? { color } : {}),
  }
  console.log(JSON.stringify(entry, null, 2))
}
