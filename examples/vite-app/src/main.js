// Tally: count anything; Apex remembers the count. Built with Vite into
// pack/dist, which the manifest names as a "bundled" app's root.
import './style.css'

// window.apex exists only inside Apex. `npm run dev` opens the app in a normal
// browser, so a small stand-in keeps it usable there.
const apex = window.apex ?? {
  storage: {
    get: async (key) => JSON.parse(localStorage.getItem(key) ?? 'null'),
    set: async (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  },
  status: { set: async () => {}, clear: async () => {} },
  test: { ready: () => {} },
}

const app = document.getElementById('app')
app.innerHTML = `
  <h1>Tally</h1>
  <output id="count" aria-live="polite">0</output>
  <div class="buttons">
    <button id="less" type="button" aria-label="Count one less">−</button>
    <button id="more" type="button" aria-label="Count one more">+</button>
  </div>
  <button id="reset" type="button" class="quiet">Reset</button>
`

const out = document.getElementById('count')
let count = 0

async function set(next) {
  count = Math.max(0, next)
  out.textContent = String(count)
  apex.test.ready({ count })
  await apex.storage.set('count', count)
  await apex.status.set({ text: count ? `${count} counted` : null, badge: count || null })
}

document.getElementById('more').addEventListener('click', () => set(count + 1))
document.getElementById('less').addEventListener('click', () => set(count - 1))
document.getElementById('reset').addEventListener('click', () => set(0))
addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key === '+') void set(count + 1)
  if (event.key === 'ArrowDown' || event.key === '-') void set(count - 1)
})

apex.storage
  .get('count')
  .then((saved) => set(Number(saved) || 0))
  .catch(() => set(0))
