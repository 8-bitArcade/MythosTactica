/**
 * Provides version information and utilities for the application.
 * Version is derived from package.json and processed using semver.
 * @module version
 */
import * as semver from 'semver';
import packageInfo from '../../package.json';
import { DEBUG } from '../debug';

/**
 * The cleaned full version string (e.g., '1.2.3').
 */
export const full = semver.clean(packageInfo.version);

/**
 * The major version number.
 */
export const major = semver.major(full);

/**
 * The minor version number.
 */
export const minor = semver.minor(full);

/**
 * The patch version number.
 */
export const patch = semver.patch(full);

/**
 * The release type: 'alpha' if DEBUG is true, otherwise 'gold'.
 */
export const release = DEBUG ? 'alpha' : 'gold';

/**
 * The major.minor version string (e.g., '1.2').
 */
export const major_minor = [major, minor].join('.');

/**
 * A pretty version string (e.g., 'v1.2-α' for alpha, 'v1.2' for gold).
 */
export const pretty = `v${major_minor}` + (release === 'alpha' ? '-α' : '');

/**
 * Checks if a version string is valid according to semver.
 * @param {string} a - The version string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
export function isValid(a: string): boolean {
	return semver.valid(a) !== null;
}

/**
 * Checks if two version strings are equal (no difference in semver terms).
 * If the second version is not provided, compares to the current full version.
 * @param {string} a - The first version string.
 * @param {string} [b] - The second version string (optional).
 * @returns {boolean} True if versions are equal, false otherwise.
 */
export function equals(a: string, b?: string): boolean {
	b = typeof b === 'undefined' ? full : b;
	if (!semver.valid(a) || !semver.valid(b)) {
		return false;
	}
	return semver.diff(a, b) === null;
}
