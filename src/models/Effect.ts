import { Creature } from './Creature';
import Game from '../game';
import { Hex } from '../utility/hex';
import { Trap } from '../models/Trap';

/*
 * Effect Class
 */

type EffectOwner = Creature | Hex;
type EffectTarget = Creature | Hex;

type Damage = number;
type EffectFnArg = Creature | Hex | Damage;

type EffectOptions = Partial<Effect>;

/**
 * Represents an effect that can be applied to a creature or hex, with logic for activation and removal.
 */
export class Effect {
	/** Unique identifier for the effect. */
	id: number;
	/** Reference to the game instance. */
	game: Game;
	/** Name of the effect. */
	name: string;
	/** Owner of the effect (creature or hex). */
	owner: EffectOwner;
	/** Target of the effect (creature or hex). */
	target: EffectTarget;
	/** Trigger string for the effect. */
	trigger: string;
	/** Turn number when the effect was created. */
	creationTurn: number;

	// NOTE: These "optional arguments" generally set via "optArgs" in the constructor.
	/** Function to execute the effect. */
	effectFn: (effect?: Effect, creatureHexOrDamage?: EffectFnArg) => void = () => {};
	/** Function to check if the effect can be applied. */
	requireFn: (arg?: any) => boolean = (arg?: any) => true;
	/** Alterations applied by the effect. */
	alterations: { [key: string]: any } = {};
	/** Number of turns the effect lasts. */
	turnLifetime = 0;
	/** Trigger for deleting the effect. */
	deleteTrigger = 'onStartOfRound';
	/** Whether the effect can stack. */
	stackable = true;
	/** Special hint for log. */
	specialHint: string | undefined = undefined; // Special hint for log
	/** Whether to delete the effect on owner death. */
	deleteOnOwnerDeath = false;

	/** Trap associated with this effect. */
	_trap: Trap | undefined = undefined;

	/** Attacker associated with this effect. */
	attacker: Creature | undefined = undefined;

	/**
	 * Create a new Effect instance.
	 * @param name Name of the effect
	 * @param owner Owner (creature or hex)
	 * @param target Target (creature or hex)
	 * @param trigger Trigger string
	 * @param optArgs Optional arguments
	 * @param game Game instance
	 */
	constructor(
		name: string,
		owner: EffectOwner,
		target: EffectTarget,
		trigger: string,
		optArgs: EffectOptions,
		game: Game,
	) {
		this.id = game.effectId++;
		this.game = game;

		this.name = name;
		this.owner = owner;
		this.target = target;
		this.trigger = trigger;
		this.creationTurn = game.turn;

		for (const key of Object.keys(optArgs)) {
			if (key in this) {
				this[key] = optArgs[key];
			}
		}

		game.effectManager.effects.push(this);
	}

	/**
	 * Run the effect's animation, activating the effect.
	 * @param args Arguments for activation
	 */
	animation(...args) {
		if (args) {
			this.activate(...args);
		} else {
			this.activate();
		}
	}

	/**
	 * Activate the effect, applying it to the target if requirements are met.
	 * @param arg Optional argument for requirement check
	 */
	activate(arg?: any) {
		if (!this.requireFn(arg)) {
			return false;
		}

		if (arg instanceof Creature) {
			arg.addEffect(this);
		}

		this.effectFn(this, arg);
	}

	/**
	 * Remove the effect from the target and the game.
	 */
	deleteEffect() {
		if ('effects' in this.target) {
			const targetIdx = this.target.effects.indexOf(this);
			if (this.target.effects[targetIdx]) {
				this.target.effects.splice(targetIdx, 1);
			} else {
				console.warn('Failed to find effect on target.', this);
			}
		}

		const gameIdx = this.game.effectManager.effects.indexOf(this);
		if (this.game.effectManager.effects[gameIdx]) {
			this.game.effectManager.effects.splice(gameIdx, 1);
		} else {
			console.warn('Failed to find effect on game.', this);
		}

		if ('updateAlteration' in this.target) {
			this.target.updateAlteration();
		}
	}

	/**
	 * Get the trap associated with this effect.
	 */
	get trap() {
		return this._trap;
	}

	/**
	 * Set the trap associated with this effect.
	 */
	set trap(trapOrUndefined) {
		this._trap = trapOrUndefined;
	}
}
