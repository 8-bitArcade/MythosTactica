// Model type definitions for game entities

import { CreatureType, Level, Realm, UnitName } from '../src/data/types';
import { PlayerID, PlayerColor } from '../src/models/Player';
import { AbilitySlot } from '../src/models/Ability';
import { Point } from '../src/utility/pointfacade';
import { Hex, Direction } from '../src/utility/hex';

// Creature-related types
export interface CreatureVitals {
  health: number;
  regrowth: number;
  endurance: number;
  energy: number;
  meditation: number;
  initiative: number;
  offense: number;
  defense: number;
  movement: number;
}

export interface CreatureMasteries {
  pierce: number;
  slash: number;
  crush: number;
  shock: number;
  burn: number;
  frost: number;
  poison: number;
  sonic: number;
  mental: number;
}

export type Movement = 'normal' | 'flying' | 'hover';

export interface CreatureStats extends CreatureVitals, CreatureMasteries {
  moveable: boolean;
  fatigueImmunity: boolean;
  reqEnergy: number;
}

export interface CreatureStatus {
  frozen: boolean;
  cryostasis: boolean;
  dizzy: boolean;
}

export interface TracePositionOptions {
  x?: number;
  y?: number;
  overlayClass?: string;
  displayClass?: string;
  drawOverCreatureTiles?: boolean;
}

export interface QueryMoveOptions {
  targeting?: boolean;
  noPath?: boolean;
  isAbility?: boolean;
  ownCreatureHexShade?: boolean;
  range?: Hex[];
  callback?: (hex: Hex, args: any) => void;
  args?: any;
}

// Player-related types
export type ScoreType =
  | 'firstKill'
  | 'kill'
  | 'combo'
  | 'humiliation'
  | 'annihilation'
  | 'deny'
  | 'timebonus'
  | 'nofleeing'
  | 'creaturebonus'
  | 'darkpriestbonus'
  | 'immortal'
  | 'pickupDrop'
  | 'upgrade';

export interface ScoreEvent {
  type: ScoreType;
  creature?: any; // Creature reference
  player?: PlayerID;
  kills?: number;
  ability?: AbilitySlot;
}

export type PlayerName = `Player${1 | 2 | 3 | 4}`;

export type TotalScore = Record<ScoreType, number> & { total: number };

// Effect-related types
export interface EffectData {
  id: number;
  name: string;
  owner: any; // Creature reference
  target: any; // Creature reference
  trigger: string;
  requireFn?: string;
  effectFn?: string;
  alterations?: any;
  turnLifetime?: number;
  deleteTrigger?: string;
  stackable?: boolean;
  noLog?: boolean;
}

// Trap-related types
export interface TrapData {
  id: number;
  x: number;
  y: number;
  type: string;
  owner: any; // Creature reference
  fullName: string;
  displayClasses: string;
  requirements?: any;
  effects?: any;
  activate?: (trigger: string, creature: any) => void;
}

// Drop-related types
export interface DropData {
  id: number;
  x: number;
  y: number;
  name: string;
  owner: any; // Creature reference
  pickup?: (creature: any) => void;
}

// Hex grid types
export interface HexData {
  x: number;
  y: number;
  pos: Point;
  creature?: any; // Creature reference
  trap?: any; // Trap reference
  drop?: any; // Drop reference
  overlayClasses: string;
  displayClasses: string;
  blocked: boolean;
  reachable: boolean;
}

// Animation types
export interface AnimationOptions {
  callback?: () => void;
  callbackStepIn?: () => void;
  animation?: 'walk' | 'fly' | 'teleport';
  ignoreMovementPoint?: boolean;
  ignorePath?: boolean;
  customMovementPoint?: number;
  overrideSpeed?: number;
  turnAroundOnComplete?: boolean;
}

// Damage types
export interface DamageData {
  pure?: number;
  pierce?: number;
  slash?: number;
  crush?: number;
  shock?: number;
  burn?: number;
  frost?: number;
  poison?: number;
  sonic?: number;
  mental?: number;
}

export interface DamageResult {
  kill: boolean;
  damageObj: any;
  damages: number;
  damageTypes: string[];
  noRetaliation: boolean;
}

// Queue types
export interface QueueData {
  creatures: any[]; // Creature references
  nextQueue: any[]; // Creature references
  delayedQueue: any[]; // Creature references
}

// Game log types
export interface LogEntry {
  action: string;
  target?: {
    type?: 'hex' | 'creature' | 'array';
    x?: number;
    y?: number;
    crea?: number;
    array?: Point[];
  };
  id?: number;
  args?: any;
  turn?: number;
  creature?: number;
}

// Utility types for pathfinding and movement
export interface PathfindingNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic cost to goal
  f: number; // Total cost
  parent?: PathfindingNode;
}

export interface MovementRange {
  hexes: Hex[];
  distance: number;
  size: number;
  id: number;
}

// Input system types
export interface InputEvent {
  type: 'click' | 'hover' | 'key';
  x?: number;
  y?: number;
  button?: number;
  key?: string;
  target?: HTMLElement;
}

// Audio system types
export interface AudioConfig {
  musicVolume: number;
  effectsVolume: number;
  heartbeatVolume: number;
  announcerVolume: number;
  paths: string[];
}

export interface SoundEffect {
  key: string;
  volume: number;
  loop: boolean;
  autoplay: boolean;
}

// Multiplayer types
export interface MultiplayerAction {
  type: 'move' | 'ability' | 'skip' | 'delay' | 'flee';
  playerId: PlayerID;
  creatureId?: number;
  target?: Point | number;
  abilityId?: AbilitySlot;
  args?: any;
}

export interface MatchData {
  id: string;
  players: PlayerID[];
  currentTurn: PlayerID;
  gameState: string;
  actions: MultiplayerAction[];
}

// Configuration types
export interface GameConfiguration {
  playerMode: number;
  combatLocation: string;
  creaLimitNbr: number;
  unitDrops: number;
  abilityUpgrades: number;
  plasma_amount: number;
  turnTimePool: number;
  timePool: number;
  background_image: string;
  fullscreenMode: boolean;
  activateAudio: boolean;
  musicVolume: number;
  effectsVolume: number;
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Event system types
export interface GameEvent {
  type: string;
  source: any;
  target?: any;
  data?: any;
  timestamp: number;
}

export interface EventHandler {
  (event: GameEvent): void;
}

export interface EventSubscription {
  type: string;
  handler: EventHandler;
  once?: boolean;
}

// Performance monitoring types
export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  updateTime: number;
  totalCreatures: number;
  activeEffects: number;
}

// Debug types
export interface DebugInfo {
  gameState: string;
  currentTurn: number;
  activeCreature?: number;
  queueLength: number;
  animationQueue: number;
  freezedInput: boolean;
  performance: PerformanceMetrics;
}