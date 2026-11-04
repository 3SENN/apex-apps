// Server notes: reads and adds notes on the app's own server, with plain
// fetch and normal CORS (the page's origin is apex-pack://server-notes).
//
// - SERVER_URL comes from apex.env: the manifest's value, or .env while you develop.
// - The person's token is a secret. Apex adds it to requests to the secret's
//   hosts; this code never sees it and never sets the Authorization header.
const base = apex.env.SERVER_URL
const tokenState = document.getElementById('token-state')
const tokenButton = document.getElementById('token')
const form = document.getElementById('add')
const input = document.getElementById('text')
const status = document.getElementById('status')
const retry = document.getElementById('retry')
const list = document.getElementById('notes')

let count = 0

function say(text, canRetry = false) {
  status.textContent = text
  retry.hidden = !canRetry
}

async function showToken() {
  const { NOTES_TOKEN } = await apex.secrets.status()
  tokenState.textContent = NOTES_TOKEN ? 'Your Contoso Notes token is added.' : 'No Contoso Notes token yet.'
  tokenButton.hidden = NOTES_TOKEN
  return NOTES_TOKEN
}

async function addToken() {
  // Opens the pack's page at this key; resolves once the person saves it (or gives up).
  const { set } = await apex.secrets.request('NOTES_TOKEN')
  await showToken()
  if (set) await load()
}

// Server text is data: text nodes only.
function render(notes) {
  list.replaceChildren(
    ...notes.map((note) => {
      const item = document.createElement('li')
      item.textContent = String(note.text)
      return item
    }),
  )
  count = notes.length
  say(notes.length ? '' : 'No notes yet. Add the first one.')
  apex.test?.ready({ notes: count })
}

// One place for every request: a sentence and a way forward for each failure.
async function call(path, init) {
  let res
  try {
    res = await fetch(`${base}${path}`, init)
  } catch {
    say(`Can't reach ${base}. Check your connection, then try again.`, true)
    return null
  }
  if (res.status === 401) {
    say('The server needs your Contoso Notes token.')
    tokenButton.hidden = false
    return null
  }
  if (!res.ok) {
    say(`The server answered ${res.status}. Try again in a moment.`, true)
    return null
  }
  return res.json()
}

async function load() {
  say('Loading your notes…')
  const notes = await call('/notes')
  if (notes) render(notes)
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const text = input.value.trim()
  if (!text) return input.focus()
  // A JSON body makes this a preflighted request: the server answers OPTIONS too.
  const notes = await call('/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
  if (notes) {
    input.value = ''
    render(notes)
  }
})
tokenButton.addEventListener('click', () => void addToken())
retry.addEventListener('click', () => void load())

apex.test?.ready({ notes: count })
await showToken()
await load()
