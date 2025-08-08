/**
 * Provides a facade for working with points, creatures, traps, and drops on the grid.
 * Includes types and classes for point normalization and set operations.
 * @module pointfacade
 */
import { Creature } from '../models/Creature';
import { Drop } from '../models/Drop';
import { hashOffsetCoords as hash } from './const';
import { Trap } from '../models/Trap';

/**
 * Represents a point on the grid.
 */
export type Point = {
	x: number;
	y: number;
};

/**
 * Configuration for PointFacade, providing accessors for creatures, traps, and drops.
 */
type PointFacadeConfig = {
	getCreatures: () => Creature[];
	getCreaturePassablePoints: (creature: Creature) => Point[];
	getCreatureBlockedPoints: (creature: Creature) => Point[];

	getTraps: () => Trap[];
	getTrapPassablePoints: (trap: Trap) => Point[];
	getTrapBlockedPoints: (trap: Trap) => Point[];

	getDrops: () => Drop[];
	getDropPassablePoints: (drop: Drop) => Point[];
	getDropBlockedPoints: (drop: Drop) => Point[];
};

/**
 * Set-like class for working with points, using a hash for fast lookup.
 */
class PointSet {
	s: Set<number>;
	config: PointFacadeConfig;

	/**
	 * @param {Set<number>} s - Set of hashed points.
	 * @param {PointFacadeConfig} config - Configuration for point normalization.
	 */
	constructor(s: Set<number>, config: PointFacadeConfig) {
		this.s = s;
		this.config = config;
	}

	/**
	 * Checks if the set contains the given point(s), creature, or hash.
	 * @param {Point | Point[] | Creature | number} point - The point(s), creature, or hash to check.
	 * @param {number} [y=0] - Optional y coordinate if point is (x, y).
	 * @returns {boolean} True if any of the points are in the set.
	 */
	has(point: Point | Point[] | Creature | number, y = 0): boolean {
		const points = normalize(point, y, this.config);
		for (const point of points) {
			if (this.s.has(hash(point))) {
				return true;
			}
		}
		return false;
	}
}

/**
 * Facade for working with points and their relationships to creatures, traps, and drops.
 */
export class PointFacade {
	private config: PointFacadeConfig;

	/**
	 * @param {PointFacadeConfig} config - Configuration for point accessors.
	 * @throws {Error} If config is invalid.
	 */
	constructor(config: PointFacadeConfig) {
		if (!canBuild(config)) {
			/**
			 * NOTE: This isn't absolutely necessary with TS, but the caller
			 * is currently in a JS file, so we'll check the config object
			 * and throw if incomplete.
			 */
			throw new Error(
				'PointFacade is not fully configured. \nMissing: \n' +
					getMissingConfigRequirements(config).join('\n'),
			);
		}
		this.config = config;
	}

	/**
	 * Gets a set of blocked points from creatures, traps, and drops.
	 * @returns {PointSet} A set-like object containing blocked points.
	 */
	getBlockedSet(): PointSet {
		const blockedSet = new Set<number>();
		for (const c of this.config.getCreatures()) {
			for (const point of this.config.getCreatureBlockedPoints(c)) {
				blockedSet.add(hash(point));
			}
		}
		for (const t of this.config.getTraps()) {
			for (const point of this.config.getTrapBlockedPoints(t)) {
				blockedSet.add(hash(point));
			}
		}
		for (const d of this.config.getDrops()) {
			for (const point of this.config.getDropBlockedPoints(d)) {
				blockedSet.add(hash(point));
			}
		}
		return new PointSet(blockedSet, this.config);
	}

	/**
	 * Checks if a point is blocked by creatures, traps, or drops.
	 * @param {Point | Creature | Point[] | number} point - The point, creature, or hash to check.
	 * @param {number} [y=0] - Optional y coordinate if point is (x, y).
	 * @returns {boolean} True if the point is blocked.
	 */
	isBlocked(point: Point | Creature | Point[] | number, y = 0) {
		const point_ = normalize(point, y, this.config);
		return this.getBlockedSet().has(point_);
	}

	/**
	 * Gets creatures at a specific point, including those that are blocked or passable.
	 * @param {Point | Creature | Point[] | number} point - The point, creature, or hash to check.
	 * @param {number} [y=0] - Optional y coordinate if point is (x, y).
	 * @returns {Creature[]} Array of creatures at the point.
	 */
	getCreaturesAt(point: Point | Creature | Point[] | number, y = 0) {
		const config = this.config;

		const points: Set<number> = normalize(point, y, this.config).reduce((s, p) => {
			s.add(hash(p));
			return s;
		}, new Set<number>());
		const hasPoint = (p: Point) => points.has(hash(p));

		return config
			.getCreatures()
			.filter(
				(c) =>
					config.getCreatureBlockedPoints(c).some(hasPoint) ||
					config.getCreaturePassablePoints(c).some(hasPoint),
			);
	}

