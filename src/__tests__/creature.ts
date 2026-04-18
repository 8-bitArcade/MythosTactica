import { Creature } from '../models/Creature';
import { jest, expect, describe, test, beforeEach, beforeAll } from '@jest/globals';

// NOTE: ts-comments are necessary in this file to avoid mocking the entire game.
/* eslint-disable @typescript-eslint/ban-ts-comment */

describe('Creature', () => {
	describe('creature.id', () => {
		let game: Game;
		// @ts-ignore
		beforeEach(() => (game = getGameMock()));

		test('"materialized" creatures are automatically assigned separate ids', () => {
			// @ts-ignore
			const creature0 = new Creature(getCreatureObjMock(), game);
			// @ts-ignore
			const creature1 = new Creature(getCreatureObjMock(), game);
			expect(creature0).toBeDefined();
			expect(creature1).toBeDefined();
			expect(creature0.id).not.toBe(creature1.id);
			expect(game.creatureManager.creatures.length).toBe(2);
		});

		test('a "materialized" (not temp) creature will reuse an existing, matching "unmaterialized" creature id', () => {
			const obj = getCreatureObjMock();
			obj.temp = true;
			// @ts-ignore
			const creatureTemp = new Creature(obj, game);
			obj.temp = false;
			// @ts-ignore
			const creatureNotTemp = new Creature(obj, game);
			expect(creatureTemp.id).toBe(creatureNotTemp.id);
		});
	});

	describe('game.creatureManager.creatures', () => {
		test('a "materialized" creature will replace a matching "unmaterialized" creature in game.creatureManager.creatures', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			obj.temp = true;
			// @ts-ignore
			const creatureTemp = new Creature(obj, game);
			expect(game.creatures.length).toBe(1);
			expect(game.creatures.filter((c) => c)[0]).toStrictEqual(creatureTemp);

			obj.temp = false;
			// @ts-ignore
			const creatureNotTemp = new Creature(obj, game);
			expect(game.creatures.length).toBe(1);
			expect(game.creatures.filter((c) => c)[0]).not.toStrictEqual(creatureTemp);
			expect(game.creatures.filter((c) => c)[0]).toStrictEqual(creatureNotTemp);
		});
	});

	describe('Creature materializes in which queue?', () => {
		test('a new Creature normally materializes in next queue, not current', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			expect(creature.isInCurrentQueue).toBe(false);
			expect(creature.isInNextQueue).toBe(true);
		});
		test('a new Priest materializes in current queue', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			obj.type = '--';
			// @ts-ignore
			const creature = new Creature(obj, game);
			expect(creature.isDarkPriest()).toBe(true);
			expect(creature.isInCurrentQueue).toBe(true);
			expect(creature.isInNextQueue).toBe(true);
		});
		test('a creature without materialization sickness materializes in current queue', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			obj.materializationSickness = false;
			// @ts-ignore
			const creature = new Creature(obj, game);
			expect(creature.isDarkPriest()).toBe(false);
			expect(creature.isInCurrentQueue).toBe(true);
			expect(creature.isInNextQueue).toBe(true);
		});
	});

	describe('creature.canWait()', () => {
		test('a new Creature can wait', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			creature.activate();
			expect(creature.canWait).toBe(true);
		});
		test('a waiting Creature cannot wait', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			creature.activate();
			creature.wait();
			expect(creature.canWait).toBe(false);
		});
		test('a hindered Creature cannot wait', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			creature.activate();
			creature.hinder();
			expect(creature.canWait).toBe(false);
		});
	});

	describe('creature.wait()', () => {
		test('a creature that has waited is delayed', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			creature.activate();
			expect(creature.isDelayed).toBe(false);
			expect(creature.canWait).toBe(true);
			creature.wait();
			expect(creature.isDelayed).toBe(true);
		});
		test('when a round is over, a waited creature is no longer delayed', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			creature.activate();
			expect(creature.isDelayed).toBe(false);
			expect(creature.canWait).toBe(true);
			creature.wait();
			expect(creature.isWaiting).toBe(true);
			creature.deactivate('turn-end');
			expect(creature.isDelayed).toBe(false);
		});
	});

	describe('creature.hinder()', () => {
		test('a hindered creature is delayed', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			expect(creature.isHindered).toBe(false);
			expect(creature.isDelayed).toBe(false);
			creature.hinder();
			expect(creature.isHindered).toBe(true);
			expect(creature.isDelayed).toBe(true);
		});
		test('a creature can be hindered', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			expect(creature.isHindered).toBe(false);
			creature.hinder();
			expect(creature.isHindered).toBe(true);
		});
		test('a creature whose turn is over, who is then hindered, will be delayed the next round', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			creature.displayHealthStats = () => undefined;

			creature.activate();
			creature.deactivate('turn-end');
			expect(creature.isHindered).toBe(false);
			creature.hinder();
			expect(creature.isHindered).toBe(true);
			creature.activate();
			expect(creature.isHindered).toBe(true);
			creature.deactivate('turn-end');
			expect(creature.isHindered).toBe(false);
		});
		test('a creature whose turn is not over, who is then hindered, will not be delayed the next round from that hinder()', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			expect(creature.isWaiting).toBe(false);
			expect(creature.isDelayed).toBe(false);
			creature.hinder();
			expect(creature.isWaiting).toBe(false);
			expect(creature.isHindered).toBe(true);
			expect(creature.isDelayed).toBe(true);
			creature.activate();
			creature.deactivate('turn-end');
			expect(creature.isWaiting).toBe(false);
			expect(creature.isHindered).toBe(false);
			expect(creature.isDelayed).toBe(false);
		});
	});
});

