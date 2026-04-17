# Phaser 4 Migration for MythosTactica

> **Upgraded to Phaser 4.0.0 "Caladan" on 2026-04-13.**

## Phaser 4 Upgrade — Changes Applied

### Breaking Changes Fixed (Phaser 3 → 4)
- [x] `Phaser.Geom.Point` removed — replaced with `Phaser.Math.Vector2` (`src/utility/hex.ts`)
- [x] Default export removed — all `import Phaser from 'phaser'` changed to `import * as Phaser from 'phaser'`
- [x] `roundPixels` defaults to `false` — added `render: { pixelArt: true }` to game config (`src/game.ts`)
- [x] Unused arcade physics block removed — was never used, avoided API drift (`src/game.ts`)
- [x] `G.Phaser.add.audio()` (Phaser 2 API) — replaced with `G.createSound().play()` (`src/abilities/Infernal.ts`)
- [x] Game loop wired up — `MatchScene.update()` calls `game.phaserUpdate()` and `game.gameManager.phaserUpdate()`

## TypeScript Conversion Status

All source files under `src/` are TypeScript. No `.js` files remain in the game source or test suites — the last holdout (`src/__tests__/utility/math.js`) was converted to `.ts` on 2026-04-17.

Files intentionally left as `.js`:
- `webpack.config.js`, `jest.config.js`, `.babelrc.js` — build tooling consumed by Node directly.
- `static/analytics.js`, `static/worker.js` — copied verbatim to `deploy/` and served as-is.

## Phaser 2 → Phaser 4 Compatibility Shims

The following shims remain in `src/game.ts` because creature ability files call them heavily. They are thin wrappers over Phaser 4 APIs — remove only when migrating the ability files themselves:

| Shim | Wraps | Callers |
|---|---|---|
| `Game.cameraShake` | `Scene.cameras.main.shake` | 40+ ability files |
| `Game.createTween` | `Scene.tweens.add` | `animations.ts`, `Creature`, `Trap`, `Drop`, `Ability`, `Snow-Bunny` |
| `Game.createSound` | `SoundSys.playSFX` | `Infernal.ts` |
| `SignalChannel` | `Phaser.Events.EventEmitter` | `GameManager`, `hex`, `hexgrid`, `Player`, `meta-powers`, `chat`, `hotkeys`, `Ability`, `Creature`, `Nutcase`, `interface` |

## Outstanding Work

| Area | Notes |
|---|---|
| Ability files — camera shake / tween calls | Move from `G.cameraShake` / `G.createTween` to direct `scene.cameras` / `scene.tweens` calls |
| `src/ui/interface.ts` | ~2700 lines, needs splitting into focused components |
| `@ts-expect-error` suppressions | 43 occurrences across 13 files — replace with real types where possible |
| `Game.msg` and `Game.UI` | Still `any`; type alongside `interface.ts` refactor |

## Migration References

- [Phaser 4 Documentation](https://phaser.io/phaser-4)
- [Phaser 3 → 4 Migration Guide](https://phaser.io/phaser-4/phaser-4-beta-2#breaking-changes)
- `src/script.ts` — jQuery replacement utilities
- `src/assets.ts` — Phaser 4 asset loading
- `TRIGGER_SYSTEM_DOCUMENTATION.md` — event trigger API