	/**
	 * Gets traps at a specific point, including those that are blocked or passable.
	 * @param {Point | Creature | Point[] | number} point - The point, creature, or hash to check.
	 * @param {number} [y=0] - Optional y coordinate if point is (x, y).
	 * @returns {Trap[]} Array of traps at the point.
	 */
	getTrapsAt(point: Point | Creature | Point[] | number, y = 0) {
		const config = this.config;

		const points: Set<number> = normalize(point, y, this.config).reduce((s, p) => {
			s.add(hash(p));
			return s;
		}, new Set<number>());
		const hasPoint = (p: Point) => points.has(hash(p));

		return config
			.getTraps()
			.filter(
				(t) =>
					config.getTrapBlockedPoints(t).some(hasPoint) ||
					config.getTrapPassablePoints(t).some(hasPoint),
			);
	}

	/**
	 * Gets drops at a specific point, including those that are blocked or passable.
	 * @param {Point | Creature | Point[] | number} point - The point, creature, or hash to check.
	 * @param {number} [y=0] - Optional y coordinate if point is (x, y).
	 * @returns {Drop[]} Array of drops at the point.
	 */
	getDropsAt(point: Point | Creature | Point[] | number, y = 0) {
		const config = this.config;

		const points: Set<number> = normalize(point, y, this.config).reduce((s, p) => {
			s.add(hash(p));
			return s;
		}, new Set<number>());
		const hasPoint = (p: Point) => points.has(hash(p));

		return config
			.getDrops()
			.filter(
				(d) =>
					config.getDropBlockedPoints(d).some(hasPoint) ||
					config.getDropPassablePoints(d).some(hasPoint),
			);
	}
}

function getMissingConfigRequirements(config: PointFacadeConfig): string[] {
	const missing: string[] = [];
	if (!config.getCreatures) {
		missing.push('getCreatures() => Creature[]');
	}
	if (!config.getCreaturePassablePoints) {
		missing.push('getCreaturePassablePoints(creature:Creature) => Point[]');
	}
	if (!config.getCreatureBlockedPoints) {
		missing.push('getCreatureBlockedPoints(creature:Creature) => Point[]');
	}

	if (!config.getTraps) {
		missing.push('getTraps() => Trap[]');
	}
	if (!config.getTrapPassablePoints) {
		missing.push('getTrapPassablePoints(trap:Trap) => Point[]');
	}
	if (!config.getTrapBlockedPoints) {
		missing.push('getTrapBlockedPoints(trap:Trap) => Point[]');
	}

	if (!config.getDrops) {
		missing.push('getDrops() => Drop[]');
	}
	if (!config.getDropPassablePoints) {
		missing.push('getDropPassablePoints(drop:Drop) => Point[]');
	}
	if (!config.getDropBlockedPoints) {
		missing.push('getDropBlockedPoints(drop:Drop) => Point[]');
	}

	return missing;
}

function canBuild(config: PointFacadeConfig) {
	return getMissingConfigRequirements(config).length === 0;
}

function normalize(
	point: Point | Point[] | Creature | number,
	y: number,
	config: PointFacadeConfig,
): Point[] {
	if (typeof point === 'number') {
		// NOTE: point:number, y:number
		return [{ x: point, y }];
	}
	if ('x' in point && 'y' in point && !('size' in point)) {
		// NOTE: point:{x: number, y: number}
		return [{ x: point.x, y: point.y }];
	}
	if ('x' in point && 'y' in point && 'size' in point) {
		// NOTE: point:Creature
		return [].concat(
			config.getCreatureBlockedPoints(point),
			config.getCreaturePassablePoints(point),
		);
	} else {
		// NOTE: point:Point[]
		return point;
	}
}

/**
 * NOTE: Allow the facade to be configured once and imported
 * anywhere in the game, using only the present module.
 **/

class Configuration {
	static config: PointFacadeConfig;

	constructor(config: PointFacadeConfig) {
		if (!canBuild(config)) {
			/**
			 * NOTE: This isn't absolutely necessary with TS, but the caller
			 * is currently in a JS file, so we'll check the config object
			 * and throw if incomplete.
			 */
			throw new Error(
				'PointFacade is not fully configured. \nMissing: \n' +
					getMissingConfigRequirements(config).join('\n'),
			);
		}
		Configuration.config = config;
	}
}

export function configure(config: PointFacadeConfig) {
	new Configuration(config);
}

export function getPointFacade() {
	if (!Configuration.config) {
		throw new Error('PointFacade is not configured.');
	}
	return new PointFacade(Configuration.config);
}
