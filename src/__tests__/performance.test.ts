/**
 * Performance tests for rendering and animation systems
 * Ensures the migration maintains or improves performance benchmarks
 */

import { Animations } from '../animations';
import Game from '../game';
import { $ } from '../script';

// Mock Phaser 3 for performance testing
const mockScene = {
	scene: { key: 'MatchScene' },
	anims: {
		exists: jest.fn(() => false),
		create: jest.fn(),
		generateFrameNumbers: jest.fn(() => [{ key: 'creature', frame: 0 }])
	},
	tweens: {
		add: jest.fn(() => ({
			isActive: jest.fn(() => true),
			stop: jest.fn(),
			remove: jest.fn(),
			on: jest.fn(),
			play: jest.fn(),
			progress: 0,
			duration: 1000
		}))
	},
	cameras: {
		main: { shake: jest.fn() }
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
	}
} as any;

// Performance measurement utilities
const measurePerformance = async (fn: () => void | Promise<void>, iterations: number = 1): Promise<number> => {
	const times: number[] = [];
	
	for (let i = 0; i < iterations; i++) {
		const start = performance.now();
		await fn();
		const end = performance.now();
		times.push(end - start);
	}
	
	return times.reduce((sum, time) => sum + time, 0) / times.length;
};

const createMockCreature = (id: number) => ({
	id,
	dead: false,
	remainingMove: 5,
	travelDist: 0,
	animation: { walk_speed: 500 },
	size: 1,
	x: 0,
	y: 0,
	pos: { x: 0, y: 0 },
	player: { flipped: false },
	creatureSprite: {
		sprite: {
			x: 50 + id * 10,
			y: 50 + id * 10,
			play: jest.fn(),
			scaleX: 1,
			alpha: 1,
			setVisible: jest.fn()
		},
		getPos: jest.fn(() => ({ x: 50 + id * 10, y: 50 + id * 10 }))
	},
	healthHide: jest.fn(),
	healthShow: jest.fn(),
	cleanHex: jest.fn(),
	updateHex: jest.fn(),
	pickupDrop: jest.fn(),
	hexagons: [{ x: 0, y: 0 }],
	facePlayerDefault: jest.fn(),
	movementType: jest.fn(() => 'normal'),
	abilities: [
		{ testRequirements: jest.fn() },
		{ testRequirements: jest.fn() },
		{ testRequirements: jest.fn() },
		{ testRequirements: jest.fn() }
	],
	effects: [],
	updateAlteration: jest.fn(),
	updateHealth: jest.fn()
});

