// Utility type definitions for various helper functions and classes

import { Creature } from '../src/models/Creature';
import { Hex } from '../src/utility/hex';
import { Point } from '../src/utility/pointfacade';

// Pathfinding types
export interface PathfindingNode {
  x: number;
  y: number;
  pos: Point;
  g: number; // Cost from start
  h: number; // Heuristic cost to goal
  f: number; // Total cost
  parent?: PathfindingNode;
  pathparent?: PathfindingNode;
  adjacentHex: (size: number) => Hex[];
}

export interface PathfindingOptions {
  start: Hex;
  end: Hex;
  excludeCreatures?: boolean;
  excludeTraps?: boolean;
  maxDistance?: number;
  allowDiagonal?: boolean;
}

export interface PathfindingResult {
  path: Hex[];
  distance: number;
  found: boolean;
}

// Array utility types
export interface ArrayUtilityOptions {
  compareFunction?: (a: any, b: any) => boolean;
  keyFunction?: (item: any) => string | number;
}

// String utility types
export interface StringFormatOptions {
  padChar?: string;
  padLength?: number;
  trimWhitespace?: boolean;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
}

// Math utility types
export interface MathRange {
  min: number;
  max: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D extends Vector2D {
  z: number;
}

// Time utility types
export interface TimeFormat {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds?: number;
}

export interface TimerConfig {
  duration: number;
  interval?: number;
  autoStart?: boolean;
  onTick?: (remaining: number) => void;
  onComplete?: () => void;
}

// Version utility types
export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

export interface VersionComparison {
  result: -1 | 0 | 1; // less than, equal, greater than
  difference: {
    major: number;
    minor: number;
    patch: number;
  };
}

// Team utility types
export enum TeamRelationship {
  Same = 'same',
  Enemy = 'enemy',
  Ally = 'ally',
  Neutral = 'neutral'
}

export interface TeamUtilityOptions {
  includeNeutral?: boolean;
  includeDead?: boolean;
  includeTemp?: boolean;
}

// Position utility types
export interface PositionDelta {
  dx: number;
  dy: number;
  distance: number;
  angle: number;
}

export interface PositionOptions {
  includeSize?: boolean;
  snapToGrid?: boolean;
  validateBounds?: boolean;
}

// Hex grid utility types
export interface HexGridQuery {
  hexes: Hex[];
  size?: number;
  team?: number;
  includeCreatures?: boolean;
  excludeCreatures?: boolean;
  includeTraps?: boolean;
  excludeTraps?: boolean;
  range?: number;
  minRange?: number;
}

export interface HexGridQueryResult {
  hexes: Hex[];
  creatures: Creature[];
  validTargets: Hex[];
  blockedHexes: Hex[];
}

// Constants utility types
export interface HexConstants {
  WIDTH_PX: number;
  HEIGHT_PX: number;
  RADIUS_PX: number;
  SIDE_LENGTH_PX: number;
}

export interface GridConstants {
  MAX_X: number;
  MAX_Y: number;
  CENTER_X: number;
  CENTER_Y: number;
}

// Point facade utility types
export interface PointFacadeConfig {
  getCreatures: () => Creature[];
  getCreaturePassablePoints: (creature: Creature) => Point[];
  getTraps?: () => any[];
  getDrops?: () => any[];
  isBlocked?: (point: Point) => boolean;
}

export interface PointFacadeQuery {
  point: Point | Point[] | Creature | number;
  y?: number;
  includeSize?: boolean;
}

// Game log utility types
export interface LogEntry {
  action: string;
  timestamp: number;
  turn?: number;
  creature?: number;
  target?: {
    type?: 'hex' | 'creature' | 'array';
    x?: number;
    y?: number;
    crea?: number;
    array?: Point[];
  };
  id?: number;
  args?: any;
}

export interface LogConfig {
  maxEntries?: number;
  enableCompression?: boolean;
  enableEncryption?: boolean;
  autoSave?: boolean;
  saveInterval?: number;
}

// Validation utility types
export interface ValidationRule {
  name: string;
  validator: (value: any) => boolean | string;
  message?: string;
  required?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fieldErrors: { [field: string]: string[] };
}

export interface ValidationSchema {
  fields: { [field: string]: ValidationRule[] };
  globalRules?: ValidationRule[];
}

// Cache utility types
export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl?: number;
  accessCount: number;
}

export interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number;
  cleanupInterval?: number;
  enableStats?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
}

// Event utility types
export interface EventEmitterConfig {
  maxListeners?: number;
  enableWildcards?: boolean;
  enableAsync?: boolean;
}

export interface EventSubscription {
  event: string;
  handler: Function;
  once?: boolean;
  priority?: number;
  context?: any;
}

// Performance utility types
export interface PerformanceTimer {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: { [key: string]: any };
}

export interface PerformanceProfile {
  timers: PerformanceTimer[];
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
}

// Debug utility types
export interface DebugConfig {
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  enableProfiling?: boolean;
  enableAssertions?: boolean;
  enableStackTraces?: boolean;
}

export interface DebugInfo {
  timestamp: number;
  level: string;
  message: string;
  data?: any;
  stackTrace?: string;
  source?: string;
}

// Serialization utility types
export interface SerializationConfig {
  includePrivateFields?: boolean;
  enableCompression?: boolean;
  customSerializers?: { [type: string]: (obj: any) => any };
  customDeserializers?: { [type: string]: (data: any) => any };
}

export interface SerializationResult {
  data: string;
  size: number;
  compressionRatio?: number;
  metadata?: { [key: string]: any };
}

// Color utility types
export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface ColorHSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorHex {
  hex: string;
  shortHex?: string;
}

export interface ColorUtilityOptions {
  format?: 'rgb' | 'hsl' | 'hex';
  includeAlpha?: boolean;
  normalize?: boolean;
}

// Random utility types
export interface RandomConfig {
  seed?: number;
  algorithm?: 'mersenne' | 'linear' | 'xorshift';
}

export interface RandomRange {
  min: number;
  max: number;
  step?: number;
}

// Geometry utility types
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GeometryIntersection {
  intersects: boolean;
  points: Point[];
  distance?: number;
}