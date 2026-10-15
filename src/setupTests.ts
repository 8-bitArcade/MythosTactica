// Jest setup file for MythosTactica
// This file is executed before each test file

// Mock Phaser globally for tests
global.Phaser = {
	Game: jest.fn(),
	Scene: jest.fn(),
	GameObjects: {
		Sprite: jest.fn(),
		Image: jest.fn(),
		Text: jest.fn(),
		Container: jest.fn(),
	},
	Input: {
		Keyboard: {
			Key: jest.fn(),
		},
	},
	Math: {
		Vector2: jest.fn(),
	},
	Geom: {
		Point: jest.fn(),
		Rectangle: jest.fn(),
	},
} as any;

// Mock browser APIs that might not be available in test environment
Object.defineProperty(window, 'localStorage', {
	value: {
		getItem: jest.fn(),
		setItem: jest.fn(),
		removeItem: jest.fn(),
		clear: jest.fn(),
	},
	writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
	value: {
		getItem: jest.fn(),
		setItem: jest.fn(),
		removeItem: jest.fn(),
		clear: jest.fn(),
	},
	writable: true,
});

// Mock console methods to reduce noise in tests
global.console = {
	...console,
	// Uncomment to silence console.log in tests
	// log: jest.fn(),
	debug: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};

// Set up global test utilities
beforeEach(() => {
	// Clear all mocks before each test
	jest.clearAllMocks();
});

afterEach(() => {
	// Clean up after each test
	jest.restoreAllMocks();
});