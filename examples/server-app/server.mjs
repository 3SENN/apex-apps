#!/usr/bin/env node
// A tiny notes server to develop Server notes against. Node 18 or newer, no
// dependencies:
//
//   node server.mjs        listens on http://127.0.0.1:8787 (PORT changes it)
//
// It answers CORS for the app's origin, atelier-pack://server-notes, including
// the preflight that a JSON POST needs. Notes live in memory only.
//
// Your real server is where your own keys live (a database password, the key
// of a model API it calls): in its own environment, never in the pack. It
// also checks the person's token (Authorization: Bearer ...), which Atelier adds
// to requests to the secret's hosts. Atelier never sends that token to
// 127.0.0.1, so this development server takes requests without one.
import { createServer } from 'node:http'

const PORT = Number(process.env.PORT) || 8787
const APP_ORIGIN = 'atelier-pack://server-notes'
const MAX_BODY = 16 * 1024

const notes = [{ id: 1, text: 'This note comes from server.mjs.' }]

const cors = {
  'Access-Control-Allow-Origin': APP_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '600',
  Vary: 'Origin',
}

function send(res, status, body) {
  res.writeHead(status, { ...cors, 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new Error('too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1')
  console.log(`${req.method} ${url.pathname} from ${req.headers.origin ?? 'no origin'}`)

  // The preflight: the browser asks before a POST with a JSON body.
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors)
    res.end()
    return
  }

  if (url.pathname === '/notes' && req.method === 'GET') return send(res, 200, notes)

  if (url.pathname === '/notes' && req.method === 'POST') {
    try {
      const { text } = await readJson(req)
      if (typeof text !== 'string' || !text.trim() || text.length > 500) return send(res, 400, { error: 'A note is 1 to 500 characters of text.' })
      notes.push({ id: notes.length + 1, text: text.trim() })
      return send(res, 200, notes)
    } catch {
      return send(res, 400, { error: 'Send JSON: { "text": "..." }.' })
    }
  }

  send(res, 404, { error: 'Not found.' })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Notes server on http://127.0.0.1:${PORT}, allowing ${APP_ORIGIN}`)
})
