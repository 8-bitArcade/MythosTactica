// UI and interface type definitions

import { Button, ButtonStateEnum } from '../src/ui/button';
import { Chat } from '../src/ui/chat';
import { Fullscreen } from '../src/ui/fullscreen';
import { ProgressBar } from '../src/ui/progressbar';
import { MetaPowers } from '../src/ui/meta-powers';
import { Queue } from '../src/ui/queue';
import { QuickInfo } from '../src/ui/quickinfo';
import { Hotkeys } from '../src/ui/hotkeys';
import { Creature } from '../src/models/Creature';

// UI component interfaces
export interface UIConfiguration {
  isAcceptingInput: boolean;
}

export interface UIComponents {
  // Core UI elements
  display: HTMLElement | null;
  dash: HTMLElement | null;
  grid: any;
  activebox: HTMLElement | null;
  scoreboard: HTMLElement | null;
  brandlogo: HTMLElement | null;
  ui: HTMLElement | null;
  
  // UI component instances
  fullscreen: Fullscreen;
  chat: Chat;
  metaPowers?: MetaPowers;
  queue: any;
  quickInfo: any;
  hotkeys: Hotkeys;
  
  // Button collections
  buttons: Button[];
  abilitiesButtons: Button[];
  
  // Specific buttons
  btnToggleDash: Button;
  btnToggleScore: Button;
  btnFullscreen: Button;
  btnAudio: Button;
  btnSkipTurn: Button;
  btnDelay: Button;
  btnFlee: Button;
  btnExit: Button;
  materializeButton: Button;
  
  // Progress bars
  healthBar: ProgressBar;
  energyBar: ProgressBar;
  timeBar: ProgressBar;
  poolBar: ProgressBar;
}

export interface UIState {
  active: boolean;
  dashopen: boolean;
  materializeToggled: boolean;
  selectedCreature: string;
  selectedCreatureObj?: Creature;
  selectedPlayer: number;
  selectedAbility: number;
  clickedAbility: number;
  activeAbility: boolean;
  lastViewedCreature: string;
  viewedCreature: string;
  queryUnit: string;
  
  // Animation and timing
  queueAnimSpeed: number;
  dashAnimSpeed: number;
  glowInterval: any;
  animationUpgradeTimeOutID: any;
  
  // Utility
  ignoreNextConfirmUnload: boolean;
}

// Button configuration types
export interface ButtonConfig {
  $button: HTMLElement | null;
  hasShortcut?: boolean;
  click?: () => void;
  mouseover?: () => void;
  mouseleave?: () => void;
  overridefreeze?: boolean;
  state?: ButtonStateEnum;
  abilityId?: number;
  css?: {
    [state: string]: { [property: string]: string };
  };
}

export interface ButtonContext {
  isAcceptingInput: () => boolean;
}

// Progress bar configuration
export interface ProgressBarConfig {
  $bar: HTMLElement | null;
  color: string;
}

// Hotkey system types
export interface HotkeyAction {
  onkeydown?: (event: KeyboardEvent) => void;
  onkeyup?: (event: KeyboardEvent) => void;
}

export interface HotkeyMap {
  [keyCode: string]: HotkeyAction;
}

// UI event types
export type UIEventMessage = 
  | 'toggleDash'
  | 'toggleScore'
  | 'toggleMusicPlayer'
  | 'toggleMetaPowers'
  | 'closeInterfaceScreens';

export interface UIEventPayload {
  [key: string]: any;
}

// Creature display types
export type ClickMethod = 'emptyHex' | 'portrait' | 'grid';

// Audio mode types for UI
export type AudioModeUI = 'muted' | 'effects' | 'music' | 'full';

// UI method interfaces
export interface UIInterface {
  // Core UI methods
  showCreature: (creatureType: string, player?: number, clickMethod?: ClickMethod) => void;
  selectAbility: (abilityId: number) => void;
  selectNextAbility: () => number;
  selectPreviousAbility: () => void;
  
  // UI state management
  toggleDash: (force?: boolean) => void;
  toggleScoreboard: (force?: boolean) => void;
  toggleMusicPlayer: () => void;
  closeDash: () => void;
  closeScoreboard: () => void;
  closeMusicPlayer: () => void;
  
  // Display updates
  updateTimer: () => void;
  updateQueueDisplay: () => void;
  updateActivebox: () => void;
  updateFatigue: () => void;
  updateAbilityUpgrades: () => void;
  updateAudioIcon: (mode: AudioModeUI) => void;
  
  // Grid and creature management
  gridSelectNext: () => void;
  gridSelectPrevious: () => void;
  changePlayerTab: (playerIndex: number) => void;
  resizeDash: () => void;
  
  // Ability cost display
  showAbilityCosts: (abilityId: number) => void;
  hideAbilityCosts: () => void;
  
  // Event handling
  _handleUiEvent: (message: UIEventMessage, payload?: UIEventPayload) => void;
  
  // Window management
  confirmWindowUnload: () => void;
}