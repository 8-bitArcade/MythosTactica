# CLAUDE.md — MythosTactica

This file provides AI assistants with a comprehensive overview of the MythosTactica codebase, development conventions, and workflows.

---

## Project Overview

**MythosTactica** (formerly Ancient Beast) is a turn-based strategy indie game built with TypeScript and Phaser 3. Players summon creatures on a hexagonal grid and battle opponents in a tactical combat system.

- **Version**: 0.5.0 "Chimera"
- **License**: AGPL-3.0 (code), CC-BY-SA-4.0 (assets/audio)
- **Homepage**: https://MythosTactica.com
- **Repository**: https://github.com/8-bitArcade/MythosTactica

---

## Tech Stack

| Layer | Technology |
|---|---|
| Game engine | Phaser 4 (v4.0.0) |
| Language | TypeScript (v4.5.2), target ES2017 |
| Build | Webpack 5 + Babel 7 |
| CSS | LESS preprocessor |
| Testing | Jest 29 + jsdom |
| Linting | ESLint 8 + Prettier 2 |
| Git hooks | Husky 8 + lint-staged |
| Multiplayer | Nakama (`@heroiclabs/nakama-js`) |
| Runtime utilities | Underscore.js, js-cookie |
| Container | Docker (node:lts base) |

---

## Repository Structure

```
MythosTactica/
├── src/                        # All TypeScript source code
│   ├── __tests__/              # Jest test files (mirrors src structure)
│   ├── abilities/              # Per-creature ability files (one per creature)
│   ├── data/                   # Game data: UnitData.ts, types.ts
│   ├── models/                 # Core entity classes
│   ├── scenes/                 # Phaser 3 scene classes
│   ├── services/               # Manager/service classes
│   ├── sound/                  # Audio system
│   ├── style/                  # LESS stylesheets
│   ├── triggers/               # Event trigger system
│   ├── ui/                     # UI components
│   ├── utility/                # Pure helper functions/classes
│   ├── multiplayer/            # Nakama networking layer
│   ├── templates/              # HTML snippet templates
│   ├── game.ts                 # Root Game class (singleton: G)
│   ├── script.ts               # Application entry point
│   ├── animations.ts           # Creature/ability animation helpers
│   ├── assets.ts               # Asset loading helpers
│   ├── damage.ts               # Damage calculation
│   ├── debug.ts                # Debug flags (read from .env)
│   └── index.ejs               # Webpack HTML template
├── assets/                     # Game assets (sprites, music, sounds, fonts)
├── static/                     # Static files copied verbatim to deploy/
├── types/                      # TypeScript ambient declarations (global.d.ts)
├── deploy/                     # Build output — do NOT commit
├── .github/                    # Issue templates, PR template
├── .husky/                     # Git hooks (pre-commit)
├── .kiro/                      # Kiro AI spec files
├── package.json
├── tsconfig.json
├── webpack.config.js
├── jest.config.js
├── .babelrc.js
├── .eslintrc.json
├── .prettierrc
├── .env.example                # Copy to .env for local config
└── Dockerfile
```

---

## Key Source Files

### Entry Point & Root Singleton

| File | Purpose |
|---|---|
| `src/script.ts` | App bootstrap, DOM utilities (jQuery replacement), creates `Game` |
| `src/game.ts` | `Game` class — global singleton exposed as `G`; owns all subsystems |

### Core Models (`src/models/`)

| File | Purpose |
|---|---|
| `Creature.ts` | Creature entity: stats, position, abilities, effects, movement |
| `Ability.ts` | Ability system: triggers, costs, requirements, activation logic |
| `Player.ts` | Player state and control |
| `Effect.ts` | Status effects (buffs/debuffs) |
| `Trap.ts` | Trap mechanics |
| `Drop.ts` | Item drop mechanics |
| `Creature_queue.ts` | Turn-order queue data structure |

### Services (`src/services/`)

| File | Purpose |
|---|---|
| `GameManager.ts` | Central orchestration: phase transitions, turn flow, trigger dispatch |
| `CreatureManager.ts` | Creature lifecycle (summon, remove, ID management) |
| `PlayerManager.ts` | Player and ability management |
| `EffectManager.ts` | Applying/removing status effects |
| `TrapManager.ts` | Trap placement and activation |

