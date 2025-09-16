/**
 * Integration tests for game loop functionality
 * Tests phaserUpdate() and phaserRender() methods and their integration with game systems
 */

import Game from '../game';
import { unitData } from '../data/UnitData';

// Mock Phaser 3 for testing
const mockPhaserGame = {
	scene: {
		getScene: jest.fn(() => mockScene),
		start: jest.fn()
	},
	events: {
		on: jest.fn()
	}
};

const mockScene = {
	scene: { key: 'MatchScene' },
	cameras: {
		main: {
			shake: jest.fn()
		}
	},
	tweens: {
		add: jest.fn(() => ({
			play: jest.fn(),
			on: jest.fn()
		}))
	},
	input: {
		on: jest.fn(),
		keyboard: {
			createCursorKeys: jest.fn(() => ({})),
			addKey: jest.fn(() => ({ isDown: false }))
		}
	}
};

// Mock global Phaser
global.Phaser = {
	Game: jest.fn(() => mockPhaserGame),
	AUTO: 'AUTO',
	Scale: {
		FIT: 'FIT',
		CENTER_BOTH: 'CENTER_BOTH'
	},
	Events: {
		EventEmitter: jest.fn(() => ({
			on: jest.fn(),
			emit: jest.fn(),
			off: jest.fn(),
			removeAllListeners: jest.fn()
		}))
	}
} as any;

