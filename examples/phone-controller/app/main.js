// Phones as controllers: this app runs a small web server of its own
// (permissions.server with lan), shows a QR code that phones on the same
// Wi-Fi scan, and draws each phone's tilt and buttons. The phone page is
// phone/ in this pack (phone.js sends what the phone does over its socket).
const app = document.getElementById('app')
app.className = 'ax-app'
app.innerHTML = '<div class="ax-stack">'
  + '<h1 class="ax-title">Phone controller</h1>'
  + '<section class="join ax-card"><img class="qr" alt="QR code to join" hidden>'
  + '<div class="ax-stack"><p class="ax-subtitle" id="say">Starting…</p><p class="address ax-muted" id="address"></p>'
  + '<ol class="steps ax-small"><li>Join the same Wi-Fi as this computer.</li><li>Scan the code with the phone’s camera, or type the address.</li>'
  + '<li>The first time, the phone warns about the certificate: choose to go on (it is Atelier’s own, on this computer).</li><li>Tap Allow motion, then tilt the phone.</li></ol></div></section>'
  + '<section class="players" id="players" aria-live="polite"></section></div>'
const qr = app.querySelector('.qr')
const say = document.getElementById('say')
const address = document.getElementById('address')
const players = document.getElementById('players')

// Every phone: its socket, its name, where it points and what it holds.
const phones = new Map()

function card(phone) {
  const el = document.createElement('article')
  el.className = 'player ax-card'
  el.innerHTML = '<div class="tilt"><div class="paddle"></div></div><div class="ax-stack"><p class="ax-subtitle name"></p>'
    + '<p class="ax-small ax-muted angles">Waiting for motion…</p><div class="ax-cluster"><span class="key" data-key="a">A</span><span class="key" data-key="b">B</span>'
    + '<button class="ax-btn ax-btn--sm buzz" type="button">Buzz</button></div></div>'
  el.querySelector('.name').textContent = phone.name
  el.querySelector('.buzz').addEventListener('click', () => phone.socket.send({ t: 'buzz', ms: 80 }))
  players.append(el)
  return el
}

function render() {
  for (const phone of phones.values()) {
    const paddle = phone.el.querySelector('.paddle')
    // beta tilts forward and back, gamma left and right (degrees).
    paddle.style.transform = 'rotateX(' + (-phone.beta).toFixed(1) + 'deg) rotateY(' + phone.gamma.toFixed(1) + 'deg)'
    if (phone.moved) phone.el.querySelector('.angles').textContent = 'Tilt ' + Math.round(phone.beta) + '°, ' + Math.round(phone.gamma) + '° · swing ' + phone.swing.toFixed(0)
    for (const key of phone.el.querySelectorAll('.key')) key.classList.toggle('down', phone.held.has(key.dataset.key))
  }
  atelier.test?.ready({ serving: Boolean(status), phones: phones.size })
  requestAnimationFrame(render)
}

atelier.server.onConnection((socket) => {
  const phone = { socket, name: socket.query.name || 'Phone', beta: 0, gamma: 0, swing: 0, moved: false, held: new Set(), el: null }
  phone.el = card(phone)
  phones.set(socket.id, phone)
  socket.send({ t: 'welcome', slot: phones.size })
  socket.onMessage((m) => {
    if (!m || typeof m !== 'object') return
    if (m.t === 'motion') {
      phone.beta = Number(m.b) || 0
      phone.gamma = Number(m.g) || 0
      // How fast it turns (degrees a second): a swing is a big number.
      phone.swing = Math.hypot(Number(m.rx) || 0, Number(m.ry) || 0, Number(m.rz) || 0)
      phone.moved = true
    } else if (m.t === 'button' && typeof m.b === 'string') {
      if (m.down) phone.held.add(m.b)
      else phone.held.delete(m.b)
      if (m.b === 'a' && m.down) socket.send({ t: 'buzz', ms: 30 })
    }
  })
  socket.onClose(() => {
    phone.el.remove()
    phones.delete(socket.id)
  })
})

atelier.server.onStop((reason) => {
  status = null
  qr.hidden = true
  say.textContent = reason === 'person' ? 'Sharing stopped. Reload to share again.' : 'The server stopped.'
})

// On the Wi-Fi when it can be (in test_pack, on this computer only).
let status = null
try {
  status = await atelier.server.start({ lan: true, root: 'phone' })
} catch {
  status = await atelier.server.start({ root: 'phone' }).catch((err) => {
    say.textContent = err.message
    return null
  })
}
if (status) {
  say.textContent = status.lanUrl ? 'Scan with a phone on the same Wi-Fi' : 'Open this address on this computer'
  address.textContent = status.lanUrl || status.url
  if (status.qr) {
    qr.src = status.qr
    qr.hidden = false
  }
}
requestAnimationFrame(render)