### Game Data (`src/data/`)

| File | Purpose |
|---|---|
| `UnitData.ts` | Master database of all 19 playable units (stats, abilities, animations) |
| `types.ts` | TypeScript types for unit data structures |

### Abilities (`src/abilities/`)

One file per creature (18 files). Each exports an array of 4 ability objects conforming to the `Ability` interface. Examples: `Chimera.ts`, `Golden-Wyrm.ts`, `Snow-Bunny.ts`.

### Hex Grid & Pathfinding (`src/utility/`)

| File | Purpose |
|---|---|
| `hexgrid.ts` | Hex grid: tile queries, movement validation, targeting, display |
| `hex.ts` | Hex math: coordinates, directions, distance |
| `pathfinding.ts` | A* pathfinding |
| `matrices.ts` | Matrix operations for grid range computations |
| `pointfacade.ts` | Coordinate abstraction layer |
| `arrayUtils.ts`, `string.ts`, `math.ts`, etc. | General-purpose helpers |
| `const.ts` | Game-wide constants |

### UI (`src/ui/`)

| File | Purpose |
|---|---|
| `interface.ts` | Monolithic UI manager (~2700 lines) — creature cards, combat info, notifications |
| `queue.ts` | Turn queue display |
| `hotkeys.ts` | Keyboard shortcut handling |
| `button.ts` | Custom button component |
| `chat.ts` | In-game chat |
| `meta-powers.ts` | Special power UI |
| `quickinfo.ts` | Tooltip/quick-info display |
| `progressbar.ts` | HP/energy progress bars |
| `fullscreen.ts` | Fullscreen toggle |

### Phaser Scenes (`src/scenes/`)

Boot → Preload → Menu → Match

| Scene | Purpose |
|---|---|
| `BootScene.ts` | Application bootstrap |
| `PreloadScene.ts` | Asset loading (images, sprites, audio) |
| `MenuScene.ts` | Matchmaking lobby and main menu |
| `MatchScene.ts` | Hex grid battle rendering and input |

### Multiplayer (`src/multiplayer/`)

Nakama (heroiclabs) backend.

| File | Purpose |
|---|---|
| `connect.ts` | Socket connection |
| `authenticate.ts` | User auth |
| `session.ts` | Session management |
| `match.ts` | Match data & server communication |
| `gameplay.ts` | Gameplay event synchronization |

### Triggers (`src/triggers/`)

Event-based hook system for creature abilities.

| File | Purpose |
|---|---|
| `index.ts` | Exports |
| `BaseTrigger.ts` | Abstract base class |
| `SpecificTriggers.ts` | Concrete trigger implementations |
| `TriggerContexts.ts` | Context objects passed to trigger callbacks |
| `TriggerManager.ts` | Registration and dispatch |
| `TriggerTypes.ts` | Enum/union of all trigger names |

**Trigger names** (used in ability definitions):
- Query: `onQuery`
- Phase: `onStartPhase`, `onEndPhase`
- Combat: `onDamage`, `onAttack`, `onUnderAttack`
- Movement: `onStepIn`, `onStepOut`, `onCreatureMove`
- Lifecycle: `onCreatureDeath`, `onCreatureSummon`
- Effects: `onEffectAttach`, `onReset`

Full documentation: `TRIGGER_SYSTEM_DOCUMENTATION.md`

### Sound (`src/sound/`)

| File | Purpose |
|---|---|
| `soundsys.ts` | Web Audio API: gain nodes for music, SFX, heartbeat, announcer |
| `musicplayer.ts` | Music playback |
| `bufferloader.ts` | Audio buffer loading |
| `pre-match-audio.ts` | Pre-match audio setup |

### Styles (`src/style/`)

LESS files, imported via `main.less`.

| File | Purpose |
|---|---|
| `styles.less` | Core game styles (~37KB) |
| `cards.less` | Unit card styles |
| `grid.less` | Hex grid styles |
| `pre-match.less` | Matchmaking UI |
| `avatars.less` | Unit avatar styles |
| `icons.less`, `fonts.less`, `slider.less`, `raster.less` | Component styles |
| `skin.css` | Skin overrides |

