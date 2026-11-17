# Phone controller

Phones on the same Wi-Fi scan a QR code and become controllers. The app runs
a small web server of its own, serves the phone page from this pack, and
draws each phone's tilt and buttons as they move. **Buzz** on a player's card
buzzes that phone.

What it shows:

- `permissions.server` with `"lan": true`: `atelier.server.start({ lan: true,
  root: 'phone' })` serves the pack's `phone/` folder on the Wi-Fi over https.
  The answer has `lanUrl` and `qr`, an image of that address for the page.
- When that start fails (in Atelier's playtest the server runs on this computer
  only), the app starts again without `lan` and shows the address on this
  computer.
- `atelier.server.onConnection`: one socket per phone. `socket.query.name` is the
  name the phone joined with. Each message is an object: `motion` (the angles,
  the rotation rate and the acceleration), `button` (A, B, Home and the pad,
  down and up) or `pointer` (where the finger is on the pad, 0 to 1).
- `socket.send({ t: 'buzz', ms })` to one phone. Android vibrates. An iPhone
  has no vibration for pages, so the page flips a hidden switch, which Safari
  answers with a light tap.
- `atelier.server.onStop`: when the person presses Stop on Atelier's bar, or the
  server stops, the page says so.
- The phone page is plain scripts: Atelier UI from `__atelier/kit/…`, then
  `__atelier/client.js`, whose `atelierServer.connect({ query })` reconnects by
  itself. It asks to keep the screen on while you play, and speaks English or
  Dutch by the phone's language.
- `atelier.test?.ready({ serving, phones })` every frame for Atelier's playtest.

The review lists: "Can run a small web server that phones and computers on
your Wi-Fi can open" and "Adds an app: Phone controller".

## Try it

1. Packs › **Load a folder…**, pick this folder, install.
2. Open **Phone controller**. It shows a QR code and the address.
3. On a phone on the same Wi-Fi, scan the code with the camera, or type the
   address.
4. Type a name and tap **Join**. Tap **Allow motion**, then tilt the phone
   and press A and B.

## What to read

- `app/main.js`: starting the server, the QR code, a card per phone, and the
  messages each phone sends. Turn `render()` and the message handling into
  your game.
- `phone/phone.js`: joining, motion at most 60 times a second, the buttons,
  the pad and the buzz. Turn `phone/index.html` and `phone/phone.css` into
  your controller.

## Gotchas

- On a Mac, macOS asks once whether Atelier may accept incoming connections.
  Choose Allow.
- The first time, the phone warns about the certificate. It is Atelier's own, on
  this computer: choose to go on. The page needs https, since phones give
  motion sensors only to secure pages.
- On an iPhone, motion needs a tap: the page asks for it when **Allow
  motion** is tapped. Other phones start sending on the same tap.
- The phone and the computer must be on the same Wi-Fi. Only this computer
  and private networks get in.
- The server lives as long as the app's page. Reloading the app starts it
  again with the same address while Atelier runs, so phones reconnect by
  themselves. Stop on Atelier's bar throws the token away, so the address
  changes: reload the app and scan the new code.
- It also stops after 15 minutes with no request and no socket.
- A socket takes up to 120 messages a second. Past that Atelier drops messages,
  and closes a socket that keeps going. A dropped button release would leave
  that button held down, so `phone.js` gives motion and pointer moves 90
  messages a second between them (`mayStream`), and presses and releases
  always fit.
- Up to 16 phones at once by default; `maxConnections` takes up to 32.

## Files

```
atelier-pack.json
app/index.html     the app's page (links Atelier UI first)
app/main.js        the server, the QR code and the players
app/style.css
phone/index.html   the page phones open, served by the app's server
phone/phone.js     joins, sends motion, buttons and the pad, buzzes
phone/phone.css
```
