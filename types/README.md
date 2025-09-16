# TypeScript Type Definitions for MythosTactica

This directory contains comprehensive TypeScript type definitions for the MythosTactica game project. These definitions provide type safety, better IDE support, and improved developer experience.

## File Overview

### Core Type Definitions

- **`game.d.ts`** - Main game interface and core game system types
  - Game state management
  - Animation and tween compatibility
  - Message system types
  - Trigger system patterns
  - Signal channel interfaces
  - Multiplayer interfaces

- **`models.d.ts`** - Game entity and data structure types
  - Creature vitals, masteries, and stats
  - Player scoring and management
  - Effect, trap, and drop data structures
  - Animation and movement types
  - Damage calculation types
  - Queue and pathfinding types

- **`ui.d.ts`** - User interface component types
  - UI component interfaces
  - Button and progress bar configurations
  - Hotkey system types
  - Event handling types
  - Audio mode definitions

- **`abilities.d.ts`** - Ability system type definitions
  - Ability slots and triggers
  - Cost and requirement structures
  - Effect and damage types
  - Target validation options
  - Animation data interfaces

- **`services.d.ts`** - Service layer interfaces
  - Manager interfaces (Player, Creature, Trap, Effect, Game, Input)
  - Service lifecycle management
  - Event handling and metrics
  - Configuration and health checks

### Compatibility and External Types

- **`phaser-compatibility.d.ts`** - Phaser 2 to Phaser 3 compatibility
  - Legacy tween interfaces
  - Sprite and graphics compatibility
  - Easing mapping definitions
  - Audio and input compatibility

- **`external.d.ts`** - External library and browser API extensions
  - Enhanced Phaser 3 type definitions
  - Browser API extensions (Fullscreen, Audio, etc.)
  - Web Worker and Service Worker types
  - Canvas, WebGL, and performance API extensions

- **`global.d.ts`** - Global type definitions and module declarations
  - Window object extensions
  - Asset import declarations (images, audio, styles)
  - External library type definitions (underscore, node-emoji, Jest)
  - Global debugging interfaces

## Key Features

### 1. Comprehensive Game System Coverage
- All major game systems have proper type definitions
- Interfaces for creatures, players, abilities, effects, traps, and drops
- Complete UI component typing
- Service layer abstractions

### 2. Phaser 2 to Phaser 3 Compatibility
- Compatibility layer for legacy Phaser 2 code
- Tween system compatibility wrappers
- Audio and graphics API bridging
- Input system compatibility

### 3. External Library Integration
- Proper typing for underscore.js utility functions
- Jest testing framework support
- Node.js module compatibility
- Browser API extensions and polyfills

### 4. Developer Experience Enhancements
- IntelliSense support for all game objects
- Type-safe method calls and property access
- Compile-time error detection
- Better refactoring support

## Usage Examples

### Game Object Access
```typescript
// Properly typed game instance
const game: GameInterface = new Game();
game.createTween(sprite, { x: 100 }, 1000); // Returns CompatibilityTween

// Type-safe creature access
const creature: Creature = game.creatures[0];
creature.abilities[0].use(); // Fully typed ability system
```

### UI Component Usage
```typescript
// Typed UI components
const ui: UIInterface = new UI(config, game, soundSys);
ui.showCreature('G2', 0, 'grid'); // Type-safe parameters

// Button configuration
const buttonConfig: ButtonConfig = {
  $button: document.querySelector('#myButton'),
  hasShortcut: true,
  click: () => console.log('Clicked!')
};
```

### Service Layer
```typescript
// Typed service managers
const playerManager: PlayerManagerInterface = game.playerManager;
const creatures: Creature[] = playerManager.creatures;

// Type-safe service methods
playerManager.setup(2); // Number of players
```

## Configuration

The TypeScript configuration in `tsconfig.json` has been updated to:
- Include the `types` directory
- Enable proper module resolution
- Allow JavaScript files for gradual migration
- Provide reasonable strictness settings for the migration phase

## Migration Benefits

1. **Type Safety** - Catch errors at compile time instead of runtime
2. **Better IDE Support** - IntelliSense, auto-completion, and refactoring
3. **Documentation** - Types serve as living documentation
4. **Maintainability** - Easier to understand and modify code
5. **Refactoring Safety** - Confident code changes with type checking

## Future Improvements

- Gradually increase TypeScript strictness settings
- Add more specific types for game data structures
- Implement generic types for reusable components
- Add JSDoc comments for better documentation
- Create utility types for common patterns

## Testing

All type definitions have been validated against the existing codebase:
- TypeScript compiler passes without errors (`npx tsc --noEmit`)
- Existing functionality remains unchanged
- No runtime behavior modifications
- Full backward compatibility maintained