# MythosTactica Trigger System Documentation

## Overview

The MythosTactica game uses a comprehensive trigger system to coordinate events across multiple managers. This document maps out all trigger-related components and their relationships across the different managers in the codebase.

## Manager Architecture

The trigger system is distributed across four main managers:
- **PlayerManager** (`playerManager.abilities`) - Ability-based triggers
- **CreatureManager** (`creatureManager.triggerAbilities`) - Creature lifecycle triggers  
- **GameManager** (`gameManager.triggers`) - Central trigger coordination
- **TrapManager** (`trapManager`) - Location-based triggers

## Trigger Types and Categories

### 1. Query Triggers (Active Abilities)
**Type**: `onQuery`
**Purpose**: Player-activated abilities that require target selection
**Managers**: PlayerManager
**Examples**:
- Slicing Pounce (Scavenger)
- Escort Service (Scavenger) 
- Deadly Toxin (Scavenger)
- Fireball (Dark-Priest)
- Meteor (Dark-Priest)
- Charge (Knightmare)

### 2. Phase Triggers (Turn-Based Events)
**Types**: `onStartPhase`, `onEndPhase`
**Purpose**: Automatic effects that occur at phase transitions
**Managers**: PlayerManager, CreatureManager, GameManager
**Examples**:
- `onStartPhase`: Regeneration effects, poison damage, turn-based buffs
- `onEndPhase`: Cleanup effects, end-of-turn abilities

### 3. Combat Triggers (Damage Events)
**Types**: `onDamage`, `onAttack`, `onUnderAttack`
**Purpose**: Reactive abilities triggered by combat actions
**Managers**: PlayerManager, GameManager
**Examples**:
- `onDamage`: Retaliation effects, damage modifiers
- `onAttack`: Attack enhancement abilities
- `onUnderAttack`: Defensive reactions, counter-attacks

### 4. Movement Triggers (Position Changes)
**Types**: `onStepIn`, `onStepOut`, `onCreatureMove`
**Purpose**: Location-based and movement-based effects
**Managers**: TrapManager, GameManager
**Examples**:
- `onStepIn`: Trap activation, area effects
- `onStepOut`: Exit penalties, movement restrictions
- `onCreatureMove`: Movement-based abilities

### 5. Lifecycle Triggers (Creature Events)
**Types**: `onCreatureDeath`, `onCreatureSummon`, `onOtherCreatureDeath`, `onOtherCreatureSummon`
**Purpose**: Creature lifecycle event handling
**Managers**: CreatureManager, GameManager
**Examples**:
- `onCreatureDeath`: Death effects, last words abilities
- `onCreatureSummon`: Summoning effects, welcome abilities

### 6. Effect Triggers (Status Management)
**Types**: `onEffectAttach`, `onReset`
**Purpose**: Status effect and game state management
**Managers**: GameManager
**Examples**:
- `onEffectAttach`: Effect application reactions
- `onReset`: Game state reset handling

## Manager-Specific Implementations

### PlayerManager.abilities

**Location**: `src/abilities/*.ts`
**Structure**: Array of ability objects with trigger properties
**Pattern**:
```javascript
G.playerManager.abilities[creatureId] = [
    {
        trigger: 'onQuery|onStartPhase|onDamage|etc',
        require: function() { /* validation logic */ },
        query: function() { /* target selection */ },
        activate: function() { /* ability execution */ }
    }
];
```

**Key Features**:
- Trigger validation through `require()` function
- Target selection via `query()` function for onQuery triggers
- Ability execution through `activate()` function
- Support for upgraded abilities with conditional logic
- Integration with damage system and effects

**Common Triggers**:
- `onQuery`: Most common for active abilities (50+ examples found)
- `onStartPhase`: Turn-based abilities and effects
- `onDamage`: Reactive combat abilities
- `onUnderAttack`: Defensive abilities
- Empty string `''`: Passive abilities (movement types, etc.)

### CreatureManager.triggerAbilities

**Location**: `src/creature.ts`
**Integration Pattern**:
```javascript
// Creature lifecycle events call game manager
game.onCreatureDeath(this);
game.onStartPhase(this);
game.onCreatureMove(this);
```

**Responsibilities**:
- Creature spawning and death event coordination
- Turn phase management for creatures
- Movement event broadcasting
- Integration with central game trigger system

### GameManager.triggers

**Location**: `src/game.ts`
**Central Coordination**: Acts as the trigger dispatch center
**Regex Pattern System**:
```javascript
// Trigger pattern matching for self and other-creature events
const triggerRegex = {
    self: /^on[A-Z]/,
    other: /^onOther[A-Z]/
};
```

**Key Methods**:
- `onCreatureDeath()`: Broadcasts creature death events
- `onStartPhase()`: Manages turn phase transitions
- `onCreatureMove()`: Handles movement event coordination
- `triggerAbilities()`: Central trigger dispatch method

**Trigger Flow**:
1. Game events occur (damage, movement, death, etc.)
2. GameManager receives event notifications
3. GameManager dispatches to relevant manager trigger systems
4. Individual managers process their specific trigger types

