/**
 * Utility functions for string manipulation and conversion.
 * @module string
 */

/**
 * Pad left size of a number, if its length is less than a minimum size.
 * Like Python's zfill()
 *
 * @example zfill(1234, 3) // '1234'
 * @example zfill(1234, 10) // '0000001234'
 * @example zfill(-1234, 10) // '-000001234'
 *
 * @param {number} num - The number to pad.
 * @param {number} size - The minimum length of the resulting string.
 * @returns {string} The padded string.
 */
export function zfill(num: number, size: number): string {
	if (num < 0) {
		const s = Math.abs(num) + '';
		return '-' + s.padStart(size - 1, '0');
	} else {
		const s = num + '';
		return s.padStart(size, '0');
	}
}

/**
 * Capitalize the first letter of a string.
 *
 * @example capitalize('hello world') // 'Hello world'
 *
 * @param {string} str - The string to capitalize.
 * @returns {string} Capitalized string.
 */
export function capitalize(str: string): string {
	if (!str || typeof str !== 'string') {
		return '';
	}
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert a string or boolean to a boolean value.
 *
 * @example toBool("true") // true
 * @example toBool(" TRUE ") // true
 * @example toBool("yes") // true
 * @example toBool("1") // true
 * @example toBool(true) // true
 * @example toBool("anything else") // false
 * @example toBool("false") // false
 * @example toBool([1, 2, 3]) // false
 * @example toBool({"a": 1}) // false
 *
 * @param {string|boolean} str - The value to convert to boolean.
 * @returns {boolean} true if the trimmed, lowercase string is in ["true", "yes", "1"], else false
 */
export function toBool(str: string | boolean): boolean {
	// NOTE: Guard against repeatedly calling `toBool`.
	if (str === true) {
		return str;
	}

	if (typeof str === 'string') {
		switch (str.toLowerCase().trim()) {
			case 'true':
			case 'yes':
			case '1':
				return true;

			default:
				return false;
		}
	}

	return false;
}
