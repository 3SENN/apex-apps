#!/usr/bin/env node
// Builds a community pack index (docs/packs.md › Sharing, docs/apps.md › The
// community index) from a folder of .atelierpack, .atelierapp and .atelierworld files:
// `node scripts/packs/make-index.mjs <folder> <base-url> [name]`.
// Each pack's manifest is read from inside the file and its SHA-256 is taken
// over the file itself, which is what Atelier checks after downloading it; its
// kind (app, world or pack) and size come along, and a .png beside it (what
// Share… saves) becomes its picture. The index goes to <folder>/index.json;
// host the folder anywhere over https (a GitHub repository's raw files or
// Pages, say) and add <base-url>/index.json on atelier://packs › Browse.
//
// An index.json already in the folder is read first: entries hosted elsewhere
// (an app's archive as a release asset, from pack.mjs --entry), each entry's
// category and colour, and the withdrawn list are kept as they are.
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { unzipSync } from 'fflate'

const [folder, baseUrl, name] = process.argv.slice(2)
if (!folder || !baseUrl || !/^https:\/\//.test(baseUrl)) {
  console.error('Usage: node scripts/packs/make-index.mjs <folder> <https base url> [index name]')
  process.exit(1)
}

const ARCHIVE = /\.(atelierpack|atelierapp|atelierworld)$/i
const base = baseUrl.replace(/\/+$/, '')
const indexFile = join(folder, 'index.json')
const previous = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, 'utf8')) : { packs: [] }
const before = new Map((previous.packs ?? []).map((p) => [p.id, p]))

const packs = []
for (const file of readdirSync(folder).filter((f) => ARCHIVE.test(f)).sort()) {
  const data = readFileSync(join(folder, file))
  const files = unzipSync(new Uint8Array(data), { filter: (f) => f.name === 'atelier-pack.json' })
  const raw = files['atelier-pack.json']
  if (!raw) {
    console.warn(`Skipped ${file}: no atelier-pack.json inside.`)
    continue
  }
  const m = JSON.parse(Buffer.from(raw).toString('utf8'))
  if (m.format !== 'atelier-pack' || typeof m.id !== 'string' || typeof m.version !== 'string') {
    console.warn(`Skipped ${file}: not an Atelier pack manifest.`)
    continue
  }
  if (packs.some((p) => p.id === m.id)) {
    console.warn(`Skipped ${file}: ${m.id} is already listed (keep one version per pack).`)
    continue
  }
  const c = m.contributes ?? {}
  const kind = (c.apps?.length ?? 0) > 0 ? 'app' : (c.worlds?.length ?? 0) > 0 && Object.keys(c).every((k) => k === 'worlds' || (c[k]?.length ?? 0) === 0) ? 'world' : 'pack'
  const picture = file.replace(ARCHIVE, '.png')
  const old = before.get(m.id)
  packs.push({
    id: m.id,
    name: m.name ?? m.id,
    description: m.description ?? '',
    version: m.version,
    url: `${base}/${encodeURIComponent(file)}`,
    sha256: createHash('sha256').update(data).digest('hex'),
    ...(m.author?.name ? { author: m.author.name } : {}),
    kind,
    size: data.length,
    ...(existsSync(join(folder, picture)) ? { image: `${base}/${encodeURIComponent(picture)}` } : old?.image ? { image: old.image } : {}),
    ...(old?.category ? { category: old.category } : {}),
    ...(old?.color ? { color: old.color } : {}),
  })
}
// What lives elsewhere (an app's release asset) stays listed as the maintainer added it.
for (const p of previous.packs ?? []) {
  if (!packs.some((q) => q.id === p.id) && typeof p.url === 'string' && !p.url.startsWith(`${base}/`)) packs.push(p)
}

const index = { format: 'atelier-pack-index', ...(name || previous.name ? { name: name || previous.name } : {}), packs, ...(previous.withdrawn?.length ? { withdrawn: previous.withdrawn } : {}) }
writeFileSync(join(folder, 'index.json'), `${JSON.stringify(index, null, 2)}\n`)
console.log(`Wrote ${join(folder, 'index.json')} with ${packs.length} pack${packs.length === 1 ? '' : 's'}.`)
