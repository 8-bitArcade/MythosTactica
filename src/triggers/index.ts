/**
 * Trigger system exports
 * New type-safe trigger system for MythosTactica abilities
 */

// Core types and interfaces
export * from './TriggerTypes';

// Base trigger classes
export * from './BaseTrigger';

// Trigger contexts
export * from './TriggerContexts';

// Trigger manager
export * from './TriggerManager';

// Specific trigger implementations
export * from './SpecificTriggers';

// Re-export commonly used items for convenience
export {
  TriggerType,
  TriggerTiming,
  TriggerScope,
  ITriggerContext,
  ITriggerRegistration
} from './TriggerTypes';

export {
  BaseTrigger,
  SimpleTrigger,
  CompoundTrigger,
  CustomCondition
} from './BaseTrigger';

export {
  TriggerManager,
  globalTriggerManager
} from './TriggerManager';

export {
  TriggerContextFactory,
  IDamageContext,
  ICreatureContext,
  IPhaseContext,
  ISpellContext,
  IQueryContext
} from './TriggerContexts';
