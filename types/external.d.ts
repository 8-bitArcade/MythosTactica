// External library and integration type definitions

// Phaser 3 extensions and compatibility
declare module 'phaser' {
  namespace GameObjects {
    interface Sprite {
      // Legacy Phaser 2 compatibility properties
      anchor?: { x: number; y: number };
      
      // Custom properties that might be added by the game
      creatureId?: number;
      hexX?: number;
      hexY?: number;
    }
    
    interface Group {
      // Legacy Phaser 2 compatibility methods
      create?: (x: number, y: number, key: string, frame?: string | number) => Sprite;
      createMultiple?: (quantity: number, key: string, frame?: string | number) => Sprite[];
    }
    
    interface Graphics {
      // Legacy drawing methods
      clear?: () => void;
      lineStyle?: (width: number, color: number, alpha?: number) => void;
      beginFill?: (color: number, alpha?: number) => void;
      endFill?: () => void;
      drawRect?: (x: number, y: number, width: number, height: number) => void;
      drawCircle?: (x: number, y: number, radius: number) => void;
      moveTo?: (x: number, y: number) => void;
      lineTo?: (x: number, y: number) => void;
    }
  }
  
  namespace Tweens {
    interface Tween {
      // Compatibility wrapper for Phaser 2 style callbacks
      onComplete?: {
        add: (callback: Function, context?: any) => void;
      };
    }
  }
  
  namespace Input {
    interface Pointer {
      // Additional properties that might be used
      button?: number;
    }
  }
}

// Node.js modules used in the browser context
declare module 'path' {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string, ext?: string): string;
  export function extname(path: string): string;
  export const sep: string;
}

// Webpack-specific modules
declare module 'webpack' {
  export interface Configuration {
    [key: string]: any;
  }
}

// Jest testing framework (if used)
declare module '@jest/globals' {
  export const jest: {
    fn: () => any;
    mock: (moduleName: string, factory?: () => any) => void;
    unmock: (moduleName: string) => void;
    clearAllMocks: () => void;
    resetAllMocks: () => void;
    restoreAllMocks: () => void;
    spyOn: (object: any, method: string) => any;
  };
  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => void) => void;
  export const test: (name: string, fn: () => void) => void;
  export const expect: (value: any) => any;
  export const beforeEach: (fn: () => void) => void;
  export const afterEach: (fn: () => void) => void;
  export const beforeAll: (fn: () => void) => void;
  export const afterAll: (fn: () => void) => void;
}

// Browser APIs that might not be fully typed
interface Navigator {
  // Gamepad API
  getGamepads?: () => (Gamepad | null)[];
  
  // Web Audio API extensions
  webkitAudioContext?: typeof AudioContext;
  mozAudioContext?: typeof AudioContext;
}

interface Window {
  // Webkit prefixed APIs
  webkitRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
  mozRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
  
  // Audio context
  webkitAudioContext?: typeof AudioContext;
  mozAudioContext?: typeof AudioContext;
  
  // Fullscreen API
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

interface Document {
  // Fullscreen API
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
  
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
}

interface HTMLElement {
  // Fullscreen API
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

// Custom events
interface CustomEventMap {
  'gameStateChange': CustomEvent<{ state: string }>;
  'creatureMove': CustomEvent<{ creature: any; hex: any }>;
  'abilityUsed': CustomEvent<{ creature: any; ability: any }>;
  'turnEnd': CustomEvent<{ player: any }>;
  'gameEnd': CustomEvent<{ winner: any }>;
}

declare global {
  interface WindowEventMap extends CustomEventMap {}
  interface DocumentEventMap extends CustomEventMap {}
  interface HTMLElementEventMap extends CustomEventMap {}
}

// Web Workers (if used)
interface Worker {
  postMessage(message: any, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null;
  onerror: ((this: Worker, ev: ErrorEvent) => any) | null;
}

// Service Worker (if used)
interface ServiceWorkerRegistration {
  installing: ServiceWorker | null;
  waiting: ServiceWorker | null;
  active: ServiceWorker | null;
  scope: string;
  update(): Promise<void>;
  unregister(): Promise<boolean>;
}

// IndexedDB (if used for save games)
interface IDBDatabase {
  name: string;
  version: number;
  objectStoreNames: DOMStringList;
  transaction(storeNames: string | string[], mode?: IDBTransactionMode): IDBTransaction;
  createObjectStore(name: string, options?: IDBObjectStoreParameters): IDBObjectStore;
  deleteObjectStore(name: string): void;
  close(): void;
}

// Local Storage extensions
interface Storage {
  // Typed getters/setters for game data
  getGameData?: (key: string) => any;
  setGameData?: (key: string, value: any) => void;
  removeGameData?: (key: string) => void;
  clearGameData?: () => void;
}

// Performance API extensions
interface Performance {
  // Memory usage (Chrome-specific)
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

// Gamepad API
interface Gamepad {
  id: string;
  index: number;
  connected: boolean;
  timestamp: number;
  mapping: GamepadMappingType;
  axes: readonly number[];
  buttons: readonly GamepadButton[];
}

interface GamepadButton {
  pressed: boolean;
  touched: boolean;
  value: number;
}

// Web Audio API extensions
interface AudioContext {
  // Safari compatibility
  webkitAudioContext?: typeof AudioContext;
}

interface AudioBuffer {
  // Additional properties that might be used
  duration: number;
  length: number;
  numberOfChannels: number;
  sampleRate: number;
}

// Canvas API extensions
interface CanvasRenderingContext2D {
  // Experimental or vendor-prefixed methods
  webkitImageSmoothingEnabled?: boolean;
  mozImageSmoothingEnabled?: boolean;
  msImageSmoothingEnabled?: boolean;
}

// File API extensions
interface File {
  // Additional properties
  webkitRelativePath?: string;
}

// Drag and Drop API
interface DataTransfer {
  // Additional properties for file handling
  items?: DataTransferItemList;
}

// Clipboard API
interface Clipboard {
  writeText(data: string): Promise<void>;
  readText(): Promise<string>;
}

// Intersection Observer API
interface IntersectionObserver {
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void;
}

// Resize Observer API
interface ResizeObserver {
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void;
}

// Mutation Observer API
interface MutationObserver {
  observe(target: Node, options: MutationObserverInit): void;
  disconnect(): void;
  takeRecords(): MutationRecord[];
}

// CSS Custom Properties
interface CSSStyleDeclaration {
  // CSS custom properties
  setProperty(property: string, value: string | null, priority?: string): void;
  getPropertyValue(property: string): string;
  removeProperty(property: string): string;
}

// URL API
interface URL {
  createObjectURL(object: File | Blob | MediaSource): string;
  revokeObjectURL(url: string): void;
}

// Fetch API extensions
interface RequestInit {
  // Additional options that might be used
  keepalive?: boolean;
  signal?: AbortSignal;
}

// WebGL extensions
interface WebGLRenderingContext {
  // Common WebGL extensions
  getExtension(name: 'OES_texture_float'): any;
  getExtension(name: 'OES_texture_half_float'): any;
  getExtension(name: 'WEBGL_lose_context'): any;
  getExtension(name: 'WEBGL_debug_renderer_info'): any;
  getExtension(name: string): any;
}