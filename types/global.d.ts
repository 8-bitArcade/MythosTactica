interface Window {
	// Global debugging object added to `window.AB`.
	AB: {
		currentGame: any;
		getLog: () => string;
		saveLog: () => void;
		restoreGame: (str: string) => void;
	};
	// Global game instance
	G: any;
	// Global input manager for debugging
	InputManager: any;
}

// Audio file imports
declare module '*.ogg' {
	const content: string;
	export default content;
}

declare module '*.mp3' {
	const content: string;
	export default content;
}

declare module '*.wav' {
	const content: string;
	export default content;
}

// Image file imports
declare module '*.png' {
	const content: string;
	export default content;
}

declare module '*.jpg' {
	const content: string;
	export default content;
}

declare module '*.jpeg' {
	const content: string;
	export default content;
}

declare module '*.gif' {
	const content: string;
	export default content;
}

declare module '*.svg' {
	const content: string;
	export default content;
}

// CSS and style imports
declare module '*.css' {
	const content: { [className: string]: string };
	export default content;
}

declare module '*.less' {
	const content: { [className: string]: string };
	export default content;
}

declare module '*.scss' {
	const content: { [className: string]: string };
	export default content;
}

// JSON imports
declare module '*.json' {
	const content: any;
	export default content;
}

// External library type augmentations
declare module 'node-emoji' {
	export function get(name: string): string;
	export function find(emoji: string): { emoji: string; key: string } | undefined;
	export function emojify(str: string): string;
	export function random(): { emoji: string; key: string };
	export function search(keyword: string): Array<{ emoji: string; key: string }>;
	export function strip(str: string): string;
	export function replace(str: string, callback: (emoji: any, index: number, string: string) => string): string;
}

declare module 'underscore' {
	export function throttle<T extends (...args: any[]) => any>(
		func: T,
		wait: number,
		options?: { leading?: boolean; trailing?: boolean }
	): T;
	export function debounce<T extends (...args: any[]) => any>(
		func: T,
		wait: number,
		immediate?: boolean
	): T;
	export function clone<T>(obj: T): T;
	export function extend<T, U>(destination: T, ...sources: U[]): T & U;
	export function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K>;
	export function omit<T, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K>;
	export function isEqual(a: any, b: any): boolean;
	export function isEmpty(obj: any): boolean;
	export function isArray(obj: any): obj is any[];
	export function isObject(obj: any): obj is object;
	export function isFunction(obj: any): obj is Function;
	export function isString(obj: any): obj is string;
	export function isNumber(obj: any): obj is number;
	export function isBoolean(obj: any): obj is boolean;
	export function isUndefined(obj: any): obj is undefined;
	export function findWhere<T>(list: T[], properties: Partial<T>): T | undefined;
	export function each<T>(list: T[], iterator: (value: T, index: number, list: T[]) => void): void;
	export function map<T, U>(list: T[], iterator: (value: T, index: number, list: T[]) => U): U[];
	export function filter<T>(list: T[], predicate: (value: T, index: number, list: T[]) => boolean): T[];
	export function find<T>(list: T[], predicate: (value: T, index: number, list: T[]) => boolean): T | undefined;
	export function reduce<T, U>(list: T[], iterator: (memo: U, value: T, index: number, list: T[]) => U, memo: U): U;
	export function sortBy<T>(list: T[], iterator: (value: T) => any): T[];
	export function groupBy<T>(list: T[], iterator: (value: T) => string): { [key: string]: T[] };
	export function uniq<T>(array: T[]): T[];
	export function flatten<T>(array: any[]): T[];
	export function without<T>(array: T[], ...values: T[]): T[];
	export function union<T>(...arrays: T[][]): T[];
	export function intersection<T>(...arrays: T[][]): T[];
	export function difference<T>(array: T[], ...others: T[][]): T[];
	export function zip<T>(...arrays: T[][]): T[][];
	export function keys(obj: object): string[];
	export function values<T>(obj: { [key: string]: T }): T[];
	export function pairs<T>(obj: { [key: string]: T }): [string, T][];
	export function invert(obj: { [key: string]: string }): { [key: string]: string };
	export function functions(obj: object): string[];
	export function bind<T extends Function>(func: T, context: any, ...args: any[]): T;
	export function bindAll(obj: any, ...methodNames: string[]): any;
	export function memoize<T extends Function>(func: T, hasher?: (...args: any[]) => string): T;
	export function delay(func: Function, wait: number, ...args: any[]): number;
	export function defer(func: Function, ...args: any[]): number;
	export function once<T extends Function>(func: T): T;
	export function after(count: number, func: Function): Function;
	export function before(count: number, func: Function): Function;
	export function wrap<T extends Function>(func: T, wrapper: (func: T, ...args: any[]) => any): T;
	export function compose<T extends Function>(...funcs: Function[]): T;
	export function template(templateString: string, settings?: any): (data?: any) => string;
	export function result(obj: any, property: string, defaultValue?: any): any;
	export function uniqueId(prefix?: string): string;
	export function escape(str: string): string;
	export function unescape(str: string): string;
	export function chain<T>(obj: T): any;
	export function mixin(obj: any): void;
}
