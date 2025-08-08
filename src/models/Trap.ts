import Game from '../game';
import { Effect } from './Effect';
import { Hex } from '../utility/hex';
import { Player } from './Player';
import { Creature } from '../models/Creature';
import { capitalize } from '../utility/string';
import { getPointFacade } from '../utility/pointfacade';
import { HEX_WIDTH_PX, offsetCoordsToPx } from '../utility/const';

export type DestroyAnimationType = 'shrinkDown' | 'none';

export type TrapOptions = Partial<Trap>;

/**
 * Represents a trap placed on the game board that can apply effects to creatures or hexes.
 * Traps can have a lifetime, owner, effects, and visual representation.
 */
export class Trap {
	/** Unique identifier for the trap. */
	id: number;
	/** X coordinate on the board. */
	x: number;
	/** Y coordinate on the board. */
	y: number;
	/** Reference to the game instance. */
	game: Game;
	/** Trap type string. */
	type: string;
	/** Display name of the trap. */
	name: string;
	/** Effects applied by this trap. */
	effects: Effect[];
	/** Player who owns the trap. */
	owner: Player;
	/** Turn number when the trap was created. */
	creationTurn: number;
	/** Number of turns the trap lasts. */
	turnLifetime: number = 0;
	/** If true, trap lasts a full turn. */
	fullTurnLifetime: boolean = false;
	/** Creature that owns the trap, if any. */
	ownerCreature: Creature | undefined = undefined;
	/** If true, trap is destroyed when activated. */
	destroyOnActivate: boolean = false;
	/** If true, trap has a type overlay. */
	typeOver: boolean = false;
	/** Animation type for destroying the trap. */
	destroyAnimation: DestroyAnimationType = 'none';
	/** Main display sprite. */
	display: Phaser.GameObjects.Sprite;
	/** Overlay display sprite. */
	displayOver: Phaser.GameObjects.Sprite;

	/**
	 * Create a new Trap instance.
	 * @param x X coordinate
	 * @param y Y coordinate
	 * @param type Trap type string
	 * @param effects Array of effects
	 * @param owner Player who owns the trap
	 * @param opt Optional trap options
	 * @param game Game instance
	 * @param name Optional display name
	 */
	constructor(
		x: number,
		y: number,
		type: string,
		effects: Effect[],
		owner: Player,
		opt: TrapOptions | undefined,
		game: Game,
		name = '',
	) {
		this.game = game;
		this.type = type;
		this.x = x;
		this.y = y;
		this.name = name || capitalize(type.split('-').join(' '));
		this.effects = effects;
		this.owner = owner;
		this.creationTurn = game.turn;

		if (opt) {
			for (const key of Object.keys(opt)) {
				if (key in this) {
					this[key] = opt[key];
				}
			}
		}

		this.id = game.trapId++;

		// NOTE: Destroy any traps here.
		getPointFacade()
			.getTrapsAt(this)
			.forEach((trap) => trap.destroy());
		game.playerManager.traps.push(this);

		for (let i = this.effects.length - 1; i >= 0; i--) {
			this.effects[i].trap = this;
		}

		const spriteName = 'trap_' + type;
		const px = offsetCoordsToPx(this);
		// Phaser 3: create sprite and add to group
		this.display = game.grid.trapGroup.scene.add.sprite(
			px.x + HEX_WIDTH_PX / 2,
			px.y + 60,
			spriteName
		);
		this.display.setOrigin(0.5);
		game.grid.trapGroup.add(this.display);

		if (this.typeOver) {
			this.displayOver = game.grid.trapOverGroup.scene.add.sprite(
				px.x + HEX_WIDTH_PX / 2,
				px.y + 60,
				spriteName
			);
			this.displayOver.setOrigin(0.5);
			this.displayOver.scaleX *= -1;
			game.grid.trapOverGroup.add(this.displayOver);
		}
	}

	/**
	 * Get the hex this trap is on.
	 * @deprecated Use this.game.hexAt(x, y)
	 */
	get hex(): Hex {
		return this.game.gameManager.hexAt(this.x, this.y);
	}

	/**
	 * Activate the trap's effects if the trigger matches.
	 * @param trigger Regular expression to match effect triggers
	 * @param target Creature or Hex to apply effects to
	 */
	activate(trigger: RegExp, target: Creature | Hex) {
		this.effects.forEach((effect) => {
			if (trigger.test(effect.trigger) && effect.requireFn()) {
				this.game.gameManager.log('Trap triggered');
				effect.activate(target);
			}
		});

		if (this.destroyOnActivate) {
			this.destroy();
		}
	}

	/**
	 * Destroy the trap and remove it from the game.
	 */
	destroy() {
		const game = this.game;
		const tweenDuration = 500;
		const destroySprite = (sprite: Phaser.GameObjects.Sprite, animation: string) => {
			if (animation === 'shrinkDown') {
				sprite.setOrigin(sprite.originX, 1);
				sprite.y += sprite.height / 2;
				game.createTween(
					sprite.scale,
					{ y: 0 },
					tweenDuration,
					undefined,
					true
				).onComplete.add(() => sprite.destroy());
			} else {
				sprite.destroy();
			}
		};

		destroySprite(this.display, this.destroyAnimation);
		if (this.displayOver) {
			destroySprite(this.displayOver, this.destroyAnimation);
		}

		game.playerManager.traps = game.playerManager.traps.filter((trap) => trap !== this);
	}

	/**
	 * Hide the trap's display for a duration.
	 * @param duration Duration in ms
	 */
	hide(duration = 0) {
		this.game.createTween(
			this.display,
			{ alpha: 0 },
			duration,
			undefined,
			true
		);
	}

	/**
	 * Show the trap's display for a duration.
	 * @param duration Duration in ms
	 */
	show(duration = 0) {
		this.game.createTween(
			this.display,
			{ alpha: 1 },
			duration,
			undefined,
			true
		);
	}
}
