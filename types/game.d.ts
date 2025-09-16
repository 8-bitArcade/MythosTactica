// Game-specific type definitions for MythosTactica

import { Creature } from '../src/models/Creature';
import { Player } from '../src/models/Player';
import { Ability } from '../src/models/Ability';
import { Effect } from '../src/models/Effect';
import { Trap } from '../src/models/Trap';
import { Drop } from '../src/models/Drop';
import { HexGrid } from '../src/utility/hexgrid';
import { Hex } from '../src/utility/hex';
import { UI } from '../src/ui/interface';
import { CreatureQueue } from '../src/models/Creature_queue';
import { Animations } from '../src/animations';
import { GameLog } from '../src/utility/gamelog';
import { SoundSys } from '../src/sound/soundsys';
import { InputManager } from '../src/input/InputManager';
import { PlayerManager } from '../src/services/PlayerManager';
import { CreatureManager } from '../src/services/CreatureManager';
import { TrapManager } from '../src/services/TrapManager';
import { EffectManager } from '../src/services/EffectManager';
import { GameManager } from '../src/services/GameManager';
import { CreatureType, Realm } from '../src/data/types';
import Phaser from 'phaser';

// Game state types
export type GameState = 'initialized' | 'loading' | 'loaded' | 'playing' | 'ended';

// Animation and tween types
export interface CompatibilityTween {
  onComplete: {
    add: (callback: Function, context?: any) => void;
  };
  start: () => CompatibilityTween;
  to: (props: any, duration: number, ease?: any) => CompatibilityTween;
  play: () => void;
  on: (event: string, callback: Function) => void;
  // Include all Phaser.Tweens.Tween properties to make it compatible
  [key: string]: any;
}

// Game configuration types
export interface GameConfig {
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

// Message system types
export interface GameMessages {
  abilities: {
    noTarget: string;
    noPlasma: string;
    noPsy: string;
    alreadyUsed: string;
    tooMuch: string;
    notEnough: string;
    notMoveable: string;
    passiveCycle: string;
    passiveUnavailable: string;
  };
  ui: {
    dash: {
      materializeOverload: string;
      selectUnit: string;
      wrongPlayer: string;
      lowPlasma: string;
      materializeUnit: (plasmaCost: string) => string;
      materializeUsed: string;
      heavyDev: string;
    };
  };
}

// Trigger system types
export interface TriggerPatterns {
  onStepIn: RegExp;
  onStepOut: RegExp;
  onReset: RegExp;
  onStartPhase: RegExp;
  onEndPhase: RegExp;
  onMovement: RegExp;
  onUnderAttack: RegExp;
  onDamage: RegExp;
  onHeal: RegExp;
  onAttack: RegExp;
  onCreatureMove: RegExp;
  onCreatureDeath: RegExp;
  onCreatureSummon: RegExp;
  onStepIn_other: RegExp;
  onStepOut_other: RegExp;
  onReset_other: RegExp;
  onStartPhase_other: RegExp;
  onEndPhase_other: RegExp;
  onMovement_other: RegExp;
  onAttack_other: RegExp;
  onDamage_other: RegExp;
  onHeal_other: RegExp;
  onUnderAttack_other: RegExp;
  onCreatureMove_other: RegExp;
  onCreatureDeath_other: RegExp;
  onCreatureSummon_other: RegExp;
  onEffectAttach: RegExp;
  onEffectAttach_other: RegExp;
  onStartOfRound: RegExp;
  onQuery: RegExp;
  oncePerDamageChain: RegExp;
}

// Signal system types
export interface SignalChannel {
  add: (callback: Function, context?: any) => void;
  dispatch: (message: string, payload?: any) => void;
  remove: (callback: Function, context?: any) => void;
  removeAll: () => void;
}

export interface GameSignals {
  ui: SignalChannel;
  metaPowers: SignalChannel;
  creature: SignalChannel;
  hex: SignalChannel;
}

// Multiplayer types
export interface MatchInterface {
  userTurn?: number;
  [key: string]: any;
}

export interface GameplayInterface {
  moveTo: (data: { target: { x: number; y: number } }) => void;
  useAbility: (data: { target: any; id: number; args: any }) => void;
  [key: string]: any;
}

// Audio system types
export type AudioMode = 'muted' | 'effects' | 'music' | 'full';

export interface SoundConfig {
  musicVolume: number;
  effectsVolume: number;
  heartbeatVolume: number;
  announcerVolume: number;
  paths: string[];
}

// Input system types
export type InputMode = 'menu' | 'game' | 'disabled';

// Creature sprite types
export interface CreatureSprite {
  grp: Phaser.GameObjects.Group;
  sprite: Phaser.GameObjects.Sprite;
  legacyProjectileEmissionPoint: { x: number; y: number };
  setAlpha: (alpha: number, duration?: number) => void;
  showHealth: (show: boolean) => void;
  setHealthBounce: (bounce: boolean) => void;
  updateVisualState: () => void;
  setDir: (direction: number) => void;
  isDestroyed: () => boolean;
}

// Global window extensions
declare global {
  interface Window {
    AB: {
      currentGame: any;
      getLog: () => string;
      saveLog: () => void;
      restoreGame: (str: string) => void;
    };
    G: any;
    InputManager: InputManager;
  }
}

// Export main Game class interface
export interface GameInterface {
  // Core properties
  matchid: number | null;
  playersReady: boolean;
  preventSetup: boolean;
  gameState: GameState;
  pauseTime: number;
  unitDrops: number;
  minimumTurnBeforeFleeing: number;
  availableCreatures: CreatureType[];
  animationQueue: (any | number)[];
  checkTimeFrequency: number;
  configData: object;
  multiplayer: boolean;
  matchInitialized: boolean;
  realms: Realm[];
  availableMusic: any[];
  inputMethod: string;
  firstKill: boolean;
  freezedInput: boolean;
  turnThrottle: boolean;
  turn: number;
  timePool?: number;
  turnTimePool?: number;
  
