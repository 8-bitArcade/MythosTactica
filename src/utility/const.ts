/**
 * Constants and utility functions for hex grid coordinate calculations.
 * @module const
 */
import { Point } from './pointfacade';

/**
 * The width of a hex tile in pixels.
 */
export const HEX_WIDTH_PX = 90;

/**
 * The height of a hex tile in pixels, derived from HEX_WIDTH_PX.
 */
export const HEX_HEIGHT_PX = (HEX_WIDTH_PX / Math.sqrt(3)) * 2 * 0.75;

/**
 * Converts offset coordinates to pixel coordinates.
 * @param {Point} point - The point with offset coordinates.
 * @returns {{x: number, y: number}} The pixel coordinates.
 */
export function offsetCoordsToPx(point: Point): { x: number; y: number } {
	return {
		x: (point.y % 2 === 0 ? point.x + 0.5 : point.x) * HEX_WIDTH_PX,
		y: point.y * HEX_HEIGHT_PX,
	};
}

const n2_16 = Math.pow(2, 16);

function isValid(point: Point) {
	return 0 <= point.x && point.x < n2_16 && 0 <= point.y && point.y < n2_16;
}

/**
 * Returns the neighbors of a point in offset coordinates, in clockwise order starting at 3 o'clock.
 * @param {Point} point - The point to find neighbors for.
 * @returns {Point[]} Array of neighboring points.
 */
export function offsetNeighbors(point: Point): Point[] {
	// NOTE: returns neighbors in clockwise order starting at 3 o'clock.
	if (point.y % 2 === 0) {
		return [
			{ x: point.x + 1, y: point.y },
			{ x: point.x + 1, y: point.y + 1 },
			{ x: point.x, y: point.y + 1 },
			{ x: point.x - 1, y: point.y },
			{ x: point.x, y: point.y - 1 },
			{ x: point.x + 1, y: point.y - 1 },
		].filter(isValid);
	} else {
		return [
			{ x: point.x + 1, y: point.y },
			{ x: point.x, y: point.y + 1 },
			{ x: point.x - 1, y: point.y + 1 },
			{ x: point.x - 1, y: point.y },
			{ x: point.x - 1, y: point.y - 1 },
			{ x: point.x, y: point.y - 1 },
		].filter(isValid);
	}
}

/**
 * Hashes offset coordinates into a single number for fast lookup.
 * @param {Point} point - The point to hash.
 * @returns {number} The hash value.
 */
export function hashOffsetCoords(point: Point): number {
	return (point.x << 16) ^ point.y;
}
