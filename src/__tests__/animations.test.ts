import { Animations } from '../animations';
import Game from '../game';

// Mock Phaser 3 objects for testing
const mockScene = {
	anims: {
		exists: jest.fn(() => true),
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
			progress: 0
		}))
	}
};

const mockGame = {
	currentScene: mockScene,
	freezedInput: false,
	animationQueue: [],
	soundsys: {
		playSFX: jest.fn()
	},
	grid: {
		hexes: [[{ displayPos: { x: 100, y: 100 } }]],
		orderCreatureZ: jest.fn()
	},
	multiplayer: false,
	UI: { active: false }
} as any;

const mockCreature = {
	remainingMove: 5,
	travelDist: 0,
	animation: { walk_speed: 500 },
	size: 1,
	x: 0,
	y: 0,
	pos: { x: 0, y: 0 },
	dead: false,
	player: { flipped: false },
	creatureSprite: {
		sprite: {
			x: 50,
			y: 50,
			play: jest.fn(),
			scaleX: 1,
			alpha: 1,
			setVisible: jest.fn()
		},
		getPos: jest.fn(() => ({ x: 50, y: 50 }))
	},
	healthHide: jest.fn(),
	healthShow: jest.fn(),
	cleanHex: jest.fn(),
	updateHex: jest.fn(),
	pickupDrop: jest.fn(),
	hexagons: [{ x: 0, y: 0 }],
	facePlayerDefault: jest.fn(),
	movementType: jest.fn(() => 'normal')
} as any;

describe('Animations', () => {
	let animations: Animations;

	beforeEach(() => {
		animations = new Animations(mockGame);
		jest.clearAllMocks();
	});

	test('should initialize animation definitions', () => {
		expect(mockScene.anims.create).toHaveBeenCalled();
	});

	test('should create animation state for walk', () => {
		const path = [{ x: 1, y: 0, pos: { x: 1, y: 0 } }] as any;
		const opts = {};

		animations.walk(mockCreature, path, opts);

		expect(mockGame.freezedInput).toBe(true);
		expect(mockGame.animationQueue.length).toBeGreaterThan(0);
	});

	test('should clean up animations properly', () => {
		const initialCount = animations.getActiveAnimationCount();
		
		// Create an animation
		const path = [{ x: 1, y: 0, pos: { x: 1, y: 0 } }] as any;
		animations.walk(mockCreature, path, {});
		
		expect(animations.getActiveAnimationCount()).toBeGreaterThan(initialCount);
		
		// Stop all animations
		animations.stopAllAnimations();
		
		expect(animations.getActiveAnimationCount()).toBe(0);
	});

	test('should check if creature has active animations', () => {
		expect(animations.hasActiveAnimations(mockCreature)).toBe(false);
		
		const path = [{ x: 1, y: 0, pos: { x: 1, y: 0 } }] as any;
		animations.walk(mockCreature, path, {});
		
		expect(animations.hasActiveAnimations(mockCreature)).toBe(true);
	});
});