describe('Game Loop Integration Tests', () => {
	let game: Game;
	let mockCreature: any;

	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks();
		
		// Create game instance
		game = new Game();
		game.currentScene = mockScene;
		
		// Mock creature for testing
		mockCreature = {
			id: 1,
			dead: false,
			abilities: [
				{ testRequirements: jest.fn() },
				{ testRequirements: jest.fn() },
				{ testRequirements: jest.fn() },
				{ testRequirements: jest.fn() }
			],
			effects: [
				{
					trigger: 'onStartOfRound',
					activate: jest.fn()
				}
			],
			updateAlteration: jest.fn(),
			updateHealth: jest.fn()
		};
		
		// Set up game state
		game.gameState = 'playing';
		game.creatureManager.creatures[1] = mockCreature;
		game.playerManager.activeCreature = mockCreature;
	});

	describe('phaserUpdate() method', () => {
		test('should not update when game state is not playing', () => {
			game.gameState = 'loading';
			
			game.phaserUpdate();
			
			expect(mockCreature.abilities[0].testRequirements).not.toHaveBeenCalled();
		});

		test('should update active creature abilities when playing', () => {
			game.phaserUpdate();
			
			expect(mockCreature.abilities[0].testRequirements).toHaveBeenCalled();
			expect(mockCreature.abilities[1].testRequirements).toHaveBeenCalled();
			expect(mockCreature.abilities[2].testRequirements).toHaveBeenCalled();
			expect(mockCreature.abilities[3].testRequirements).toHaveBeenCalled();
		});

		test('should not update dead creatures', () => {
			mockCreature.dead = true;
			
			game.phaserUpdate();
			
			expect(mockCreature.abilities[0].testRequirements).not.toHaveBeenCalled();
		});

		test('should update creature alterations', () => {
			game.phaserUpdate();
			
			expect(mockCreature.updateAlteration).toHaveBeenCalled();
		});

		test('should activate creature effects with correct triggers', () => {
			game.phaserUpdate();
			
			expect(mockCreature.effects[0].activate).toHaveBeenCalled();
		});

		test('should handle turn transition when turnThrottle is active', () => {
			game.turnThrottle = true;
			mockCreature.dead = true;
			game.gameManager.nextCreature = jest.fn();
			
			game.phaserUpdate();
			
			expect(game.gameManager.nextCreature).toHaveBeenCalled();
			expect(game.turnThrottle).toBe(false);
		});

		test('should handle errors gracefully', () => {
			mockCreature.abilities[0].testRequirements = jest.fn(() => {
				throw new Error('Test error');
			});
			
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			
			expect(() => game.phaserUpdate()).not.toThrow();
			expect(consoleSpy).toHaveBeenCalledWith('[Game] Error in phaserUpdate:', expect.any(Error));
			
			consoleSpy.mockRestore();
		});

		test('should process global effects', () => {
			const globalEffect = {
				trigger: 'onStartOfRound',
				activate: jest.fn()
			};
			game.effects.push(globalEffect);
			
			game.phaserUpdate();
			
			expect(globalEffect.activate).toHaveBeenCalled();
		});

		test('should trigger effect manager cleanup', () => {
			game.effectManager.triggerDeleteEffect = jest.fn();
			
			game.phaserUpdate();
			
			expect(game.effectManager.triggerDeleteEffect).toHaveBeenCalledWith('onStartOfRound', 'all');
		});
	});

	describe('phaserRender() method', () => {
		test('should not render when game state is not playing', () => {
			game.gameState = 'loading';
			
			game.phaserRender();
			
			expect(mockCreature.updateHealth).not.toHaveBeenCalled();
		});

		test('should update creature health displays', () => {
			game.phaserRender();
			
			expect(mockCreature.updateHealth).toHaveBeenCalledWith(true);
		});

		test('should not update dead creatures', () => {
			mockCreature.dead = true;
			
			game.phaserRender();
			
			expect(mockCreature.updateHealth).not.toHaveBeenCalled();
		});

		test('should update UI elements', () => {
			game.UI = {
				updateTimer: jest.fn(),
				updateQueueDisplay: jest.fn(),
				updateActivebox: jest.fn(),
				updateFatigue: jest.fn()
			} as any;
			
			game.phaserRender();
			
			expect(game.UI.updateTimer).toHaveBeenCalled();
			expect(game.UI.updateQueueDisplay).toHaveBeenCalled();
			expect(game.UI.updateActivebox).toHaveBeenCalled();
			expect(game.UI.updateFatigue).toHaveBeenCalled();
		});

		test('should update grid display', () => {
			game.grid = {
				updateDisplay: jest.fn()
			} as any;
			
			game.phaserRender();
			
			expect(game.grid.updateDisplay).toHaveBeenCalled();
		});

		test('should handle errors gracefully', () => {
			mockCreature.updateHealth = jest.fn(() => {
				throw new Error('Render error');
			});
			
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			
			expect(() => game.phaserRender()).not.toThrow();
			expect(consoleSpy).toHaveBeenCalledWith('[Game] Error in phaserRender:', expect.any(Error));
			
			consoleSpy.mockRestore();
		});
	});

	describe('Game Loop Integration', () => {
		test('should coordinate update and render cycles', () => {
			game.UI = {
				updateTimer: jest.fn(),
				updateQueueDisplay: jest.fn(),
				updateActivebox: jest.fn(),
				updateFatigue: jest.fn()
			} as any;
			
			// Simulate game loop cycle
			game.phaserUpdate();
			game.phaserRender();
			
			// Verify update cycle ran
			expect(mockCreature.abilities[0].testRequirements).toHaveBeenCalled();
			expect(mockCreature.updateAlteration).toHaveBeenCalled();
			
			// Verify render cycle ran
			expect(mockCreature.updateHealth).toHaveBeenCalledWith(true);
			expect(game.UI.updateTimer).toHaveBeenCalled();
		});

		test('should handle state transitions correctly', () => {
			// Start in loading state
			game.gameState = 'loading';
			game.phaserUpdate();
			game.phaserRender();
			
			expect(mockCreature.abilities[0].testRequirements).not.toHaveBeenCalled();
			expect(mockCreature.updateHealth).not.toHaveBeenCalled();
			
			// Transition to playing state
			game.gameState = 'playing';
			game.phaserUpdate();
			game.phaserRender();
			
			expect(mockCreature.abilities[0].testRequirements).toHaveBeenCalled();
			expect(mockCreature.updateHealth).toHaveBeenCalledWith(true);
		});

		test('should maintain performance with multiple creatures', () => {
			// Add multiple creatures
			for (let i = 2; i <= 10; i++) {
				const creature = {
					id: i,
					dead: false,
					abilities: [
						{ testRequirements: jest.fn() },
						{ testRequirements: jest.fn() },
						{ testRequirements: jest.fn() },
						{ testRequirements: jest.fn() }
					],
					effects: [],
					updateAlteration: jest.fn(),
					updateHealth: jest.fn()
				};
				game.creatureManager.creatures[i] = creature;
			}
			
			const startTime = performance.now();
			game.phaserUpdate();
			game.phaserRender();
			const endTime = performance.now();
			
			// Should complete within reasonable time (less than 16ms for 60fps)
			expect(endTime - startTime).toBeLessThan(16);
		});
	});

	describe('Error Recovery', () => {
		test('should recover from update errors and continue rendering', () => {
			mockCreature.updateAlteration = jest.fn(() => {
				throw new Error('Update error');
			});
			
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			
			game.phaserUpdate();
			game.phaserRender();
			
			// Update should have failed but render should still work
			expect(consoleSpy).toHaveBeenCalledWith('[Game] Error in phaserUpdate:', expect.any(Error));
			expect(mockCreature.updateHealth).toHaveBeenCalled();
			
			consoleSpy.mockRestore();
		});

		test('should handle missing game systems gracefully', () => {
			// Remove game systems
			game.playerManager = null;
			game.creatureManager = null;
			game.effectManager = null;
			
			expect(() => {
				game.phaserUpdate();
				game.phaserRender();
			}).not.toThrow();
		});
	});
});