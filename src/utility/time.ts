/**
 * Utility functions for time formatting and async delays.
 * @module time
 */
import { zfill } from './string';

/**
 * Formats a number of seconds as a timer string (MM:SS).
 *
 * @param {number} seconds - The number of seconds to format.
 * @returns {string} The formatted timer string.
 *
 * @example getTimer(75) // '01:15'
 */
export const getTimer = (seconds: number): string =>
	zfill(Math.floor(seconds / 60), 2) + ':' + zfill(seconds % 60, 2);

/**
 * Async delay that resolves after a given number of milliseconds.
 *
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} Promise that resolves after the delay.
 *
 * @example await sleep(1000); // Waits 1 second
 */
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
