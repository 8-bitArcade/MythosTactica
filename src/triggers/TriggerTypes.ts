/**
 * Trigger system for MythosTactica abilities
 * Replaces string-based triggers with type-safe managers and models
 */

// Base trigger types
export enum TriggerType {
  // Query triggers
  QUERY = 'query',
  
  // Phase triggers
  START_PHASE = 'startPhase',
  END_PHASE = 'endPhase',
  START_TURN = 'startTurn',
  END_TURN = 'endTurn',
  
  // Combat triggers
  DAMAGE = 'damage',
  UNDER_ATTACK = 'underAttack',
  ATTACK = 'attack',
  KILL = 'kill',
  DIE = 'die',
  
  // Creature triggers
  CREATURE_MOVE = 'creatureMove',
  OTHER_CREATURE_MOVE = 'otherCreatureMove',
  CREATURE_SUMMON = 'creatureSummon',
  OTHER_CREATURE_SUMMON = 'otherCreatureSummon',
  CREATURE_DIE = 'creatureDie',
  OTHER_CREATURE_DIE = 'otherCreatureDie',
  
  // Spell triggers
  SPELL_CAST = 'spellCast',
  OTHER_SPELL_CAST = 'otherSpellCast',
  
  // Utility triggers
  STEP_ON = 'stepOn',
  STEP_ON_SOMEONE = 'stepOnSomeone',
  TRAP_ACTIVATE = 'trapActivate',
  
  // Special triggers
  CUSTOM = 'custom'
}

// Trigger timing
export enum TriggerTiming {
  BEFORE = 'before',
  DURING = 'during', 
  AFTER = 'after'
}

// Trigger scope - who the trigger applies to
export enum TriggerScope {
  SELF = 'self',           // Only the ability owner
  OTHER = 'other',         // Other creatures/players
  ANY = 'any',            // Any creature/player
  ALLY = 'ally',          // Allied creatures
  ENEMY = 'enemy'         // Enemy creatures
}

// Trigger condition interface
export interface ITriggerCondition {
  evaluate(context: ITriggerContext): boolean;
}

// Base trigger context interface
export interface ITriggerContext {
  game: any;              // Game instance
  source?: any;           // Creature/entity that triggered the event
  target?: any;           // Target of the event (if applicable)
  ability?: any;          // Ability that owns this trigger
  data?: any;            // Additional event data
}

// Trigger registration interface
export interface ITriggerRegistration {
  type: TriggerType;
  timing?: TriggerTiming;
  scope?: TriggerScope;
  condition?: ITriggerCondition;
  handler: (context: ITriggerContext) => void | Promise<void>;
  priority?: number;      // Execution priority (higher = earlier)
}