---

## NPM Scripts

```bash
npm install           # Install dependencies
npm run start         # Dev server on http://localhost:8080 (watches & rebuilds)
npm run build         # Production build → deploy/
npm run build:dev     # Development build (unminified, inline source maps)
npm test              # lint + build + jest
npm run jest          # Jest tests only
npm run start:jest    # Jest in watch mode
npm run lint          # ESLint check (TS + JS)
npm run lint-fix      # ESLint auto-fix
npm run lint-error    # ESLint errors only
npm run eslint-check  # Verify ESLint/Prettier compatibility
```

---

## Build & Configuration Details

### Webpack (`webpack.config.js`)

- **Entry**: `src/script.ts` (with babel-polyfill)
- **Output**: `deploy/[name].[contenthash].bundle.js`
- **Dev server**: port `8080`; proxies `/api/**` to Nakama backend (`159.65.232.104:7350`)
- **Asset size limit**: 5 MB (music and images exempt)
- **HTML template**: `src/index.ejs` via HtmlWebpackPlugin
- **Static files**: `static/` is copied verbatim to `deploy/`

### TypeScript (`tsconfig.json`)

- Target: `ES2017`, Module: `ESNext`
- Output to `./deploy/`
- Source maps enabled
- Includes `src/` and `types/`

### Babel (`.babelrc.js`)

- Presets: `@babel/preset-typescript`, `@babel/preset-env`
- Plugin: `@babel/plugin-transform-runtime`
- **In test mode**: CommonJS modules (for Jest); **otherwise**: preserve ES modules for tree-shaking

### ESLint (`.eslintrc.json`)

- Parser: `@typescript-eslint/parser`
- Rules (errors): `prettier/prettier`, `no-undef`, `no-multi-assign`
- Rules (warnings): `no-unused-vars`, `no-empty-function`, `prefer-const`, `no-this-alias`
- Globals: `Phaser`, `__WebpackModuleApi`

### Prettier (`.prettierrc`)

- Print width: 100
- Single quotes, tabs (size 2), trailing commas, auto line endings

### Jest (`jest.config.js`)

- Environment: `jsdom`
- Coverage: v8
- Test patterns: `**/__tests__/**/*.[jt]s?(x)` and `**/*.test.[tj]s?(x)`

---

## Environment Variables

Copy `.env.example` to `.env`:

```
DEBUG_MODE=true/false
DEBUG_AUTO_START_GAME=true/false
DEBUG_GAME_LOG=true/false
DEBUG_DISABLE_MUSIC=true/false
DEBUG_DISABLE_HOTKEYS=true/false
DEBUG_ENABLE_FAST_WALKING=true/false

MULTIPLAYER_IP=online.MythosTactica.com
MULTIPLAYER_PORT=443
MULTIPLAYER_SSL=true
MULTIPLAYER_KEY=<key>

ENABLE_SERVICE_WORKER=false
```

---

## Application Flow

1. **Bootstrap**: `src/script.ts` → creates `Game` instance (`G`) and DOM utilities
2. **Phaser boot**: `BootScene` → `PreloadScene` (load all assets) → `MenuScene` → `MatchScene`
3. **Match initialization**: `GameManager` sets up players, `HexGrid` creates battlefield
4. **Turn loop**:
   - `CreatureQueue` determines turn order
   - `GameManager` transitions phases: `StartPhase` → `ActionPhase` → `EndPhase`
   - Trigger system fires hooks (`onStartPhase`, `onQuery`, `onDamage`, …)
   - `PlayerManager` processes input and executes actions
   - Animations update via `animations.ts`
5. **Multiplayer**: Nakama WebSocket syncs gameplay events in real time

**Global singleton access pattern**:
```typescript
// G is the root Game instance, accessible globally
G.playerManager   // PlayerManager
G.creatureManager // CreatureManager
G.gameManager     // GameManager
G.grid            // HexGrid
G.UI              // Interface (UI manager)
```

---

## Coding Conventions

### File Naming

