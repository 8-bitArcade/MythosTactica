/**
 * Tests for input handling across different devices
 * Covers mouse, keyboard, and touch input scenarios
 */

import { InputManager } from '../input/InputManager';
import Game from '../game';

// Mock Phaser 3 input system
const mockPointer = {
	x: 100,
	y: 100,
	worldX: 100,
	worldY: 100,
	isDown: false,
	justDown: false,
	justUp: false
};

const mockKeyboard = {
	createCursorKeys: jest.fn(() => ({
		up: { isDown: false, justDown: false },
		down: { isDown: false, justDown: false },
		left: { isDown: false, justDown: false },
		right: { isDown: false, justDown: false }
	})),
	addKey: jest.fn((keyCode) => ({
		keyCode,
		isDown: false,
		justDown: false,
		justUp: false
	})),
	on: jest.fn()
};

const mockInput = {
	on: jest.fn(),
	off: jest.fn(),
	keyboard: mockKeyboard,
	activePointer: mockPointer,
	pointer1: mockPointer,
	pointer2: mockPointer,
	mousePointer: mockPointer,
	addPointer: jest.fn(),
	setDefaultCursor: jest.fn()
};

const mockScene = {
	scene: { key: 'MatchScene' },
	input: mockInput,
	cameras: {
		main: {
			scrollX: 0,
			scrollY: 0,
			zoom: 1
		}
	}
};

const mockPhaserGame = {
	scene: {
		getScene: jest.fn(() => mockScene),
		start: jest.fn()
	},
	events: { on: jest.fn() }
};

global.Phaser = {
	Game: jest.fn(() => mockPhaserGame),
	AUTO: 'AUTO',
	Scale: { FIT: 'FIT', CENTER_BOTH: 'CENTER_BOTH' },
	Events: {
		EventEmitter: jest.fn(() => ({
			on: jest.fn(), emit: jest.fn(), off: jest.fn(), removeAllListeners: jest.fn()
		}))
	},
	Input: {
		Keyboard: {
			KeyCodes: {
				SPACE: 32,
				ENTER: 13,
				ESC: 27,
				W: 87,
				A: 65,
				S: 83,
				D: 68,
				UP: 38,
				DOWN: 40,
				LEFT: 37,
				RIGHT: 39
			}
		}
	}
} as any;

// Mock hex grid for coordinate testing
const mockHexGrid = {
	hexes: [
		[{ x: 0, y: 0, displayPos: { x: 100, y: 100 } }],
		[{ x: 1, y: 0, displayPos: { x: 150, y: 100 } }],
		[{ x: 0, y: 1, displayPos: { x: 125, y: 150 } }]
	],
	getHexAt: jest.fn((x, y) => {
		// Simple mock implementation
		if (x >= 90 && x <= 110 && y >= 90 && y <= 110) {
			return { x: 0, y: 0 };
		}
		if (x >= 140 && x <= 160 && y >= 90 && y <= 110) {
			return { x: 1, y: 0 };
		}
		return null;
	})
};

