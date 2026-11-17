// Contoso dashboard: a company tool on Atelier.
//
// - auth: the person signs in with their Contoso account through Atelier. Atelier
//   sends the access token to api.contoso.example and refreshes it; this code
//   never sees a token and never sets Authorization.
// - permissions.connectors: the person's own Jira connector. Each tool runs
//   as they set it in Connectors (off refuses, "ask" asks them every time),
//   so every call here starts from a click.
// - env: API_URL and TEAM. An organisation can set them per company with the
//   AppConfig policy (see ../policy).
const API = atelier.env.API_URL
const TEAM = atelier.env.TEAM

const $ = (id) => document.getElementById(id)
const who = $('who')
const signInButton = $('sign-in')
const signOutButton = $('sign-out')
const tasksStatus = $('tasks-status')
const tasksRetry = $('tasks-retry')
const tasksList = $('tasks')
const jiraStatus = $('jira-status')
const connectButton = $('connect')
const searchForm = $('search')
const queryInput = $('query')
const results = $('results')

if (TEAM) $('title').textContent = `${TEAM}: Contoso dashboard`

let signedIn = false
let taskCount = 0
let searchTool = null

const report = () => atelier.test?.ready({ signedIn, tasks: taskCount, jira: Boolean(searchTool) })

// ---- signing in ----

async function refreshSignIn() {
  const { corp } = await atelier.auth.status()
  signedIn = corp.signedIn
  who.textContent = corp.signedIn ? `Signed in${corp.user ? ` as ${corp.user}` : ''}.` : 'Sign in to see your tasks.'
  signInButton.hidden = corp.signedIn
  signOutButton.hidden = !corp.signedIn
  if (corp.signedIn) await loadTasks()
  else {
    tasksList.replaceChildren()
    tasksStatus.textContent = ''
    tasksRetry.hidden = true
  }
  report()
}

signInButton.addEventListener('click', async () => {
  signInButton.disabled = true
  try {
    // Opens the identity provider in a tab; resolves once the person is signed in.
    await atelier.auth.signIn('corp')
  } catch (err) {
    // Cancelled or failed: say so, and keep the button.
    who.textContent = err.message
  } finally {
    signInButton.disabled = false
    await refreshSignIn()
  }
})

signOutButton.addEventListener('click', async () => {
  await atelier.auth.signOut('corp')
  await refreshSignIn()
})

// ---- the company API ----

function tasksProblem(text) {
  tasksStatus.textContent = text
  tasksRetry.hidden = false
}

async function loadTasks() {
  tasksStatus.textContent = 'Loading…'
  tasksRetry.hidden = true
  let res
  try {
    res = await fetch(`${API}/v1/tasks?assignee=me&state=open`)
  } catch {
    return tasksProblem(`Can't reach ${new URL(API).host}. Check your connection or VPN.`)
  }
  if (res.status === 401) {
    signInButton.hidden = false
    return tasksProblem('Your sign-in has run out. Sign in again.')
  }
  if (!res.ok) return tasksProblem(`The Contoso API answered ${res.status}.`)
  const tasks = await res.json()
  taskCount = tasks.length
  // API text is data: text nodes only.
  tasksList.replaceChildren(
    ...tasks.map((task) => {
      const item = document.createElement('li')
      item.textContent = String(task.title)
      return item
    }),
  )
  tasksStatus.textContent = tasks.length ? '' : 'No open tasks.'
  void atelier.status.set({ badge: tasks.length || null })
  report()
}

tasksRetry.addEventListener('click', () => void loadTasks())

// ---- the person's Jira connector ----

async function refreshJira() {
  const { atlassian } = await atelier.connectors.status()
  searchForm.hidden = true
  searchTool = null
  connectButton.hidden = atlassian.connected
  if (!atlassian.connected) {
    jiraStatus.textContent = 'Connect Jira and Confluence in Atelier to search it here.'
    return report()
  }
  // Only the tools the person has on are listed. This box uses a read-only search tool.
  const tools = await atelier.connectors.tools('atlassian')
  searchTool = tools.find((tool) => tool.readOnly && /search/i.test(tool.name)) ?? null
  const name = atlassian.name ?? 'Jira'
  if (!searchTool) jiraStatus.textContent = `${name} is connected, but no search tool is on. Turn one on in Connectors.`
  else {
    jiraStatus.textContent = `Searching with ${name}.`
    searchForm.hidden = false
  }
  report()
}

connectButton.addEventListener('click', () => void atelier.connectors.connect('atlassian'))
// Back from Connectors: look again.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void refreshJira()
})

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const query = queryInput.value.trim()
  if (!query || !searchTool) return
  // Fill the tool's first text field, read from its own schema rather than guessed.
  const field = Object.entries(searchTool.inputSchema?.properties ?? {}).find(([, schema]) => schema?.type === 'string')?.[0]
  if (!field) {
    results.textContent = 'This search tool takes no text to search for.'
    return
  }
  results.textContent = 'Searching…'
  try {
    const { text, isError } = await atelier.connectors.call('atlassian', searchTool.name, { [field]: query })
    results.textContent = isError ? `The search didn't work: ${text}` : text || 'Nothing found.'
  } catch (err) {
    // Refused: the tool is off, the person said no, or the policy doesn't allow it.
    results.textContent = err.message
  }
})

report()
await refreshSignIn()
await refreshJira()
