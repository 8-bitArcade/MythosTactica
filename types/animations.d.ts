// Animation system type definitions

import { Creature } from '../src/models/Creature';
import { Hex } from '../src/utility/hex';

// Animation configuration types
export interface AnimationConfig {
  duration: number;
  ease: string;
  onComplete?: () => void;
  onUpdate?: (tween: Phaser.Tweens.Tween, target: any) => void;
}

export interface MovementAnimConfig extends AnimationConfig {
  callback?: () => void;
  callbackStepIn?: () => void;
  animation?: 'walk' | 'fly' | 'teleport';
  ignoreMovementPoint?: boolean;
  ignorePath?: boolean;
  customMovementPoint?: number;
  overrideSpeed?: number;
  turnAroundOnComplete?: boolean;
}

// Animation queue types
export interface AnimationQueueItem {
  id: number;
  type: 'movement' | 'ability' | 'effect' | 'damage';
  target: Creature | Hex | Phaser.GameObjects.GameObject;
  config: AnimationConfig;
  priority: number;
  delay?: number;
}

// Tween animation types
export interface TweenAnimationConfig {
  target: Phaser.GameObjects.GameObject | object;
  properties: Record<string, any>;
  duration: number;
  ease?: string;
  delay?: number;
  repeat?: number;
  yoyo?: boolean;
  onStart?: () => void;
  onUpdate?: (tween: Phaser.Tweens.Tween, target: any) => void;
  onComplete?: () => void;
}

// Sprite animation types
export interface SpriteAnimationConfig {
  key: string;
  frames: number[] | string[];
  frameRate: number;
  repeat?: number;
  yoyo?: boolean;
  showOnStart?: boolean;
  hideOnComplete?: boolean;
}

// Particle effect animation types
export interface ParticleAnimationConfig {
  texture: string;
  x: number;
  y: number;
  scale?: { start: number; end: number };
  alpha?: { start: number; end: number };
  speed?: { min: number; max: number };
  lifespan?: number;
  quantity?: number;
}

// Camera animation types
export interface CameraAnimationConfig {
  x?: number;
  y?: number;
  zoom?: number;
  duration: number;
  ease?: string;
  onComplete?: () => void;
}

// UI animation types
export interface UIAnimationConfig {
  element: HTMLElement;
  properties: Record<string, string | number>;
  duration: number;
  easing?: string;
  delay?: number;
  onComplete?: () => void;
}

// Animation state management
export interface AnimationState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  totalTime: number;
  progress: number;
}

// Animation event types
export interface AnimationEvent {
  type: 'start' | 'update' | 'complete' | 'pause' | 'resume' | 'stop';
  animation: AnimationQueueItem;
  timestamp: number;
  data?: any;
}

export interface AnimationEventHandler {
  (event: AnimationEvent): void;
}

// Animation manager interface
export interface AnimationManagerInterface {
  queue: AnimationQueueItem[];
  isPlaying: boolean;
  
  // Queue management
  add: (animation: AnimationQueueItem) => void;
  remove: (id: number) => void;
  clear: () => void;
  
  // Playback control
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  
  // Event handling
  on: (event: string, handler: AnimationEventHandler) => void;
  off: (event: string, handler: AnimationEventHandler) => void;
  
  // State queries
  getState: () => AnimationState;
  isAnimating: () => boolean;
  getQueueLength: () => number;
}

// Easing function types
export type EasingFunction = (t: number) => number;

export interface EasingMap {
  [name: string]: EasingFunction;
}

// Animation timing types
export interface AnimationTiming {
  duration: number;
  delay: number;
  startTime: number;
  endTime: number;
}

// Animation interpolation types
export interface InterpolationConfig {
  from: number | { [key: string]: number };
  to: number | { [key: string]: number };
  progress: number;
  easing?: EasingFunction;
}

// Animation chain types
export interface AnimationChain {
  animations: AnimationQueueItem[];
  mode: 'sequence' | 'parallel';
  onComplete?: () => void;
}

// Animation group types
export interface AnimationGroup {
  id: string;
  animations: AnimationQueueItem[];
  priority: number;
  canInterrupt: boolean;
}

// Performance monitoring for animations
export interface AnimationPerformanceMetrics {
  frameRate: number;
  droppedFrames: number;
  averageFrameTime: number;
  totalAnimations: number;
  activeAnimations: number;
}