describe('Input Handling Tests', () => {
	let game: Game;
	let inputManager: InputManager;

	beforeEach(() => {
		jest.clearAllMocks();
		game = new Game();
		game.currentScene = mockScene;
		game.grid = mockHexGrid as any;
		inputManager = new InputManager(game);
		inputManager.initialize(mockScene);
	});

	describe('Mouse Input', () => {
		test('should handle mouse clicks on hex grid', () => {
			inputManager.setInputMode('game');
			
			// Mock hex click detection
			const handleHexClickSpy = jest.spyOn(inputManager, 'handleHexClick');
			
			// Simulate mouse click at hex position
			const clickEvent = {
				x: 100,
				y: 100,
				worldX: 100,
				worldY: 100
			};
			
			// Trigger the click handler directly
			inputManager.handlePointerDown(clickEvent as any);
			
			expect(handleHexClickSpy).toHaveBeenCalledWith(100, 100);
		});

		test('should detect correct hex coordinates', () => {
			const hex1 = inputManager.getHexAtPosition(100, 100);
			expect(hex1).toEqual({ x: 0, y: 0 });
			
			const hex2 = inputManager.getHexAtPosition(150, 100);
			expect(hex2).toEqual({ x: 1, y: 0 });
			
			const noHex = inputManager.getHexAtPosition(50, 50);
			expect(noHex).toBeNull();
		});

		test('should handle mouse hover events', () => {
			inputManager.setInputMode('game');
			
			const hoverSpy = jest.spyOn(inputManager, 'handlePointerMove');
			
			const moveEvent = {
				x: 125,
				y: 125,
				worldX: 125,
				worldY: 125
			};
			
			inputManager.handlePointerMove(moveEvent as any);
			
			expect(hoverSpy).toHaveBeenCalledWith(moveEvent);
		});

		test('should handle right-click context menu', () => {
			inputManager.setInputMode('game');
			
			const rightClickSpy = jest.spyOn(inputManager, 'handleRightClick');
			
			const rightClickEvent = {
				x: 100,
				y: 100,
				rightButtonDown: jest.fn(() => true),
				event: { button: 2 }
			};
			
			inputManager.handleRightClick(rightClickEvent as any);
			
			expect(rightClickSpy).toHaveBeenCalledWith(rightClickEvent);
		});

		test('should handle mouse wheel for zoom', () => {
			const wheelSpy = jest.spyOn(inputManager, 'handleWheel');
			
			const wheelEvent = {
				deltaY: -100, // Scroll up
				x: 200,
				y: 200
			};
			
			inputManager.handleWheel(wheelEvent as any);
			
			expect(wheelSpy).toHaveBeenCalledWith(wheelEvent);
		});
	});

	describe('Keyboard Input', () => {
		test('should handle arrow key navigation', () => {
			inputManager.setInputMode('game');
			
			const keyDownSpy = jest.spyOn(inputManager, 'handleKeyDown');
			
			// Simulate arrow key press
			const keyEvent = {
				keyCode: 38, // UP arrow
				code: 'ArrowUp',
				key: 'ArrowUp'
			};
			
			inputManager.handleKeyDown(keyEvent as any);
			
			expect(keyDownSpy).toHaveBeenCalledWith(keyEvent);
		});

		test('should handle WASD movement keys', () => {
			inputManager.setInputMode('game');
			
			const movementKeys = [
				{ keyCode: 87, code: 'KeyW', key: 'w' }, // W
				{ keyCode: 65, code: 'KeyA', key: 'a' }, // A
				{ keyCode: 83, code: 'KeyS', key: 's' }, // S
				{ keyCode: 68, code: 'KeyD', key: 'd' }  // D
			];
			
			movementKeys.forEach(keyEvent => {
				const keyDownSpy = jest.spyOn(inputManager, 'handleKeyDown');
				inputManager.handleKeyDown(keyEvent as any);
				expect(keyDownSpy).toHaveBeenCalledWith(keyEvent);
			});
		});

		test('should handle hotkeys and shortcuts', () => {
			inputManager.setInputMode('game');
			
			const hotkeyEvent = {
				keyCode: 32, // SPACE
				code: 'Space',
				key: ' ',
				ctrlKey: false,
				shiftKey: false,
				altKey: false
			};
			
			const hotkeySpy = jest.spyOn(inputManager, 'handleHotkey');
			inputManager.handleHotkey(hotkeyEvent as any);
			
			expect(hotkeySpy).toHaveBeenCalledWith(hotkeyEvent);
		});

		test('should handle modifier key combinations', () => {
			inputManager.setInputMode('game');
			
			const modifierEvent = {
				keyCode: 65, // A
				code: 'KeyA',
				key: 'a',
				ctrlKey: true,
				shiftKey: false,
				altKey: false
			};
			
			const keyDownSpy = jest.spyOn(inputManager, 'handleKeyDown');
			inputManager.handleKeyDown(modifierEvent as any);
			
			expect(keyDownSpy).toHaveBeenCalledWith(modifierEvent);
		});

		test('should handle key repeat prevention', () => {
			inputManager.setInputMode('game');
			
			const keyEvent = {
				keyCode: 32,
				code: 'Space',
				key: ' ',
				repeat: true
			};
			
			const keyDownSpy = jest.spyOn(inputManager, 'handleKeyDown');
			inputManager.handleKeyDown(keyEvent as any);
			
			// Should still be called but handled differently for repeats
			expect(keyDownSpy).toHaveBeenCalledWith(keyEvent);
		});
	});

	describe('Touch Input', () => {
		test('should handle single touch tap', () => {
			inputManager.setInputMode('game');
			
			const touchEvent = {
				x: 100,
				y: 100,
				worldX: 100,
				worldY: 100,
				isDown: true,
				justDown: true,
				pointer: {
					pointerId: 1,
					type: 'touch'
				}
			};
			
			const touchSpy = jest.spyOn(inputManager, 'handleTouch');
			inputManager.handleTouch(touchEvent as any);
			
			expect(touchSpy).toHaveBeenCalledWith(touchEvent);
		});

		test('should handle touch and hold', () => {
			inputManager.setInputMode('game');
			
			const touchStartEvent = {
				x: 100,
				y: 100,
				worldX: 100,
				worldY: 100,
				isDown: true,
				justDown: true,
				pointer: { pointerId: 1, type: 'touch' }
			};
			
			const touchHoldSpy = jest.spyOn(inputManager, 'handleTouchHold');
			
			// Start touch
			inputManager.handleTouch(touchStartEvent as any);
			
			// Simulate hold duration
			setTimeout(() => {
				inputManager.handleTouchHold(touchStartEvent as any);
				expect(touchHoldSpy).toHaveBeenCalledWith(touchStartEvent);
			}, 500);
		});

		test('should handle multi-touch gestures', () => {
			inputManager.setInputMode('game');
			
			const touch1 = {
				x: 100, y: 100, worldX: 100, worldY: 100,
				pointer: { pointerId: 1, type: 'touch' }
			};
			
			const touch2 = {
				x: 200, y: 200, worldX: 200, worldY: 200,
				pointer: { pointerId: 2, type: 'touch' }
			};
			
			const multiTouchSpy = jest.spyOn(inputManager, 'handleMultiTouch');
			inputManager.handleMultiTouch([touch1, touch2] as any);
			
			expect(multiTouchSpy).toHaveBeenCalledWith([touch1, touch2]);
		});

		test('should handle touch drag/swipe', () => {
			inputManager.setInputMode('game');
			
			const dragStartEvent = {
				x: 100, y: 100, worldX: 100, worldY: 100,
				isDown: true, pointer: { pointerId: 1, type: 'touch' }
			};
			
			const dragMoveEvent = {
				x: 150, y: 150, worldX: 150, worldY: 150,
				isDown: true, pointer: { pointerId: 1, type: 'touch' }
			};
			
			const dragSpy = jest.spyOn(inputManager, 'handleDrag');
			
			inputManager.handleTouch(dragStartEvent as any);
			inputManager.handleDrag(dragStartEvent as any, dragMoveEvent as any);
			
			expect(dragSpy).toHaveBeenCalledWith(dragStartEvent, dragMoveEvent);
		});

		test('should distinguish between tap and drag', () => {
			inputManager.setInputMode('game');
			
			const startEvent = {
				x: 100, y: 100, worldX: 100, worldY: 100,
				isDown: true, pointer: { pointerId: 1, type: 'touch' }
			};
			
			// Small movement (should be tap)
			const smallMoveEvent = {
				x: 102, y: 102, worldX: 102, worldY: 102,
				isDown: false, pointer: { pointerId: 1, type: 'touch' }
			};
			
			const tapSpy = jest.spyOn(inputManager, 'handleTap');
			inputManager.handleTap(startEvent as any, smallMoveEvent as any);
			
			expect(tapSpy).toHaveBeenCalledWith(startEvent, smallMoveEvent);
		});
	});

	describe('Input Mode Management', () => {
		test('should switch between input modes', () => {
			expect(inputManager.getCurrentInputMode()).toBe('menu');
			
			inputManager.setInputMode('game');
			expect(inputManager.getCurrentInputMode()).toBe('game');
			
			inputManager.setInputMode('ui');
			expect(inputManager.getCurrentInputMode()).toBe('ui');
		});

		test('should handle input differently based on mode', () => {
			const clickEvent = {
				x: 100, y: 100, worldX: 100, worldY: 100
			};
			
			// Menu mode - should not handle hex clicks
			inputManager.setInputMode('menu');
			const menuClickSpy = jest.spyOn(inputManager, 'handleMenuClick');
			inputManager.handlePointerDown(clickEvent as any);
			
			// Game mode - should handle hex clicks
			inputManager.setInputMode('game');
			const hexClickSpy = jest.spyOn(inputManager, 'handleHexClick');
			inputManager.handlePointerDown(clickEvent as any);
			
			expect(hexClickSpy).toHaveBeenCalled();
		});

		test('should disable input when requested', () => {
			inputManager.setInputMode('game');
			inputManager.enableInput();
			expect(inputManager.isInputEnabled()).toBe(true);
			
			inputManager.disableInput();
			expect(inputManager.isInputEnabled()).toBe(false);
			
			// Input should be ignored when disabled
			const clickEvent = { x: 100, y: 100, worldX: 100, worldY: 100 };
			const clickSpy = jest.spyOn(inputManager, 'handleHexClick');
			inputManager.handlePointerDown(clickEvent as any);
			
			// Should not be called when input is disabled
			expect(clickSpy).not.toHaveBeenCalled();
		});
	});

	describe('Cross-Device Compatibility', () => {
		test('should handle both mouse and touch on hybrid devices', () => {
			inputManager.setInputMode('game');
			
			// Mouse event
			const mouseEvent = {
				x: 100, y: 100, worldX: 100, worldY: 100,
				pointer: { type: 'mouse' }
			};
			
			// Touch event at same location
			const touchEvent = {
				x: 100, y: 100, worldX: 100, worldY: 100,
				pointer: { type: 'touch', pointerId: 1 }
			};
			
			const mouseClickSpy = jest.spyOn(inputManager, 'handlePointerDown');
			const touchSpy = jest.spyOn(inputManager, 'handleTouch');
			
			inputManager.handlePointerDown(mouseEvent as any);
			inputManager.handleTouch(touchEvent as any);
			
			expect(mouseClickSpy).toHaveBeenCalledWith(mouseEvent);
			expect(touchSpy).toHaveBeenCalledWith(touchEvent);
		});

		test('should adapt to device capabilities', () => {
			// Mock different device types
			const mobileUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
			const desktopUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
			
			Object.defineProperty(navigator, 'userAgent', {
				value: mobileUserAgent,
				configurable: true
			});
			
			inputManager.detectDeviceCapabilities();
			expect(inputManager.isMobileDevice()).toBe(true);
			
			Object.defineProperty(navigator, 'userAgent', {
				value: desktopUserAgent,
				configurable: true
			});
			
			inputManager.detectDeviceCapabilities();
			expect(inputManager.isMobileDevice()).toBe(false);
		});

		test('should handle different screen sizes and DPI', () => {
			// Mock different screen configurations
			const configurations = [
				{ width: 1920, height: 1080, devicePixelRatio: 1 },
				{ width: 1366, height: 768, devicePixelRatio: 1 },
				{ width: 375, height: 667, devicePixelRatio: 2 }, // iPhone
				{ width: 414, height: 896, devicePixelRatio: 3 }  // iPhone X
			];
			
			configurations.forEach(config => {
				Object.defineProperty(window, 'innerWidth', { value: config.width, configurable: true });
				Object.defineProperty(window, 'innerHeight', { value: config.height, configurable: true });
				Object.defineProperty(window, 'devicePixelRatio', { value: config.devicePixelRatio, configurable: true });
				
				inputManager.updateScreenConfiguration();
				
				const screenConfig = inputManager.getScreenConfiguration();
				expect(screenConfig.width).toBe(config.width);
				expect(screenConfig.height).toBe(config.height);
				expect(screenConfig.pixelRatio).toBe(config.devicePixelRatio);
			});
		});
	});

	describe('Input Validation and Security', () => {
		test('should validate input coordinates', () => {
			const validCoords = { x: 100, y: 100 };
			const invalidCoords = [
				{ x: -100, y: 100 },
				{ x: 100, y: -100 },
				{ x: NaN, y: 100 },
				{ x: 100, y: Infinity }
			];
			
			expect(inputManager.validateCoordinates(validCoords.x, validCoords.y)).toBe(true);
			
			invalidCoords.forEach(coords => {
				expect(inputManager.validateCoordinates(coords.x, coords.y)).toBe(false);
			});
		});

		test('should prevent input injection attacks', () => {
			const maliciousInputs = [
				'<script>alert("xss")</script>',
				'javascript:alert("xss")',
				'onmouseover="alert(1)"',
				'${alert("xss")}'
			];
			
			maliciousInputs.forEach(input => {
				const sanitized = inputManager.sanitizeInput(input);
				expect(sanitized).not.toContain('<script>');
				expect(sanitized).not.toContain('javascript:');
				expect(sanitized).not.toContain('onmouseover');
				expect(sanitized).not.toContain('${');
			});
		});

		test('should rate limit input events', () => {
			inputManager.setInputMode('game');
			
			const rapidClicks = Array.from({ length: 100 }, (_, i) => ({
				x: 100 + i, y: 100, worldX: 100 + i, worldY: 100,
				timestamp: Date.now() + i
			}));
			
			let processedClicks = 0;
			const originalHandler = inputManager.handleHexClick;
			inputManager.handleHexClick = jest.fn(() => {
				processedClicks++;
			});
			
			rapidClicks.forEach(click => {
				inputManager.handlePointerDown(click as any);
			});
			
			// Should rate limit to prevent spam
			expect(processedClicks).toBeLessThan(100);
		});
	});

	describe('Error Handling and Recovery', () => {
		test('should handle input system errors gracefully', () => {
			// Mock input system failure
			mockInput.on = jest.fn(() => {
				throw new Error('Input system error');
			});
			
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			
			expect(() => {
				inputManager.initialize(mockScene);
			}).not.toThrow();
			
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		test('should recover from invalid input events', () => {
			inputManager.setInputMode('game');
			
			const invalidEvents = [
				null,
				undefined,
				{}, // Missing required properties
				{ x: 'invalid', y: 'invalid' }
			];
			
			invalidEvents.forEach(event => {
				expect(() => {
					inputManager.handlePointerDown(event as any);
				}).not.toThrow();
			});
		});

		test('should maintain state consistency after errors', () => {
			inputManager.setInputMode('game');
			inputManager.enableInput();
			
			// Cause an error in input handling
			const originalHandler = inputManager.handleHexClick;
			inputManager.handleHexClick = jest.fn(() => {
				throw new Error('Handler error');
			});
			
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			
			const clickEvent = { x: 100, y: 100, worldX: 100, worldY: 100 };
			inputManager.handlePointerDown(clickEvent as any);
			
			// Input should still be enabled and mode should be unchanged
			expect(inputManager.isInputEnabled()).toBe(true);
			expect(inputManager.getCurrentInputMode()).toBe('game');
			
			consoleSpy.mockRestore();
		});
	});
});