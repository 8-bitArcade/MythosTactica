// Ability system type definitions

import { Creature, CreatureMasteries } from '../src/models/Creature';
import { Hex, Direction } from '../src/utility/hex';
import { Team } from '../src/utility/team';
import { Damage } from '../src/damage';
import { ScoreEvent } from '../src/models/Player';

// Ability slot type
export type AbilitySlot = 0 | 1 | 2 | 3;

// Trigger types for abilities
export type Trigger =
  | 'onQuery'
  | 'onStartPhase'
  | 'onDamage'
  | 'onEndPhase'
  | 'onStepIn'
  | 'onStepOut'
  | 'onReset'
  | 'onCreatureMove'
  | 'onCreatureDeath'
  | 'onCreatureSummon'
  | 'onAttack'
  | 'onUnderAttack'
  | 'onHeal'
  | 'onEffectAttach'
  | 'onStartOfRound'
  | 'oncePerDamageChain'
  | 'onCreatureMove onOtherCreatureMove'
  | 'onCreatureSummon onDamage onHeal'
  | 'onStartPhase onEndPhase'
  | 'onDamage onStartPhase'
  | 'onStartPhase onDamage'
  | 'onUnderAttack onAttack'
  | 'onUnderAttack';

// Cost and requirement types
export interface AbilityCost {
  special?: string;
  plasma?: string | number;
  energy?: number;
  health?: number;
  endurance?: number;
}

export interface AbilityRequirement {
  plasma?: number;
  energy?: number;
  endurance?: number;
  remainingMovement?: number;
  stats?: {
    health?: number;
    regrowth?: number;
    endurance?: number;
    energy?: number;
    meditation?: number;
    initiative?: number;
    offense?: number;
    defense?: number;
    movement?: number;
    pierce?: number;
    slash?: number;
    crush?: number;
    shock?: number;
    burn?: number;
    frost?: number;
    poison?: number;
    sonic?: number;
    mental?: number;
  };
}

// Ability effect types
export interface AbilityEffect {
  special?: string;
  offense?: number;
  defense?: number;
  regrowth?: number;
  frost?: number;
  [key: string]: any;
}

// Damage types for abilities
export interface AbilityDamages extends Partial<CreatureMasteries> {
  pure?: number;
}

// Target information
export interface AbilityTarget {
  hexesHit: number;
  target: Creature;
}

// Animation data for abilities
export interface AbilityAnimationData {
  duration: number;
  delay: number;
  activateAnimation: boolean;
}

// Range configuration for abilities
export interface AbilityRange {
  minimum?: number;
  regular: number;
  upgraded: number;
}

// Direction query options
export interface DirectionQueryOptions {
  team?: Team;
  id?: number;
  flipped?: boolean;
  x?: number;
  y?: number;
  directions?: number[];
  includeCreature?: boolean;
  stopOnCreature?: boolean;
  distance?: number;
  minDistance?: number;
  sourceCreature?: Creature;
  optTest?: (creature: Creature) => boolean;
}

// Target validation options
export interface TargetValidationOptions {
  team?: Team;
  optTest?: (creature: Creature) => boolean;
}

// Ability interface for dynamic properties
export interface AbilityInterface {
  // Core properties
  creature: Creature;
  id: AbilitySlot;
  used: boolean;
  priority: number;
  timesUsed: number;
  timesUsedThisTurn: number;
  token: number;
  upgraded: boolean;
  title: string;
  
  // Configuration properties
  requirements?: AbilityRequirement;
  costs?: AbilityCost;
  trigger?: Trigger;
  triggerFunc?: () => Trigger;
  affectedByMatSickness?: boolean;
  damages?: AbilityDamages;
  effects?: AbilityEffect[];
  message?: string;
  range?: AbilityRange;
  
  // Dynamic properties that may be added by specific abilities
  [key: string]: any;
  
  // Methods
  require?: (req?: Damage | Hex) => boolean;
  query?: () => unknown;
  activate?: (target?: any, hex?: any, path?: Hex[]) => unknown;
  getAnimationData?: (...args: unknown[]) => AbilityAnimationData;
  movementType?: () => 'flying';
  
  // Core ability methods
  hasUpgrade: () => boolean;
  setUpgraded: () => void;
  isUpgradedPerUse: () => boolean;
  usesLeftBeforeUpgrade: () => number;
  isUpgraded: () => boolean;
  getTrigger: () => Trigger;
  reset: () => void;
  use: () => any;
  end: (disableLogMsg?: boolean, deferredEnding?: boolean) => void;
  setUsed: (val: boolean) => void;
  postActivate: () => void;
  animation: (...args: any[]) => false | void;
  animation2: (o: object) => void;
  getTargets: (hexes: Hex[]) => AbilityTarget[];
  getFormattedCosts: () => string | false;
  getFormattedDamages: (obj?: Record<string, any>) => string | false;
  getFormattedEffects: () => false | string;
  areaDamage: (attacker: Creature, damages: any, effects: any, targets: AbilityTarget[], ignoreRetaliation: boolean) => void;
  atLeastOneTarget: (hexes: Hex[], options: TargetValidationOptions) => boolean;
  testRequirements: () => boolean;
  applyCost: () => void;
  testDirections: (options: DirectionQueryOptions) => number[];
  testDirection: (options: DirectionQueryOptions) => boolean;
  isTargetingBackwards: (direction: Direction) => boolean;
  handleMetaPowerEvent: (message: string, payload: boolean) => void;
  resetTimesUsed: () => void;
}

// Ability generator function type
export type AbilityGenerator = (game: any) => AbilityInterface[];

// Ability data from unit files
export interface AbilityInfo {
  title?: string;
  description?: string;
  info?: string;
  upgrade?: string;
  [key: string]: any;
}