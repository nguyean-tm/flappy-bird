# 🐦 Flappy Bird

A zero-dependency Flappy Bird clone built with **HTML5 Canvas** and vanilla JavaScript.

## Play

Just open `index.html` in any modern browser — no build step, no npm, nothing.

## Controls

| Action | Input |
|--------|-------|
| Flap   | `Space`, `↑`, or **click / tap** anywhere on the canvas |
| Restart after death | Same as above |

## Features

- Smooth 60 fps `requestAnimationFrame` loop
- Physics: gravity + jump impulse, tilt angle follows velocity
- Procedurally generated pipes with randomised gap heights
- Ground scroll animation
- Persistent best-score shown on the overlay (session memory)
- Styled idle and game-over overlays
- Fully responsive canvas wrapper

## Structure

```
├── index.html   — markup & canvas element
├── style.css    — dark background, overlay styling
└── game.js      — all game logic (self-contained IIFE)
```

## Running locally

```bash
# Any static file server works, e.g.:
npx serve .
# or
python3 -m http.server
```

Then visit `http://localhost:3000` (or whichever port the server prints).
