# Underwater Dragon Pearl Collector - Game Specification

## Game Concept
A beautiful 2D pixel art game where players control an elegant underwater dragon swimming through ocean depths, collecting pearls while navigating a serene yet challenging underwater world.

---

## Visual Style & Aesthetic

### Art Direction
- **Style**: Pixel art (16-bit aesthetic with modern polish)
- **Color Palette**: Deep ocean blues, teals, purples with luminescent accents
- **Mood**: Magical, serene, beautiful with moments of wonder

### Dragon Design
- Serpentine/Eastern dragon aesthetic (fits underwater movement)
- Flowing fins and whiskers that trail elegantly in water
- Bioluminescent accents that glow
- Smooth swimming animations (idle, swim, dash, collect)

### Pearl Design
- Glowing orbs with subtle shimmer animation
- Multiple pearl types (white, pink, gold, black) with different values
- Particle effects when collected

### Environment
- Layered parallax backgrounds (deep ocean caves, coral reefs, kelp forests)
- Ambient sea life (jellyfish, fish schools, seahorses)
- Bubbles and light rays filtering from above

---

## Core Gameplay

### Controls
- Arrow keys / WASD for movement
- Spacebar for dash/boost
- Mouse click for special ability (optional)

### Mechanics
1. **Pearl Collection**: Swim through pearls to collect them
2. **Combo System**: Chain pearl pickups for score multipliers
3. **Dash Ability**: Quick burst of speed with cooldown
4. **Oxygen/Magic Meter**: Resource management element (optional)

### Game Mode: Endless
- Procedurally generated underwater scenery
- Difficulty gradually increases (more obstacles, faster pace)
- High score tracking with local storage

### Obstacles (Casual Challenge)
- **Sea Urchins**: Static hazards to avoid
- **Water Currents**: Push the dragon in a direction
- **Jellyfish**: Slow-moving obstacles with glow effect
- **Damage**: Hitting obstacles reduces health/score streak

---

## Technical Implementation

### Tech Stack
- **Engine**: Phaser.js (browser-based, great for 2D pixel games)
- **Audio**: Howler.js for sound effects and ambient music

### Project Structure
```
/underwater-dragon/
├── index.html
├── src/
│   ├── main.js          # Game initialization
│   ├── scenes/
│   │   ├── MenuScene.js
│   │   ├── GameScene.js
│   │   └── GameOverScene.js
│   ├── sprites/
│   │   ├── Dragon.js    # Player class
│   │   └── Pearl.js     # Collectible class
│   └── utils/
│       └── ParallaxBackground.js
├── assets/
│   ├── sprites/
│   │   ├── dragon/      # Dragon sprite sheets
│   │   └── items/       # Pearls, gems
│   ├── backgrounds/     # Parallax layers
│   ├── audio/
│   │   ├── music/       # Ambient underwater tracks
│   │   └── sfx/         # Collection sounds, dash, etc.
│   └── fonts/
└── style.css
```

---

## Asset Sources (Pixel Art)

### Dragon Sprites
| Source | Description | Link |
|--------|-------------|------|
| itch.io Dragons + Pixel Art | Free dragon sprites, sea serpents | https://itch.io/game-assets/free/tag-dragons/tag-pixel-art/tag-sprites |
| CraftPix Dragon Pack | Detailed dragon animations (take off, glide, attack, hurt) | https://craftpix.net/product/dragon-pixel-art-character-sprite-sheets-pack/ |
| itch.io Sea Serpent | Free animated sea serpent - perfect for underwater | https://itch.io/game-assets/tag-dragons/tag-pixel-art |

### Pearl & Gem Sprites
| Source | Description | Link |
|--------|-------------|------|
| itch.io Gems + Pixel Art | Free animated gem packs, crystals, jewels | https://itch.io/game-assets/tag-gems/tag-pixel-art |
| itch.io Free Gems | Shiny gem packs, 32x32 and 64x64 options | https://itch.io/game-assets/free/tag-gems |
| CraftPix Freebies | Free 2D game assets including icons and sprites | https://craftpix.net/freebies/ |

### Underwater Backgrounds & Environment
| Source | Description | Link |
|--------|-------------|------|
| itch.io Underwater | Underwater Fantasy Pixel Art, cave backgrounds | https://itch.io/game-assets/tag-pixel-art/tag-underwater |
| CraftPix Underwater Enemies | Sea creatures for environment/obstacles | https://craftpix.net/product/underwater-main-enemies-pixel-sprite-pack/ |
| OpenGameArt | Community pixel art collections | https://opengameart.org/ |

---

## Implementation Phases

### Phase 1: Core Foundation
- [ ] Set up Phaser.js project structure
- [ ] Create basic game scene with underwater background
- [ ] Implement dragon sprite with swimming animation
- [ ] Add basic movement controls (smooth, floaty underwater feel)

### Phase 2: Collectibles & Scoring
- [ ] Add pearl sprites with glow animation
- [ ] Implement collision detection for collection
- [ ] Create scoring system with UI display
- [ ] Add collection sound effects and particle effects

### Phase 3: Polish & Beauty
- [ ] Implement parallax scrolling backgrounds
- [ ] Add ambient sea life (decorative sprites)
- [ ] Create bubble particle effects
- [ ] Add light ray effects filtering from surface
- [ ] Implement dragon trail/glow effect

### Phase 4: Gameplay Loop
- [ ] Add dash/boost mechanic
- [ ] Implement combo system for chained collections
- [ ] Create endless level generation
- [ ] Add menu screens and game over flow

### Phase 5: Audio & Final Polish
- [ ] Add ambient underwater music
- [ ] Implement sound effects for all actions
- [ ] Add screen transitions
- [ ] Final balancing and testing

---

## Verification & Testing

1. **Run locally**: `npx http-server` or similar to serve the game
2. **Test controls**: Verify smooth, responsive dragon movement
3. **Test collection**: Ensure pearls are collected on contact
4. **Visual check**: Confirm parallax, particles, and glow effects render beautifully
5. **Performance**: Maintain 60fps on target devices

---

## Design Decisions (Confirmed)

- **Engine**: Phaser.js (browser-based, easy to share)
- **Gameplay Style**: Casual Challenge (obstacles like currents, sea urchins to avoid)
- **Game Mode**: Endless Mode (procedurally generated, survive as long as possible)
- **Platform**: Web browser
