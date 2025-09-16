// Type definitions for script.ts and related functionality

// Game configuration types
export interface GameConfigurationForm {
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

// Registration form data
export interface RegistrationData {
  username: string;
  email: string;
  password: string;
  passwordmatch: string;
}

// Login form data
export interface LoginData {
  email: string;
  password: string;
}

// Hotkey configuration
export interface HotkeyConfig {
  keyDownTest?: (event: KeyboardEvent) => boolean;
  keyDownAction?: (event: KeyboardEvent) => void;
  keyUpTest?: (event: KeyboardEvent) => boolean;
  keyUpAction?: (event: KeyboardEvent) => void;
}

export interface HotkeyMap {
  [keyCode: string]: HotkeyConfig;
}

// DOM utility function types
export interface DOMEventHandler {
  (event: Event): void;
}

export interface FormValidationRule {
  (value: string): boolean | string;
}

export interface FormValidationRules {
  [fieldName: string]: FormValidationRule;
}

export interface FormValidationErrors {
  [fieldName: string]: string;
}

// Animation configuration
export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  callback?: () => void;
}

// File reading utilities
export interface FileReadResult {
  content: string;
  filename: string;
  size: number;
}

// Audio system integration
export interface AudioSystemConfig {
  musicVolume: number;
  effectsVolume: number;
  heartbeatVolume: number;
  announcerVolume: number;
  paths: string[];
}

// Pre-match audio player
export interface PreMatchAudioConfig {
  volume: number;
  autoplay: boolean;
  loop: boolean;
}

// Button slide animation
export interface ButtonSlideConfig {
  duration: number;
  easing: string;
  direction: 'left' | 'right' | 'up' | 'down';
}

// Global window extensions for script functionality
declare global {
  interface Window {
    // Game debugging and development tools
    AB: {
      currentGame: any;
      getLog: () => string;
      saveLog: () => void;
      restoreGame: (str: string) => void;
    };
    
    // Global game instance
    G: any;
    
    // Input manager for debugging
    InputManager: any;
    
    // Fullscreen API compatibility
    webkitRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  }
  
  interface Document {
    webkitExitFullscreen?: () => Promise<void>;
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
    
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  }
  
  interface HTMLElement {
    webkitRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  }
}

// Module augmentations for external libraries
declare module 'underscore' {
  export function filter<T>(
    list: T[], 
    predicate: (value: T, index: number, list: T[]) => boolean
  ): T[];
}

// CSS transition and animation helpers
export interface CSSTransitionConfig {
  property: string;
  duration: number;
  timingFunction: string;
  delay?: number;
}

export interface CSSAnimationKeyframe {
  [property: string]: string | number;
}

export interface CSSAnimationConfig {
  keyframes: CSSAnimationKeyframe[];
  duration: number;
  timingFunction?: string;
  delay?: number;
  iterationCount?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

// Form handling utilities
export interface FormFieldConfig {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'checkbox' | 'radio' | 'select';
  required?: boolean;
  validation?: FormValidationRule;
  defaultValue?: string | number | boolean;
}

export interface FormConfig {
  fields: FormFieldConfig[];
  submitHandler: (data: { [key: string]: any }) => void;
  validationRules?: FormValidationRules;
}

// Event delegation types
export interface DelegatedEventConfig {
  container: HTMLElement;
  selector: string;
  eventType: string;
  handler: EventListener;
}

// Scroll and viewport utilities
export interface ScrollConfig {
  top?: number;
  left?: number;
  behavior?: 'auto' | 'smooth';
}

export interface ViewportInfo {
  width: number;
  height: number;
  scrollTop: number;
  scrollLeft: number;
}

// Touch and gesture handling
export interface TouchEventConfig {
  element: HTMLElement;
  touchStart?: (event: TouchEvent) => void;
  touchMove?: (event: TouchEvent) => void;
  touchEnd?: (event: TouchEvent) => void;
  touchCancel?: (event: TouchEvent) => void;
}

// Responsive design utilities
export interface BreakpointConfig {
  name: string;
  minWidth: number;
  maxWidth?: number;
}

export interface ResponsiveConfig {
  breakpoints: BreakpointConfig[];
  defaultBreakpoint: string;
}

// Performance monitoring
export interface PerformanceMetrics {
  domContentLoaded: number;
  windowLoaded: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
}

// Error handling and logging
export interface ErrorLogEntry {
  timestamp: number;
  message: string;
  stack?: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  userAgent?: string;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
}