jest.mock('../models/Ability');
jest.mock('../utility/hex', () => {
	return {
		default: () => {
			// Do nothing
		},
	};
});

const getPlayerMock = () => {
	return {};
};

const getRandomString = (length: number) => {
	return Array(length + 1)
		.join((Math.random().toString(36) + '00000000000000000').slice(2, 18))
		.slice(0, length);
};

const getCreatureObjMock = () => {
	return {
		stats: {
			health: 10,
			movement: 10,
		},
		temp: false,
		team: 0,
		materializationSickness: true,
		type: getRandomString(5),
		display: {
			'offset-x': true,
		},
		size: 2,
		x: 4,
		y: 4,
	};
};

const getHexesMock = () => {
	const arr = [];
	for (let y = 0; y < 100; y++) {
		const row = [];
		for (let x = 0; x < 100; x++) {
			row.push({
				displayPos: { x, y },
				creature: 0,
				display: { setTexture: jest.fn() },
				overlay: { setTexture: jest.fn() },
			});
		}
		arr.push(row);
	}
	return arr;
};

import { unitData } from '../data/UnitData';
import Game from '../game';

const getGameMock = () => {
	const creatureManager: { creatures: unknown[] } = { creatures: [] };
	const players = [getPlayerMock(), getPlayerMock()];
	const scene = getSceneMock();
	const self = {
		turn: 0,
		get creatures() {
			return creatureManager.creatures;
		},
		creatureManager,
		players,
		playerManager: { players },
		queue: { update: jest.fn() },
		updateQueueDisplay: jest.fn(),
		grid: {
			orderCreatureZ: jest.fn(),
			hexes: getHexesMock(),
			creatureGroup: getContainerMock(),
		},
		Phaser: { scene: { getScene: () => scene } },
		currentScene: scene,
		retrieveCreatureStats: (type: number) => {
			for (const d of unitData) {
				if (d.id === type) {
					return d;
				}
			}
			return {};
		},
		abilities: jest.fn(),
		signals: {
			metaPowers: {
				add: jest.fn(),
			},
			creature: { dispatch: jest.fn() },
		},
		plasma_amount: 10,
		trapManager: { onReset: jest.fn() },
		effectManager: { triggerEffect: jest.fn() },
		gameManager: {
			onStartPhase: jest.fn(),
			onEndPhase: jest.fn(),
			onReset: jest.fn(),
			onHeal: jest.fn(),
			updateQueueDisplay: jest.fn(),
			log: jest.fn(),
		},
		onReset: jest.fn(),
		onStartPhase: jest.fn(),
		onEndPhase: jest.fn(),
		log: jest.fn(),
		onHeal: jest.fn(),
		UI: { updateFatigue: jest.fn() },
	};
	return self;
};

const getContainerMock = () => {
	const children: unknown[] = [];
	const container = {
		x: 0,
		y: 0,
		list: children,
		setAlpha: jest.fn(() => container),
		setVisible: jest.fn(() => container),
		setPosition: jest.fn((x: number, y: number) => {
			container.x = x;
			container.y = y;
			return container;
		}),
		add: jest.fn((child: unknown | unknown[]) => {
			if (Array.isArray(child)) children.push(...child);
			else children.push(child);
			return container;
		}),
		remove: jest.fn(() => container),
		each: jest.fn((cb: (child: unknown) => void) => {
			children.forEach(cb);
			return container;
		}),
		getAll: jest.fn(() => children.slice()),
	};
	return container;
};

const getSpriteMock = () => {
	const data: Record<string, unknown> = {};
	const sprite = {
		x: 0,
		y: 0,
		width: 10,
		height: 10,
		displayWidth: 10,
		displayHeight: 10,
		alpha: 1,
		setOrigin: jest.fn(() => sprite),
		setScale: jest.fn(() => sprite),
		setTexture: jest.fn(() => sprite),
		setVisible: jest.fn(() => sprite),
		setAlpha: jest.fn((v: number) => {
			sprite.alpha = v;
			return sprite;
		}),
		setData: jest.fn((k: string, v: unknown) => {
			data[k] = v;
			return sprite;
		}),
		getData: jest.fn((k: string) => data[k]),
		setTint: jest.fn(() => sprite),
		clearTint: jest.fn(() => sprite),
		destroy: jest.fn(),
	};
	return sprite;
};

const getTextMock = () => {
	const data: Record<string, unknown> = {};
	const text = {
		x: 0,
		y: 0,
		alpha: 1,
		setOrigin: jest.fn(() => text),
		setText: jest.fn(() => text),
		setVisible: jest.fn(() => text),
		setAlpha: jest.fn((v: number) => {
			text.alpha = v;
			return text;
		}),
		setData: jest.fn((k: string, v: unknown) => {
			data[k] = v;
			return text;
		}),
		getData: jest.fn((k: string) => data[k]),
		destroy: jest.fn(),
	};
	return text;
};

const getSceneMock = () => {
	return {
		add: {
			container: jest.fn(() => getContainerMock()),
			sprite: jest.fn(() => getSpriteMock()),
			text: jest.fn(() => getTextMock()),
		},
		tweens: {
			add: jest.fn((cfg: { onComplete?: () => void }) => {
				if (cfg.onComplete) cfg.onComplete();
				return { play: jest.fn(), on: jest.fn(), stop: jest.fn(), remove: jest.fn() };
			}),
		},
		cameras: { main: { shake: jest.fn() } },
	};
};

beforeAll(() => {
	Object.defineProperty(window, 'Phaser', {
		get() {
			return { Easing: { Linear: { None: 1 } } };
		},
	});
});