### TrapManager

**Location**: `src/utility/trap.ts`
**Integration**: Called from ability systems
**Pattern**:
```javascript
// Trap activation from ability callbacks
G.trapManager.onStepIn(hex, creature);
G.trapManager.onStepOut(hex, creature);
```

**Trigger Types**:
- `onStepIn`: Trap activation when creature enters hex
- `onStepOut`: Trap deactivation when creature leaves hex
- Location-based effect management

## Trigger Execution Flow

### 1. Event Initiation
Game events (combat, movement, phase changes) are initiated through user actions or game logic.

### 2. Manager Notification
The GameManager receives notifications of these events through its central methods:
- `game.onCreatureDeath(creature)`
- `game.onStartPhase(creature)`
- `game.onCreatureMove(creature)`
- `game.onDamage(attacker, target)`

### 3. Trigger Dispatch
GameManager uses regex patterns to identify relevant triggers and dispatches to appropriate managers:
- PlayerManager abilities are checked for matching triggers
- CreatureManager lifecycle events are processed
- TrapManager location events are evaluated

### 4. Ability Execution
Individual abilities execute their trigger logic:
- `require()` validates trigger conditions
- `query()` handles target selection (for onQuery triggers)
- `activate()` executes the ability effect

### 5. Effect Application
Results are applied to game state:
- Damage is dealt through the Damage system
- Effects are applied through the Effect system
- Game state is updated and logged

## Trigger Priority and Execution Order

### Priority System
1. **Immediate Triggers**: `onQuery` (player-initiated)
2. **Phase Triggers**: `onStartPhase`, `onEndPhase` (turn-based)
3. **Reactive Triggers**: `onDamage`, `onUnderAttack` (combat responses)
4. **Movement Triggers**: `onStepIn`, `onStepOut`, `onCreatureMove` (position-based)
5. **Lifecycle Triggers**: `onCreatureDeath`, `onCreatureSummon` (creature events)

### Execution Order
- Self-targeting triggers execute before other-targeting triggers
- Phase triggers are processed in creature turn order
- Combat triggers are processed in damage resolution order
- Movement triggers are processed immediately upon position change

## Cross-Manager Dependencies

### PlayerManager → GameManager
- Abilities call `game.onCreatureDeath()`, `game.onStartPhase()` for coordination
- Game logging through `G.gameManager.log()`
- Effect application through game systems

### CreatureManager → GameManager
- Lifecycle events broadcast to game for trigger coordination
- Turn management through game phase system
- Movement coordination through game grid system

### TrapManager → PlayerManager
- Trap effects triggered by movement abilities
- Integration with ability callback systems
- Coordinate with movement-based abilities

### GameManager → All Managers
- Central trigger dispatch and coordination
- Regex-based trigger pattern matching
- Cross-manager event broadcasting

## Example Trigger Flows

### Combat Damage Flow
1. Creature attacks → `onAttack` triggers fire
2. Damage calculated → `onDamage` triggers fire  
3. Target takes damage → `onUnderAttack` triggers fire
4. If creature dies → `onCreatureDeath` triggers fire

### Turn Phase Flow
1. Turn begins → `game.onStartPhase(creature)`
2. GameManager dispatches → PlayerManager abilities checked
3. `onStartPhase` abilities execute → Effects applied
4. Turn ends → `onEndPhase` triggers fire

### Movement Flow
1. Creature moves → `game.onCreatureMove(creature)`
2. TrapManager checks → `onStepOut` from old position
3. TrapManager checks → `onStepIn` to new position
4. Movement abilities → `onCreatureMove` triggers fire

## Integration Points

### Ability Definition Structure
```javascript
{
    trigger: 'triggerType',        // Trigger condition
    require: function() {},        // Validation logic  
    query: function() {},          // Target selection (onQuery only)
    activate: function() {},       // Effect execution
    _targetTeam: Team.Enemy,       // Target specification
    damages: {},                   // Damage specification
    // Additional ability-specific properties
}
```

### Effect System Integration
```javascript
const effect = new Effect(
    'Effect Name',     // Effect name
    ownerCreature,     // Effect owner
    targetCreature,    // Effect target  
    'onStartPhase',    // Effect trigger
    { /* config */ },  // Effect configuration
    G                  // Game reference
);
```

### Damage System Integration
```javascript
const damage = new Damage(
    attackerCreature,  // Damage source
    damageTypes,       // Damage type object
    area,              // Area of effect
    effects,           // Additional effects
    G                  // Game reference
);
```

## Conclusion

The MythosTactica trigger system provides a flexible and coordinated approach to game event handling. The distributed architecture allows each manager to handle its specific domain while maintaining coordination through the central GameManager. This design enables complex ability interactions while keeping the codebase organized and maintainable.

The trigger system supports the game's tactical combat mechanics by providing precise control over when and how abilities execute, ensuring proper sequencing of game events, and enabling rich interactions between different game systems.
