// Service layer type definitions

import { Creature } from '../src/models/Creature';
import { Player, PlayerID } from '../src/models/Player';
import { Trap } from '../src/models/Trap';
import { Drop } from '../src/models/Drop';
import { Effect } from '../src/models/Effect';
import { Ability } from '../src/models/Ability';
import { CreatureType, Unit } from '../src/data/types';
import { UI } from '../src/ui/interface';
import { HexGrid } from '../src/utility/hexgrid';
import { Point } from '../src/utility/pointfacade';

// Player Manager interface
export interface PlayerManagerInterface {
  game: any;
  abilities: Array<Partial<Ability>[]>;
  traps: Trap[];
  drops: Drop[];
  effects: Effect[];
  activeCreature: Creature | undefined;
  players: Player[];
  creatures: Creature[];
  UI: UI;
  grid: HexGrid;
  playerMode: number;
  
  // State management
  gameState: string;
  freezedInput: boolean;
  turnThrottle: boolean;
  turn: number;
  timePool?: number;
  turnTimePool?: number;
  
  // Timing
  startMatchTime: Date;
  timeInterval: any;
  checkTimeFrequency: number;
  
  // Methods
  setup: (playerMode: number) => void;
  initPlayers: (playerMode: number) => void;
  initUI: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  checkTime: () => void;
  resizeCombatFrame: () => void;
  skipTurn: () => void;
  endGame: () => void;
  
  // Computed properties
  readonly activePlayer: Player | undefined;
}

// Creature Manager interface
export interface CreatureManagerInterface {
  creatures: Creature[];
  creatureData: any[];
  game: any;
  UI: UI;
  
  // Methods
  findCreature: (options: any) => Creature[];
  retrieveCreatureStats: (type: CreatureType) => any;
  loadUnitData: (data: Unit[]) => void;
  handleTrigger: (triggerName: string, creature: any) => void;
  triggerAbility: (trigger: string, arg: any, retValue?: any) => any;
}

// Trap Manager interface
export interface TrapManagerInterface {
  traps: Trap[];
  game: any;
  
  // Methods
  createTrap: (data: any) => Trap;
  removeTrap: (trap: Trap) => void;
  activateTraps: (trigger: string, creature: Creature) => void;
  onReset: (creature: Creature) => void;
}

// Effect Manager interface
export interface EffectManagerInterface {
  effects: Effect[];
  game: any;
  
  // Methods
  createEffect: (data: any) => Effect;
  removeEffect: (effect: Effect) => void;
  triggerEffect: (trigger: string, args: any[]) => void;
  triggerDeleteEffect: (trigger: string, target: string | Creature) => void;
  updateEffects: () => void;
}

// Game Manager interface
export interface GameManagerInterface {
  game: any;
  UI: UI;
  abilityUpgrades: number;
  
  // Game flow methods
  loadGame: (config: any, multiplayer?: boolean) => void;
  nextCreature: () => void;
  skipTurn: (options?: any) => void;
  delayCreature: () => void;
  endGame: () => void;
  resetGame: () => void;
  
  // Event handlers
  onBlur: () => void;
  onFocus: () => void;
  onStartPhase: (creature: Creature) => void;
  onEndPhase: (creature: Creature) => void;
  onCreatureMove: () => void;
  
  // Utility methods
  log: (message: string) => void;
  clearOncePerDamageChain: () => void;
  updateQueueDisplay: () => void;
  resizeCombatFrame: () => void;
  matchInit: () => void;
  matchJoin: () => void;
  getImage: (url: string) => void;
}

// Input Manager interface
export interface InputManagerInterface {
  game: any;
  scene?: any; // Phaser scene
  inputMode: 'menu' | 'game' | 'disabled';
  
  // Methods
  initialize: (scene: any) => void;
  setInputMode: (mode: 'menu' | 'game' | 'disabled') => void;
  handleHexClick: (x: number, y: number) => void;
  handleKeyboardInput: (key: string) => void;
  enableInput: () => void;
  disableInput: () => void;
  onGameStateChange: (state: string) => void;
}

// Service factory types
export interface ServiceFactory {
  createPlayerManager: (game: any) => PlayerManagerInterface;
  createCreatureManager: (game: any) => CreatureManagerInterface;
  createTrapManager: (game: any) => TrapManagerInterface;
  createEffectManager: (game: any) => EffectManagerInterface;
  createGameManager: (game: any) => GameManagerInterface;
  createInputManager: (game: any) => InputManagerInterface;
}

// Service configuration
export interface ServiceConfig {
  enableLogging: boolean;
  enablePerformanceMonitoring: boolean;
  enableDebugMode: boolean;
  maxCreatures: number;
  maxEffects: number;
  maxTraps: number;
}

// Service events
export interface ServiceEvent {
  type: string;
  service: string;
  data?: any;
  timestamp: number;
}

export interface ServiceEventHandler {
  (event: ServiceEvent): void;
}

// Service registry
export interface ServiceRegistry {
  playerManager: PlayerManagerInterface;
  creatureManager: CreatureManagerInterface;
  trapManager: TrapManagerInterface;
  effectManager: EffectManagerInterface;
  gameManager: GameManagerInterface;
  inputManager: InputManagerInterface;
  
  // Registry methods
  register: (name: string, service: any) => void;
  unregister: (name: string) => void;
  get: <T>(name: string) => T;
  has: (name: string) => boolean;
  clear: () => void;
}

// Service lifecycle
export interface ServiceLifecycle {
  initialize: () => Promise<void>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  destroy: () => Promise<void>;
  getStatus: () => 'initialized' | 'starting' | 'running' | 'stopping' | 'stopped' | 'destroyed';
}

// Service dependencies
export interface ServiceDependencies {
  [serviceName: string]: string[];
}

// Service health check
export interface ServiceHealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  message?: string;
  timestamp: number;
}

// Service metrics
export interface ServiceMetrics {
  name: string;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  requestCount: number;
  errorCount: number;
  lastError?: Error;
}