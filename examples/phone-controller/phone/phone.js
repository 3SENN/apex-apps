// The phone: joins the app with a name, turns on motion, and sends what the
// phone does over its socket (apexServer comes from __apex/client.js, which
// reconnects by itself). The app can buzz it: Android vibrates; an iPhone has
// no vibration for pages, but Safari gives a light tap when a switch flips.
(function () {
  'use strict'
  var nl = /^nl\b/i.test(navigator.language || '')
  var words = nl
    ? { title: 'Controller', name: 'Je naam', join: 'Doe mee', motion: 'Sta beweging toe', motionOn: 'Beweging staat aan', noMotion: 'Deze telefoon geeft geen beweging door', home: 'Home', touch: 'Aanwijzen', on: 'Verbonden', off: 'Opnieuw verbinden…' }
    : { title: 'Controller', name: 'Your name', join: 'Join', motion: 'Allow motion', motionOn: 'Motion is on', noMotion: 'This phone doesn’t share motion', home: 'Home', touch: 'Pointer', on: 'Connected', off: 'Reconnecting…' }
  document.documentElement.lang = nl ? 'nl' : 'en'
  document.querySelectorAll('[data-t]').forEach(function (el) {
    el.textContent = words[el.getAttribute('data-t')]
  })
  var $ = function (id) {
    return document.getElementById(id)
  }
  var link = null
  var send = function (m) {
    if (link) link.send(m)
  }
  // Motion and pad moves share 90 messages a second. The app takes 120 a
  // second from each phone, so a button press or release always fits: a lost
  // release would leave a button held down.
  var streamTokens = 0
  var streamAt = 0
  function mayStream() {
    var now = performance.now()
    streamTokens = Math.min(6, streamTokens + (now - streamAt) * 0.09)
    streamAt = now
    if (streamTokens < 1) return false
    streamTokens -= 1
    return true
  }
  var name = $('name')
  try {
    name.value = localStorage.getItem('apex-controller-name') || ''
  } catch (e) {}

  // The screen stays on while you play.
  var lock = null
  function stayAwake() {
    if (!navigator.wakeLock || document.visibilityState !== 'visible') return
    navigator.wakeLock.request('screen').then(function (l) {
      lock = l
    }, function () {})
  }
  document.addEventListener('visibilitychange', function () {
    if (!lock || lock.released) stayAwake()
  })

  $('go').addEventListener('click', function () {
    var who = name.value.trim() || 'Phone'
    try {
      localStorage.setItem('apex-controller-name', who)
    } catch (e) {}
    link = apexServer.connect({ query: { name: who } })
    link.onOpen(function () {
      $('status').textContent = words.on
    })
    link.onClose(function () {
      $('status').textContent = words.off
    })
    link.onMessage(function (m) {
      if (m && m.t === 'buzz') buzz(Number(m.ms) || 40)
    })
    $('join').hidden = true
    $('pad').hidden = false
    stayAwake()
  })

  // Motion: rotation rate, acceleration (with and without gravity) and the angles, at most 60 times a second.
  var frame = { t: 'motion' }
  var last = 0
  function sendFrame() {
    var now = performance.now()
    if (now - last < 16 || !mayStream()) return
    last = now
    frame.ts = Math.round(now)
    send(frame)
  }
  function round(n) {
    return typeof n === 'number' ? Math.round(n * 100) / 100 : null
  }
  function onOrientation(e) {
    frame.a = round(e.alpha)
    frame.b = round(e.beta)
    frame.g = round(e.gamma)
    sendFrame()
  }
  function onMotion(e) {
    var r = e.rotationRate || {}
    var a = e.acceleration || {}
    var g = e.accelerationIncludingGravity || {}
    frame.rx = round(r.alpha)
    frame.ry = round(r.beta)
    frame.rz = round(r.gamma)
    frame.x = round(a.x)
    frame.y = round(a.y)
    frame.z = round(a.z)
    frame.gx = round(g.x)
    frame.gy = round(g.y)
    frame.gz = round(g.z)
    frame.screen = (screen.orientation && screen.orientation.angle) || 0
    sendFrame()
  }
  function listen() {
    addEventListener('devicemotion', onMotion)
    addEventListener('deviceorientation', onOrientation)
    $('motion').textContent = words.motionOn
    $('motion').disabled = true
  }
  $('motion').addEventListener('click', function () {
    // An iPhone asks, and only on a tap; other phones just send.
    var ask = window.DeviceMotionEvent && DeviceMotionEvent.requestPermission
    if (!window.DeviceMotionEvent) {
      $('motion').textContent = words.noMotion
      return
    }
    if (!ask) return listen()
    DeviceMotionEvent.requestPermission().then(function (answer) {
      if (answer === 'granted') listen()
      else $('motion').textContent = words.noMotion
    }, function () {
      $('motion').textContent = words.noMotion
    })
  })

  // A, B and Home: down and up.
  ;['a', 'b', 'home'].forEach(function (b) {
    var el = $(b)
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault()
      el.classList.add('down')
      send({ t: 'button', b: b, down: true })
    })
    ;['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
      el.addEventListener(type, function () {
        if (!el.classList.contains('down')) return
        el.classList.remove('down')
        send({ t: 'button', b: b, down: false })
      })
    })
  })

  // The pad: where the finger is, 0 to 1 across and down.
  var touch = $('touch')
  var lastMove = 0
  function at(e) {
    var r = touch.getBoundingClientRect()
    return { x: Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * 1000) / 1000, y: Math.round(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) * 1000) / 1000 }
  }
  touch.addEventListener('pointerdown', function (e) {
    touch.setPointerCapture(e.pointerId)
    var p = at(e)
    send({ t: 'button', b: 'pad', down: true, x: p.x, y: p.y })
  })
  touch.addEventListener('pointermove', function (e) {
    if (!touch.hasPointerCapture(e.pointerId) || performance.now() - lastMove < 16 || !mayStream()) return
    lastMove = performance.now()
    var p = at(e)
    send({ t: 'pointer', x: p.x, y: p.y })
  })
  touch.addEventListener('pointerup', function (e) {
    var p = at(e)
    send({ t: 'button', b: 'pad', down: false, x: p.x, y: p.y })
  })

  var tapper = null
  function buzz(ms) {
    if (navigator.vibrate) return void navigator.vibrate(Math.min(ms, 400))
    if (!tapper) {
      tapper = document.createElement('label')
      tapper.style.cssText = 'position:fixed;left:-200px;top:0;opacity:0;pointer-events:none'
      var input = document.createElement('input')
      input.type = 'checkbox'
      input.setAttribute('switch', '')
      tapper.append(input)
      document.body.append(tapper)
    }
    tapper.click()
  }
})()