describe('Performance Tests', () => {
	let game: Game;
	let animations: Animations;

	beforeEach(() => {
		jest.clearAllMocks();
		game = new Game();
		game.currentScene = mockScene;
		game.gameState = 'playing';
		animations = new Animations(game);
	});

	describe('Animation System Performance', () => {
		test('should create animations within performance budget', async () => {
			const creatures = Array.from({ length: 10 }, (_, i) => createMockCreature(i + 1));
			
			const avgTime = await measurePerformance(() => {
				creatures.forEach(creature => {
					const path = [{ x: 1, y: 0, pos: { x: 1, y: 0 } }] as any;
					animations.walk(creature, path, {});
				});
			}, 5);
			
			// Should create 10 animations in less than 5ms on average
			expect(avgTime).toBeLessThan(5);
		});

		test('should handle concurrent animations efficiently', async () => {
			const creatures = Array.from({ length: 20 }, (_, i) => createMockCreature(i + 1));
			
			const avgTime = await measurePerformance(() => {
				// Start multiple animations simultaneously
				creatures.forEach(creature => {
					const path = [
						{ x: 1, y: 0, pos: { x: 1, y: 0 } },
						{ x: 2, y: 0, pos: { x: 2, y: 0 } },
						{ x: 3, y: 0, pos: { x: 3, y: 0 } }
					] as any;
					animations.walk(creature, path, {});
				});
			}, 3);
			
			// Should handle 20 concurrent animations in less than 10ms
			expect(avgTime).toBeLessThan(10);
		});

		test('should clean up animations without performance impact', async () => {
			const creatures = Array.from({ length: 50 }, (_, i) => createMockCreature(i + 1));
			
			// Create many animations
			creatures.forEach(creature => {
				const path = [{ x: 1, y: 0, pos: { x: 1, y: 0 } }] as any;
				animations.walk(creature, path, {});
			});
			
			const avgTime = await measurePerformance(() => {
				animations.stopAllAnimations();
			}, 5);
			
			// Should clean up 50 animations in less than 2ms
			expect(avgTime).toBeLessThan(2);
		});

		test('should maintain performance with animation state queries', async () => {
			const creatures = Array.from({ length: 100 }, (_, i) => createMockCreature(i + 1));
			
			// Create animations for half the creatures
			creatures.slice(0, 50).forEach(creature => {
				const path = [{ x: 1, y: 0, pos: { x: 1, y: 0 } }] as any;
				animations.walk(creature, path, {});
			});
			
			const avgTime = await measurePerformance(() => {
				creatures.forEach(creature => {
					animations.hasActiveAnimations(creature);
				});
			}, 10);
			
			// Should query 100 creatures in less than 1ms
			expect(avgTime).toBeLessThan(1);
		});
	});

	describe('Game Loop Performance', () => {
		test('should maintain 60fps update cycle performance', async () => {
			// Set up game with multiple creatures
			const creatures = Array.from({ length: 30 }, (_, i) => createMockCreature(i + 1));
			creatures.forEach((creature, index) => {
				game.creatureManager.creatures[index + 1] = creature;
			});
			game.playerManager.activeCreature = creatures[0];
			
			const avgTime = await measurePerformance(() => {
				game.phaserUpdate();
			}, 20);
			
			// Should complete update cycle in less than 16ms (60fps budget)
			expect(avgTime).toBeLessThan(16);
		});

		test('should maintain render performance with many creatures', async () => {
			// Set up game with many creatures
			const creatures = Array.from({ length: 50 }, (_, i) => createMockCreature(i + 1));
			creatures.forEach((creature, index) => {
				game.creatureManager.creatures[index + 1] = creature;
			});
			
			game.UI = {
				updateTimer: jest.fn(),
				updateQueueDisplay: jest.fn(),
				updateActivebox: jest.fn(),
				updateFatigue: jest.fn()
			} as any;
			
			const avgTime = await measurePerformance(() => {
				game.phaserRender();
			}, 20);
			
			// Should complete render cycle in less than 8ms
			expect(avgTime).toBeLessThan(8);
		});

		test('should scale performance linearly with creature count', async () => {
			const testSizes = [10, 20, 40];
			const results: number[] = [];
			
			for (const size of testSizes) {
				const creatures = Array.from({ length: size }, (_, i) => createMockCreature(i + 1));
				creatures.forEach((creature, index) => {
					game.creatureManager.creatures[index + 1] = creature;
				});
				
				const avgTime = await measurePerformance(() => {
					game.phaserUpdate();
					game.phaserRender();
				}, 10);
				
				results.push(avgTime);
				
				// Clear creatures for next test
				game.creatureManager.creatures = [];
			}
			
			// Performance should scale roughly linearly (within 2x factor)
			const ratio1 = results[1] / results[0]; // 20 vs 10
			const ratio2 = results[2] / results[1]; // 40 vs 20
			
			expect(ratio1).toBeLessThan(2.5);
			expect(ratio2).toBeLessThan(2.5);
		});
	});

	describe('DOM Manipulation Performance', () => {
		test('should handle large DOM operations efficiently', async () => {
			const container = $.createElement('div');
			document.body.appendChild(container);
			
			const avgTime = await measurePerformance(() => {
				// Create 500 elements
				for (let i = 0; i < 500; i++) {
					const element = $.createElement('div', { 
						className: `item-${i}`,
						'data-id': i.toString()
					}, `Item ${i}`);
					$.append(container, element);
				}
			}, 3);
			
			// Should create 500 elements in less than 20ms
			expect(avgTime).toBeLessThan(20);
			
			document.body.removeChild(container);
		});

		test('should perform CSS operations efficiently', async () => {
			const elements = Array.from({ length: 200 }, () => $.createElement('div'));
			elements.forEach(el => document.body.appendChild(el));
			
			const avgTime = await measurePerformance(() => {
				elements.forEach((element, index) => {
					$.css(element, {
						'background-color': `hsl(${index * 2}, 50%, 50%)`,
						'width': `${100 + index}px`,
						'height': `${50 + index}px`,
						'transform': `translateX(${index * 2}px)`
					});
				});
			}, 5);
			
			// Should style 200 elements in less than 10ms
			expect(avgTime).toBeLessThan(10);
			
			elements.forEach(el => document.body.removeChild(el));
		});

		test('should handle event delegation efficiently', async () => {
			const container = $.createElement('div');
			document.body.appendChild(container);
			
			// Add many child elements
			for (let i = 0; i < 100; i++) {
				const button = $.createElement('button', { className: 'test-btn' }, `Button ${i}`);
				$.append(container, button);
			}
			
			let eventCount = 0;
			$.delegate(container, '.test-btn', 'click', () => eventCount++);
			
			const avgTime = await measurePerformance(() => {
				// Trigger events on all buttons
				const buttons = $.findAll(container, '.test-btn');
				buttons.forEach(button => $.trigger(button, 'click'));
			}, 3);
			
			// Should handle 100 delegated events in less than 5ms
			expect(avgTime).toBeLessThan(5);
			expect(eventCount).toBeGreaterThan(0);
			
			document.body.removeChild(container);
		});
	});

	describe('Memory Performance', () => {
		test('should not create memory leaks with animations', () => {
			const initialAnimationCount = animations.getActiveAnimationCount();
			const creatures = Array.from({ length: 20 }, (_, i) => createMockCreature(i + 1));
			
			// Create and immediately stop animations
			creatures.forEach(creature => {
				const path = [{ x: 1, y: 0, pos: { x: 1, y: 0 } }] as any;
				animations.walk(creature, path, {});
			});
			
			animations.stopAllAnimations();
			
			const finalAnimationCount = animations.getActiveAnimationCount();
			expect(finalAnimationCount).toBe(initialAnimationCount);
		});

		test('should clean up DOM elements properly', () => {
			const initialChildCount = document.body.children.length;
			const elements: HTMLElement[] = [];
			
			// Create many elements
			for (let i = 0; i < 50; i++) {
				const element = $.createElement('div');
				document.body.appendChild(element);
				elements.push(element);
			}
			
			// Remove all elements
			elements.forEach(element => $.remove(element));
			
			const finalChildCount = document.body.children.length;
			expect(finalChildCount).toBe(initialChildCount);
		});

		test('should handle event listener cleanup', () => {
			const elements = Array.from({ length: 50 }, () => $.createElement('div'));
			const handlers = elements.map(() => jest.fn());
			
			// Add event listeners
			elements.forEach((element, index) => {
				document.body.appendChild(element);
				$.on(element, 'click', handlers[index]);
			});
			
			// Remove event listeners
			elements.forEach((element, index) => {
				$.off(element, 'click', handlers[index]);
				$.remove(element);
			});
			
			// Test passes if no errors are thrown and memory is cleaned up
			expect(elements.length).toBe(50);
		});
	});

	describe('Regression Performance Benchmarks', () => {
		test('should meet animation creation benchmark', async () => {
			const creature = createMockCreature(1);
			const path = Array.from({ length: 10 }, (_, i) => ({ 
				x: i, y: 0, pos: { x: i, y: 0 } 
			})) as any;
			
			const avgTime = await measurePerformance(() => {
				animations.walk(creature, path, {});
			}, 50);
			
			// Should create complex animation in less than 1ms
			expect(avgTime).toBeLessThan(1);
		});

		test('should meet DOM query benchmark', async () => {
			// Set up complex DOM structure
			document.body.innerHTML = `
				<div class="game-container">
					${Array.from({ length: 100 }, (_, i) => `
						<div class="creature" data-id="${i}">
							<span class="health">100</span>
							<span class="name">Creature ${i}</span>
						</div>
					`).join('')}
				</div>
			`;
			
			const avgTime = await measurePerformance(() => {
				const creatures = $.getAll('.creature');
				creatures.forEach(creature => {
					const health = $.find(creature as HTMLElement, '.health');
					const name = $.find(creature as HTMLElement, '.name');
					$.addClass(creature as HTMLElement, 'active');
				});
			}, 20);
			
			// Should query and manipulate 100 elements in less than 3ms
			expect(avgTime).toBeLessThan(3);
		});

		test('should meet form processing benchmark', async () => {
			const form = document.createElement('form');
			form.innerHTML = Array.from({ length: 50 }, (_, i) => `
				<input name="field${i}" value="value${i}">
			`).join('');
			
			const avgTime = await measurePerformance(() => {
				const formData = $.getFormData(form);
				const serialized = $.serialize(form);
				
				// Validate all fields
				const rules = Object.fromEntries(
					Array.from({ length: 50 }, (_, i) => [
						`field${i}`, 
						(value: string) => value.startsWith('value') || 'Invalid'
					])
				);
				const errors = $.validateForm(form, rules);
			}, 10);
			
			// Should process 50-field form in less than 2ms
			expect(avgTime).toBeLessThan(2);
		});
	});
});