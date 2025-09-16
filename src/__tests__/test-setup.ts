/**
 * Test setup and configuration for comprehensive testing suite
 * Provides common mocks and utilities for all tests
 */

// Mock DOM environment
import 'jest-environment-jsdom';

// Global test utilities
declare global {
	namespace jest {
		interface Matchers<R> {
			toBeWithinRange(floor: number, ceiling: number): R;
		}
	}
}

// Custom Jest matchers
expect.extend({
	toBeWithinRange(received: number, floor: number, ceiling: number) {
		const pass = received >= floor && received <= ceiling;
		if (pass) {
			return {
				message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
				pass: true,
			};
		} else {
			return {
				message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
				pass: false,
			};
		}
	},
});

// Mock performance API for older environments
if (!global.performance) {
	global.performance = {
		now: jest.fn(() => Date.now()),
		mark: jest.fn(),
		measure: jest.fn(),
		getEntriesByName: jest.fn(() => []),
		getEntriesByType: jest.fn(() => []),
		clearMarks: jest.fn(),
		clearMeasures: jest.fn()
	} as any;
}

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
	// Reset console mocks before each test
	console.error = jest.fn();
	console.warn = jest.fn();
});

afterEach(() => {
	// Restore console methods after each test
	console.error = originalConsoleError;
	console.warn = originalConsoleWarn;
});

// Mock localStorage
const localStorageMock = {
	getItem: jest.fn(),
	setItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
	length: 0,
	key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
	getItem: jest.fn(),
	setItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
	length: 0,
	key: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: jest.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(), // deprecated
		removeListener: jest.fn(), // deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock Blob
global.Blob = jest.fn().mockImplementation((content, options) => ({
	size: content ? content.length : 0,
	type: options?.type || '',
	arrayBuffer: jest.fn(),
	slice: jest.fn(),
	stream: jest.fn(),
	text: jest.fn(),
}));

// Mock File
global.File = jest.fn().mockImplementation((bits, name, options) => ({
	...new Blob(bits, options),
	name,
	lastModified: Date.now(),
	webkitRelativePath: '',
}));

// Mock FileReader
global.FileReader = jest.fn().mockImplementation(() => ({
	readAsText: jest.fn(),
	readAsDataURL: jest.fn(),
	readAsArrayBuffer: jest.fn(),
	readAsBinaryString: jest.fn(),
	abort: jest.fn(),
	result: null,
	error: null,
	onload: null,
	onerror: null,
	onabort: null,
	onloadstart: null,
	onloadend: null,
	onprogress: null,
	readyState: 0,
	EMPTY: 0,
	LOADING: 1,
	DONE: 2,
}));

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
	fillRect: jest.fn(),
	clearRect: jest.fn(),
	getImageData: jest.fn(() => ({ data: new Array(4) })),
	putImageData: jest.fn(),
	createImageData: jest.fn(() => ({ data: new Array(4) })),
	setTransform: jest.fn(),
	drawImage: jest.fn(),
	save: jest.fn(),
	fillText: jest.fn(),
	restore: jest.fn(),
	beginPath: jest.fn(),
	moveTo: jest.fn(),
	lineTo: jest.fn(),
	closePath: jest.fn(),
	stroke: jest.fn(),
	translate: jest.fn(),
	scale: jest.fn(),
	rotate: jest.fn(),
	arc: jest.fn(),
	fill: jest.fn(),
	measureText: jest.fn(() => ({ width: 0 })),
	transform: jest.fn(),
	rect: jest.fn(),
	clip: jest.fn(),
}));

// Mock HTMLMediaElement methods
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
	writable: true,
	value: jest.fn().mockImplementation(() => Promise.resolve()),
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
	writable: true,
	value: jest.fn(),
});

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
	writable: true,
	value: jest.fn(),
});

// Mock Audio constructor
global.Audio = jest.fn().mockImplementation(() => ({
	play: jest.fn().mockResolvedValue(undefined),
	pause: jest.fn(),
	load: jest.fn(),
	addEventListener: jest.fn(),
	removeEventListener: jest.fn(),
	dispatchEvent: jest.fn(),
	currentTime: 0,
	duration: 0,
	volume: 1,
	muted: false,
	paused: true,
	ended: false,
	readyState: 0,
	src: '',
}));

// Export common test utilities
export const createMockElement = (tagName: string = 'div', attributes: Record<string, string> = {}): HTMLElement => {
	const element = document.createElement(tagName);
	Object.entries(attributes).forEach(([key, value]) => {
		element.setAttribute(key, value);
	});
	return element;
};

export const createMockEvent = (type: string, properties: Record<string, any> = {}): Event => {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.assign(event, properties);
	return event;
};

export const waitForNextTick = (): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, 0));
};

export const waitForAnimation = (duration: number = 100): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, duration));
};

export const mockConsole = () => {
	const originalMethods = {
		log: console.log,
		warn: console.warn,
		error: console.error,
		info: console.info,
	};

	const mocks = {
		log: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		info: jest.fn(),
	};

	Object.assign(console, mocks);

	return {
		mocks,
		restore: () => Object.assign(console, originalMethods),
	};
};

// Common test data
export const testData = {
	validEmail: 'test@example.com',
	invalidEmail: 'invalid-email',
	validPassword: 'securePassword123',
	shortPassword: '123',
	sampleFormData: {
		username: 'testuser',
		email: 'test@example.com',
		password: 'securePassword123',
		confirmPassword: 'securePassword123',
	},
	sampleCoordinates: [
		{ x: 100, y: 100 },
		{ x: 200, y: 150 },
		{ x: 300, y: 200 },
	],
	sampleHexPositions: [
		{ x: 0, y: 0, displayPos: { x: 100, y: 100 } },
		{ x: 1, y: 0, displayPos: { x: 150, y: 100 } },
		{ x: 0, y: 1, displayPos: { x: 125, y: 150 } },
	],
};

// Performance testing utilities
export const measureExecutionTime = async (fn: () => void | Promise<void>): Promise<number> => {
	const start = performance.now();
	await fn();
	const end = performance.now();
	return end - start;
};

export const runPerformanceTest = async (
	fn: () => void | Promise<void>,
	iterations: number = 10,
	maxTime: number = 100
): Promise<{ averageTime: number; maxTime: number; minTime: number; passed: boolean }> => {
	const times: number[] = [];

	for (let i = 0; i < iterations; i++) {
		const time = await measureExecutionTime(fn);
		times.push(time);
	}

	const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
	const maxTimeRecorded = Math.max(...times);
	const minTime = Math.min(...times);
	const passed = averageTime <= maxTime;

	return {
		averageTime,
		maxTime: maxTimeRecorded,
		minTime,
		passed,
	};
};