# 3D Tic-Tac-Toe

A mobile-first 3D tic-tac-toe game. The board is a cube you rotate and pinch-zoom
with your fingers (Three.js), you place marks by tapping an empty cell, and both
players play on a chess clock. Play against a bot, pass-and-play locally with a
friend, or play online against a remote opponent.

Built as an installable web app (PWA) so it can be added to a phone's home
screen and launched like a native app, without needing an app store.

## Features

- **3D board** — choose classic 3×3×3 or the deeper 4×4×4 ("Qubic") variant.
  Win by getting a full line of your marks in *any* of the cube's 13
  directions (rows, columns, pillars, face diagonals, and space diagonals).
- **Free rotate + pinch zoom** — drag to orbit the cube, pinch to zoom.
  A layer slider isolates one horizontal slice at a time so you can reliably
  tap cells buried inside the cube.
- **Bot opponent** — three difficulties. Easy plays loosely, Medium and Hard
  run a depth-limited minimax search (with alpha-beta pruning) on a Web
  Worker so the UI never freezes while it "thinks."
- **Pass & Play** — two people, one device, alternating turns.
- **Online** — host a game to get a short room code, or join one. Uses
  [PeerJS](https://peerjs.com/) for a direct WebRTC connection between the two
  players — no game server required, only PeerJS's public broker to make the
  initial handshake.
- **Chess clock** — pick a preset (1/3/5/10 minutes, with increment) or play
  untimed. Running out of time loses the game, same as in chess.

## Running it

```bash
npm install
npm run dev       # dev server with hot reload
npm run build     # production build (also generates the PWA service worker)
npm run preview   # serve the production build locally
```

Open the dev/preview URL on your phone (same network) or in a mobile browser's
device-emulation mode to get the intended touch experience. On a phone,
"Add to Home Screen" installs it as a standalone app.

## Project layout

```
src/
  game/            Framework-agnostic game logic
    board.ts        board model, win-line generation, move application
    ai.ts            bot move selection (heuristics + minimax/alpha-beta)
    aiWorker.ts      Web Worker entry point running the bot off the main thread
    aiClient.ts      promise wrapper around the worker (falls back to sync)
    timer.ts         chess clock state machine
    multiplayer.ts   PeerJS host/join session wrapper
    store.ts         Zustand store wiring board + AI + timer + multiplayer together
  three/           3D rendering (react-three-fiber)
    Scene.tsx        canvas, camera, lighting, OrbitControls, drag-vs-tap detection
    CubeGrid.tsx     lays out cells for the current board size
    CubeCell.tsx     one cell: tap target + wireframe / marker
    Marker.tsx       X / O 3D shapes
  components/      Screens (menu, online lobby, in-game HUD, winner overlay)
```

## Notes on the online mode

Online play connects two browsers directly (WebRTC data channel) after using
PeerJS's public signaling server to exchange connection info; no application
server or database is needed. That signaling server is an external, third-party
service reachable over the open internet — it worked as expected in local
testing, but if you deploy behind a restrictive corporate network or firewall
that blocks arbitrary outbound WebSocket connections, the "Host"/"Join" flow
may not connect. Self-hosting a [PeerServer](https://github.com/peers/peerjs-server)
is a drop-in fix if that ever comes up (swap the broker host in
`src/game/multiplayer.ts`).

## Icons

`public/favicon.svg` is the source icon; `public/pwa-192.png`,
`public/pwa-512.png`, and `public/pwa-maskable-512.png` are pre-rendered from
it for the PWA manifest. Regenerate them after editing the SVG with:

```bash
npm install -D sharp
node scripts/generate-icons.mjs
npm uninstall sharp
```
