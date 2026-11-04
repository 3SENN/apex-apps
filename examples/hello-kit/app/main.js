// Hello kit: the person's companion on a little stage, drawn with the Apex
// kit. "Say hi" (or a click on the companion) cheers it up. No build step:
// "three" and "apex-kit/..." come from the import map Apex adds because the
// manifest says "kit": 1.
import * as THREE from 'three'
import { character } from 'apex-kit/character.js'

const stage = document.getElementById('stage')
const hello = document.getElementById('hello')
const hiButton = document.getElementById('hi')
const pickButton = document.getElementById('pick')

// The "art" slot: the asset pack the person picked for it, else this app's own app/art/ files.
// Read once at start; picking another asset pack reloads the app.
const art = (path) => apex.assets.url('art', path)
document.body.style.backgroundImage = `url("${art('backdrop.svg')}")`
const palette = await fetch(art('palette.json'))
  .then((res) => res.json())
  .catch(() => ({ floor: '#9fd8a8', light: '#ffffff' }))

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
stage.append(renderer.domElement)
const scene = new THREE.Scene()
scene.add(new THREE.HemisphereLight(palette.light, 0x8877aa, 2.2))
const sun = new THREE.DirectionalLight(0xffffff, 1.5)
sun.position.set(3, 6, 4)
scene.add(sun)
const floor = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), new THREE.MeshToonMaterial({ color: palette.floor }))
floor.rotation.x = -Math.PI / 2
scene.add(floor)
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50)
camera.position.set(0, 1.4, 5)
camera.lookAt(0, 0.6, 0)

let body = null // what stands on the floor: the companion, or a stand-in shape
let pip = null // the kit character, when there is a companion
let name = null
let hellos = 0

// Opened from a world's place? Then the cast is whoever is there: the visitor first.
const here = await apex.world.context()

async function show(members) {
  if (body) scene.remove(body)
  pip?.dispose()
  const [me] = members
  pip = me ? await character(me.look, { mood: 'idle' }) : null
  // An empty cast (a test run, or nobody picked yet) gets a stand-in, never a blank page.
  body = pip ? pip.object3d : new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.5, 8, 16), new THREE.MeshToonMaterial({ color: 0x6b5bff }))
  if (!pip) body.position.y = 0.6
  scene.add(body)
  name = me ? me.name : null
  const others = members.slice(1).map((m) => m.name)
  const where = here ? ` Welcome to ${here.place.name} in ${here.world.name}.` : ''
  const company = others.length ? ` ${others.join(' and ')} ${others.length === 1 ? 'is' : 'are'} here too.` : ''
  hello.textContent = name ? `Hello, ${name}!${where}${company}` : 'Nobody is playing yet. Pick a companion.'
}

await show(here?.cast.length ? here.cast : await apex.cast.members())

function sayHi() {
  hellos++
  pip?.setMood('happy')
  setTimeout(() => pip?.setMood('idle'), 1200)
  // The app's sidebar row shows this while the app is open.
  void apex.status.set({ text: `${hellos} hello${hellos === 1 ? '' : 's'}`, badge: hellos })
}

hiButton.addEventListener('click', sayHi)

const raycaster = new THREE.Raycaster()
renderer.domElement.addEventListener('pointerdown', (event) => {
  const rect = renderer.domElement.getBoundingClientRect()
  const at = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
  raycaster.setFromCamera(at, camera)
  if (body && raycaster.intersectObject(body, true).length > 0) sayHi()
})

pickButton.addEventListener('click', async () => {
  try {
    // Apex asks the person who plays; cancelling keeps the cast as it was.
    await show(await apex.cast.pick({ max: 1 }))
  } catch (err) {
    hello.textContent = err.message
  }
})

function resize() {
  renderer.setSize(stage.clientWidth, stage.clientHeight)
  camera.aspect = stage.clientWidth / Math.max(1, stage.clientHeight)
  camera.updateProjectionMatrix()
}
addEventListener('resize', resize)
resize()

let last = performance.now()
let blinkIn = 3
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if ((blinkIn -= dt) < 0) {
    pip?.blink()
    blinkIn = 2.5 + Math.random() * 3
  }
  pip?.update(dt)
  renderer.render(scene, camera)
  // What Apex's playtest reads. Cheap: Apex sends it only when it changes.
  apex.test?.ready({ companion: name, hellos })
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