| Context | Convention | Example |
|---|---|---|
| Classes / components | PascalCase | `Creature.ts`, `MatchScene.ts` |
| Utilities / features | kebab-case | `pre-match-audio.ts`, `hexgrid.ts` |
| Test files | mirror source path | `src/__tests__/utility/gamelog.ts` |

### Code Style

- **Indentation**: Tabs, size 2
- **Quotes**: Single quotes
- **Line length**: Max 100 characters
- **Trailing commas**: Yes
- **Line endings**: LF (auto-detected)
- Legacy jQuery `$`-prefixed variables are being removed — do not introduce new ones
- Use native DOM APIs and the utilities in `src/script.ts` instead

### TypeScript

- Define new types in `src/data/types.ts` or close to the model they describe
- Avoid `@ts-ignore`; prefer `@ts-expect-error` with a comment when suppression is necessary
- Strict null checking is enabled — handle `null`/`undefined` explicitly
- New files should be `.ts` — do not create new `.js` files

### Design Patterns in Use

- **Manager / Service pattern**: Each subsystem has a dedicated manager class
- **Observer / Trigger pattern**: Ability side-effects fire through the trigger system, not direct calls
- **Singleton**: `G` (Game) is the global root; avoid adding more globals
- **Factory**: Creatures/abilities are instantiated from `UnitData.ts` descriptors

### Adding a New Creature

1. Add unit stats/config to `src/data/UnitData.ts`
2. Create `src/abilities/<CreatureName>.ts` exporting an array of 4 ability objects
3. Add unit sprites under `assets/units/<CreatureName>/`
4. Register the ability file in the ability loader

### Adding a New Ability Trigger

See `TRIGGER_SYSTEM_DOCUMENTATION.md`. Register in `TriggerManager.ts` and add the type to `TriggerTypes.ts`.

---

## Testing

Tests live in `src/__tests__/` mirroring the source tree.

```bash
npm run jest                    # Run all tests
npm run start:jest              # Watch mode
npm run jest -- --coverage      # With coverage report
npm run jest -- path/to/test    # Single file
```

Current test coverage areas:
- `Creature` class — lifecycle and ID management
- Utility functions — `gamelog`, `version`, `string`, `pointfacade`
- UI — `queue` turn display

When adding functionality, add tests in the corresponding `__tests__` subdirectory.

---

## Git Workflow

- **Primary branch**: `master`
- **Feature branches**: `<author>/<feature-slug>` or `claude/<feature-slug>`
- **Pre-commit hooks** (Husky + lint-staged): ESLint runs automatically on staged files
- **PR template**: `.github/PULL_REQUEST_TEMPLATE.md` — fill it out completely
- Commit messages follow conventional-ish style: `feat:`, `fix:`, `refactor:`, `docs:`

---

## Known Technical Debt & Active Work

| Area | Status |
|---|---|
| TypeScript conversion | In progress — most files converted; some `@ts-expect-error` remain |
| Phaser 3 migration | In progress — see `PHASER3_MIGRATION.md` for detailed status |
| jQuery removal | In progress — `src/script.ts` provides native replacements |
| `src/ui/interface.ts` | Monolithic (~2700 lines) — needs splitting into focused components |
| Sound system | Partial refactor needed (noted in `pre-match-audio.ts`) |

When working on these areas, prefer incremental improvements that maintain existing behaviour. Do not introduce new jQuery usage.

---

## Important Documentation Files

| File | Contents |
|---|---|
| `README.md` | Project overview, features, contribution links |
| `CONTRIBUTING.md` | Dev setup, Node.js requirements, Docker instructions |
| `HOW_TO_PLAY.md` | Game rules, controls, mechanics guide |
| `PHASER4_MIGRATION.md` | Migration checklist and status |
| `TRIGGER_SYSTEM_DOCUMENTATION.md` | Full event trigger API reference |
| `SECURITY.md` | Vulnerability reporting process |
| `CODE_OF_CONDUCT.md` | Community standards |
| `.env.example` | All supported environment variables with descriptions |

---

## Docker

```bash
docker build -t mythostactica .
docker run -p 8080:8080 mythostactica
```

The container installs dependencies, runs `npm run build:dev`, then starts the dev server.