  // Phaser and scene management
  Phaser: Phaser.Game;
  currentScene?: Phaser.Scene;
  
  // Game systems
  animations: Animations;
  queue: CreatureQueue;
  gamelog: GameLog;
  soundsys: SoundSys;
  inputManager: InputManager;
  playerManager: PlayerManager;
  creatureManager: CreatureManager;
  trapManager: TrapManager;
  effectManager: EffectManager;
  gameManager: GameManager;
  
  // UI and grid
  UI?: UI;
  grid?: HexGrid;
  
  // Game data
  effects: Effect[];
  abilities: Array<Partial<Ability>[]>;
  
  // Messages and triggers
  msg: GameMessages;
  triggers: TriggerPatterns;
  signals: GameSignals;
  
  // Multiplayer
  match: MatchInterface | object;
  gameplay?: GameplayInterface;
  session: any;
  client: any;
  connect: any;
  
  // Compatibility getters
  readonly traps: Trap[];
  readonly activePlayer: Player | undefined;
  readonly players: Player[];
  readonly activeCreature: Creature | undefined;
  readonly creatures: Creature[];
  
  // Methods
  cameraShake: (intensity: number, duration: number, force?: boolean, direction?: any, internal?: boolean) => void;
  createTween: (target: any, properties: any, duration: number, easing?: any, autoStart?: boolean) => CompatibilityTween | null;
  createSound: (key: string) => { play: () => any };
  phaserUpdate: () => void;
  phaserRender: () => void;
  setup: (playerMode: number) => void;
  loadUnitData: () => any[];
  syncAbilities: () => void;
  reinitializeCreatureAbilities: () => void;
  setupSignalChannels: (channels: string[]) => GameSignals;
  
  // Trigger methods
  onCreatureSummon: (creature: Creature) => void;
  onCreatureDeath: (creature: Creature) => void;
  onStartPhase: (creature: Creature) => void;
  onEndPhase: (creature: Creature) => void;
  onReset: (creature: Creature) => void;
  onEffectAttach: (creature: Creature, effect: Effect) => void;
  onUnderAttack: (creature: Creature, damage: any) => void;
  onAttack: (creature: Creature, damage: any) => void;
  retrieveCreatureStats: (type: CreatureType) => any;
}