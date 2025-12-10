# Soothing Square - p5.js Version

A rhythm-based geometric puzzle game where you time arrow key presses to match when a red square bounces off walls, synchronized to music.

## How to Play

1. **Open the game**: Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)

2. **Controls**:
   - **Arrow Keys**: Press when the square bounces (match the wall direction, not where the square is going!)
   - **P**: Play/Pause
   - **H**: Toggle help screen
   - **I**: Invert controls (only when help is visible)
   - **C**: Enable cheats/auto-play (only when help is visible)
   - **T**: Skip 10 seconds ahead
   - **Click level title**: Cycle between levels (Mario, Tetris, Megalovania)
   - **Click ? button**: Show/hide help

3. **Gameplay**:
   - Watch the triangular indicators pointing toward bounce directions
   - Press the correct arrow key when the square hits a wall
   - Build combos for score multipliers (2x, 4x, 8x)
   - Don't run out of lives!

## Levels

- **Mario** (Super Mario Bros Theme): 3 lives, easier
- **Tetris** (Tetris Theme): 5 lives, medium
- **Megalovania** (Undertale): 10 lives, harder (240 BPM)

## Features

- ✅ Procedurally-generated maze from audio timing data
- ✅ Trail effect with ghost squares
- ✅ Particle explosions on hits and deaths
- ✅ Camera flip animation when you miss
- ✅ Rainbow-cycling maze outline
- ✅ Combo system with multipliers
- ✅ Three complete levels with music

## Technical Details

Converted from Kivy/Python to p5.js/JavaScript with complete feature parity:
- Complex geometry algorithms for procedural generation
- Audio synchronization using p5.sound
- Smooth camera animations
- All visual effects preserved

## Browser Compatibility

Requires:
- Modern browser with Web Audio API support
- ES6 JavaScript support
- Canvas 2D context

## Running Locally

Simply open `index.html` in your browser. No build process or server required!

For better performance, you can serve it with a local HTTP server:
```bash
python3 -m http.server 8000
# Then open http://localhost:8000
```

## Original Version

This is a p5.js port of the original Kivy/Python implementation.
