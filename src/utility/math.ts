/**
 * Utility functions for mathematical operations.
 * @module math
 */

/**
 * Constrains a value between a minimum and maximum value.
 *
 * @param {number} value - The number to constrain
 * @param {number} min - The minimum boundary (defaults to negative infinity if NaN)
 * @param {number} max - The maximum boundary (defaults to positive infinity if NaN)
 * @returns {number} The constrained value within the min and max range
 *
 * @example
 * clamp(10, 0, 5); // Returns 5
 * clamp(-5, 0, 5); // Returns 0
 * clamp(7, 10, 5); // Returns 7 (min and max swapped)
 */
export function clamp(value: number, min: number, max: number): number {
	min = isNaN(min) ? Number.NEGATIVE_INFINITY : min;
	max = isNaN(max) ? Number.POSITIVE_INFINITY : max;
	if (min > max) {
		[min, max] = [max, min];
	}
	return Math.max(Math.min(value, max), min);
}
