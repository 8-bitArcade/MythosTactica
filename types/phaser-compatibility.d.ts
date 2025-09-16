// Phaser 2 to Phaser 3 compatibility type definitions

import Phaser from 'phaser';

// Extend Phaser 3 types to include compatibility methods
declare module 'phaser' {
  namespace GameObjects {
    interface Sprite {
      // Phaser 2 compatibility properties
      anchor?: { x: number; y: number };
      
      // Phaser 2 compatibility methods that might be added by compatibility layer
      loadTexture?: (key: string, frame?: string | number) => void;
    }
    
    interface Group {
      // Phaser 2 compatibility methods
      create?: (x: number, y: number, key: string, frame?: string | number) => Sprite;
      createMultiple?: (quantity: number, key: string, frame?: string | number) => Sprite[];
    }
  }
  
  namespace Cameras.Scene2D {
    interface Camera {
      // Phaser 2 compatibility methods
      shake?: (duration: number, intensity: number) => void;
    }
  }
  
  namespace Tweens {
    interface Tween {
      // Phaser 2 compatibility wrapper properties
      onComplete?: {
        add: (callback: Function, context?: any) => void;
      };
      
      // Phaser 2 compatibility methods
      start?: () => Tween;
      to?: (props: any, duration: number, ease?: any) => Tween;
    }
  }
}

// Legacy Phaser 2 style tween interface for compatibility
export interface LegacyTween {
  onComplete: {
    add: (callback: Function, context?: any) => void;
  };
  start: () => LegacyTween;
  to: (props: any, duration: number, ease?: any) => LegacyTween;
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

// Easing compatibility mapping
export interface EasingMap {
  'Linear.None': string;
  'Quadratic.InOut': string;
  'Quadratic.In': string;
  'Quadratic.Out': string;
  'Cubic.InOut': string;
  'Cubic.In': string;
  'Cubic.Out': string;
  'Quartic.InOut': string;
  'Quartic.In': string;
  'Quartic.Out': string;
  'Quintic.InOut': string;
  'Quintic.In': string;
  'Quintic.Out': string;
  'Sinusoidal.InOut': string;
  'Sinusoidal.In': string;
  'Sinusoidal.Out': string;
  'Exponential.InOut': string;
  'Exponential.In': string;
  'Exponential.Out': string;
  'Circular.InOut': string;
  'Circular.In': string;
  'Circular.Out': string;
  'Elastic.InOut': string;
  'Elastic.In': string;
  'Elastic.Out': string;
  'Back.InOut': string;
  'Back.In': string;
  'Back.Out': string;
  'Bounce.InOut': string;
  'Bounce.In': string;
  'Bounce.Out': string;
}

// Audio compatibility types
export interface LegacySound {
  play: () => any;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  volume: number;
  loop: boolean;
}

// Input compatibility types
export interface LegacyPointer {
  x: number;
  y: number;
  button: number;
  isDown: boolean;
  isUp: boolean;
}

// Graphics compatibility types
export interface LegacyGraphics {
  clear: () => void;
  lineStyle: (width: number, color: number, alpha?: number) => void;
  beginFill: (color: number, alpha?: number) => void;
  endFill: () => void;
  drawRect: (x: number, y: number, width: number, height: number) => void;
  drawCircle: (x: number, y: number, radius: number) => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
}