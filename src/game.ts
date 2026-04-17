// Project: Mythos Tactica
import { Animations } from './animations';
import { CreatureQueue } from './models/Creature_queue';
import { GameLog } from './utility/gamelog';
import { HexGrid } from './utility/hexgrid';
import { unitData } from './data/UnitData';
import * as Phaser from 'phaser';
import MatchI from './multiplayer/match';
import Gameplay from './multiplayer/gameplay';
import { CreatureType, Realm, UnitData } from './data/types';
import { PlayerManager } from './services/PlayerManager';
import { CreatureManager } from './services/CreatureManager';
import { TrapManager } from './services/TrapManager';
import { EffectManager } from './services/EffectManager';
import { GameManager } from './services/GameManager';
import { SoundSys } from './sound/soundsys';
import { MenuScene } from './scenes/MenuScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MatchScene } from './scenes/MatchScene';
import { Effect } from './models/Effect';
import { Ability } from './models/Ability';
/* eslint-disable prefer-rest-params */

/* Game Class
 *
 * Game contains all Game elements and functions.
 * It's the root element and defined only one time through the G variable.
 *
 * NOTE: Constructor does nothing because the G object must be defined
 * before creating other class instances. The game setup is triggered
 * to really start the game.
 */

type AnimationID = number;

export default class Game {
	matchid: number;
	playersReady: boolean;
	preventSetup: boolean;
	animations: Animations;
	queue: CreatureQueue;
	creatureData: typeof unitData | [];
	pause: boolean;
	gameState: 'initialized' | 'loading' | 'loaded' | 'playing' | 'ended';
	pauseTime: number;
	unitDrops: number;
	minimumTurnBeforeFleeing: number;
	availableCreatures: CreatureType[];
	animationQueue: (Animation | AnimationID)[];
	checkTimeFrequency: number;
	gamelog: GameLog;
	configData: object;
	match: MatchI | object;
	gameplay: Gameplay;
	session = null;
	client = null;
	connect = null;
	multiplayer: boolean;
	matchInitialized: boolean;
	realms: Realm[];
	availableMusic = [];
	inputMethod = 'Mouse';	firstKill: boolean;
	freezedInput: boolean;
	turnThrottle: boolean;
	turn: number;
	Phaser: Phaser.Game;
	currentScene?: Phaser.Scene;
	msg: any; // type this properly
	triggers: Record<string, RegExp>;
	signals: Record<string, SignalChannel>;

	// The optionals below are created by the various methods of `Game`, mainly by `setup` and `loadGame`

	musicPlayer?: any;

	background_image?: string;

	playerMode?: number;

	UI?: any;

	trapId?: number;	effectId?: number;
	dropId?: number;
	effects: Effect[] = [];  // Add effects array to store all game effects
	grid?: HexGrid;
	startMatchTime?: Date;
	$combatFrame?: HTMLElement;
	timeInterval?: NodeJS.Timeout; //eslint-disable-line no-undef

	windowResizeTimeout?: string | number | NodeJS.Timeout; //eslint-disable-line no-undef

	pauseStartTime?: Date;

	timePool?: number;
	turnTimePool?: number;
	endGameSound?: any;

	playerManager: PlayerManager;
	creatureManager: CreatureManager;
	trapManager: TrapManager;
	effectManager: EffectManager;
	gameManager: GameManager;
	soundsys: SoundSys;
	
	// Legacy abilities array for backward compatibility with old JS ability files
	abilities: Array<Partial<any>[]> = [];

	// Compatibility getters for legacy code
	get traps() {
		return this.trapManager.traps;
	}

	get activePlayer() {
		return this.playerManager.activePlayer;
	}
	
	get players() {
		return this.playerManager.players;
	}
	
	get activeCreature() {
		return this.playerManager.activeCreature;
	}
	
	get creatures() {
		return this.creatureManager.creatures;
	}
	constructor() {
		this.matchid = null;
		this.playersReady = false;
		this.preventSetup = false;		this.animations = new Animations(this);
		this.playerManager = new PlayerManager(this);
		this.gameManager = new GameManager(this);
		this.creatureManager = new CreatureManager(this);
		this.trapManager = new TrapManager(this);
		this.effectManager = new EffectManager(this);
		
		// Initialize arrays and counters
		this.effects = [];
		this.availableCreatures = [];
		this.trapId = 0;
		this.effectId = 0;
		this.dropId = 0;
		
		// Initialize sound system
		this.soundsys = new SoundSys({
			musicVolume: 1,
			effectsVolume: 1,
			heartbeatVolume: 1,
			announcerVolume: 1,
			paths: [] // Sound paths will be loaded as needed
		});
		
		this.queue = new CreatureQueue(() => this.creatureManager.creatures);
		this.gamelog = new GameLog(
			(log) => this.onLogSave(log),
			(log) => this.onLogLoad(log),
		);
		this.configData = {};
		this.match = {};
		this.gameplay = undefined;
		this.session = null;
		this.client = null;
		this.connect = null;
		this.multiplayer = false;
		this.matchInitialized = false;
		this.realms = ['-', 'A', 'E', 'G', 'L', 'P', 'S', 'W'];
		this.availableMusic = [];
		this.inputMethod = 'Mouse';

		// Gameplay properties
		this.firstKill = false;		this.freezedInput = false;
		this.turnThrottle = false;
		this.turn = 0;
		// Phaser 4 Configuration
		const config: Phaser.Types.Core.GameConfig = {
			type: Phaser.AUTO,
			width: 1920,
			height: 1080,
			parent: 'combatwrapper',
			backgroundColor: '#2a2a2a',
			scene: [MenuScene, PreloadScene, MatchScene],
			render: {
				pixelArt: true,
			},
			scale: {
				mode: Phaser.Scale.FIT,
				autoCenter: Phaser.Scale.CENTER_BOTH,
			},
		};
		this.Phaser = new Phaser.Game(config);

		// Set up scene change listeners to maintain currentScene reference
		this.Phaser.events.on('ready', () => {
			// Set the initial current scene reference to MenuScene and start it
			this.currentScene = this.Phaser.scene.getScene('MenuScene');
			this.Phaser.scene.start('MenuScene', { game: this });
		});

		// Messages
		// TODO: Move strings to external file in order to be able to support translations
		// https://github.com/8-bitArcade/MythosTactica/issues/923
		this.msg = {
			abilities: {
				noTarget: 'No targets available.',
				noPlasma: 'Not enough plasma.',
				noPsy: 'Psyhelm overload: too many units!',
				alreadyUsed: 'This ability has already been used.',
				tooMuch: 'Too much %stat%.',
				notEnough: 'Not enough %stat%.',
				notMoveable: 'This creature cannot be moved.',
				passiveCycle: 'Switches between any usable abilities.',
				passiveUnavailable: 'No usable abilities to switch to.',
			},
			ui: {
				dash: {
					materializeOverload: 'Overload! Maximum number of units controlled',
					selectUnit: 'Please select an available unit from the left grid',
					wrongPlayer: 'Please select an available unit from own unit grid',
					lowPlasma: 'Low Plasma! Cannot materialize the selected unit',
					// plasmaCost :    String :    plasma cost of the unit to materialize
					materializeUnit: (plasmaCost: string) => {
						return 'Materialize unit at target location for ' + plasmaCost + ' plasma';
					},
					materializeUsed: 'Materialization has already been used this round',
					heavyDev: 'This unit is currently under heavy development',
				},
			},
		};

		/* Regex Test for triggers */
		this.triggers = {
			onStepIn: /\bonStepIn\b/,
			onStepOut: /\bonStepOut\b/,
			onReset: /\bonReset\b/,
			onStartPhase: /\bonStartPhase\b/,
			onEndPhase: /\bonEndPhase\b/,
			onMovement: /\bonMovement\b/,
			onUnderAttack: /\bonUnderAttack\b/,
			onDamage: /\bonDamage\b/,
			onHeal: /\bonHeal\b/,
			onAttack: /\bonAttack\b/,
			onCreatureMove: /\bonCreatureMove\b/,
			onCreatureDeath: /\bonCreatureDeath\b/,
			onCreatureSummon: /\bonCreatureSummon\b/,

			onStepIn_other: /\bonOtherStepIn\b/,
			onStepOut_other: /\bonOtherStepOut\b/,
			onReset_other: /\bonOtherReset\b/,
			onStartPhase_other: /\bonOtherStartPhase\b/,
			onEndPhase_other: /\bonOtherEndPhase\b/,
			onMovement_other: /\bonOtherMovement\b/,
			onAttack_other: /\bonOtherAttack\b/,
			onDamage_other: /\bonOtherDamage\b/,
			onHeal_other: /\bonOtherHeal\b/,
			onUnderAttack_other: /\bonOtherUnderAttack\b/,
			onCreatureMove_other: /\bonOtherCreatureMove\b/,
			onCreatureDeath_other: /\bonOtherCreatureDeath\b/,
			onCreatureSummon_other: /\bonOtherCreatureSummon\b/,

			onEffectAttach: /\bonEffectAttach\b/,
			onEffectAttach_other: /\bonOtherEffectAttach\b/,

			onStartOfRound: /\bonStartOfRound\b/,
			onQuery: /\bonQuery\b/,
			oncePerDamageChain: /\boncePerDamageChain\b/,
		};

		const signalChannels = ['ui', 'metaPowers', 'creature', 'hex'];
		this.signals = this.setupSignalChannels(signalChannels);
	}

	onLogSave(log) {
		log.custom.configData = this.configData;
	}

	onLogLoad(log) {
		if (this.gameState !== 'initialized') {
			alert('Can only load game from configuration menu.');
			return;
		}
	}
	// Camera shake compatibility method for Phaser 2 to Phaser 3 migration
	cameraShake(intensity: number, duration: number, force?: boolean, direction?: any, internal?: boolean) {
		if (this.currentScene && this.currentScene.cameras) {
			// Convert Phaser 2 shake parameters to Phaser 3
			const pixelIntensity = intensity * 20; // Convert to reasonable pixel amount
			this.currentScene.cameras.main.shake(duration, pixelIntensity);
		}
	}
	// Tween compatibility method for Phaser 2 to Phaser 3 migration
	createTween(target: any, properties: any, duration: number, easing?: any, autoStart: boolean = true) {
		if (this.currentScene && this.currentScene.tweens) {
			// Convert Phaser 2 easing to Phaser 3 easing if needed
			let phaser3Easing = 'Linear';
			if (easing && easing.name) {
				// Map common Phaser 2 easings to Phaser 3 equivalents
				const easingMap = {
					'Linear.None': 'Linear',
					'Quadratic.InOut': 'Quad.easeInOut',
					'Quadratic.In': 'Quad.easeIn',
					'Quadratic.Out': 'Quad.easeOut',
				};
				phaser3Easing = easingMap[easing.name] || 'Linear';
			}

			const tween = this.currentScene.tweens.add({
				targets: target,
				...properties,
				duration: duration,
				ease: phaser3Easing,
				paused: !autoStart
			});

			// Add Phaser 2 compatibility methods using a wrapper
			const compatTween = {
				...tween,
				onComplete: {
					add: (callback: Function, context?: any) => {
						tween.on('complete', () => {
							if (context) {
								callback.call(context);
							} else {
								callback();
							}
						});
					}
				},
				start: () => {
					tween.play();
					return compatTween;
				},
				to: (props: any, dur: number, ease?: any) => {
					// Chain additional tweens
					return this.createTween(target, props, dur, ease, false);
				}
			};

			if (autoStart) {
				tween.play();
			}

			return compatTween;		}
		return null;
	}

	// Audio compatibility method for Phaser 2 to Phaser 3 migration
	createSound(key: string) {
		// Return a compatibility wrapper that uses the existing sound system
		return {
			play: () => {
				if (this.soundsys) {
					// Try to play the sound using the sound system
					// The key should match the sound file name
					return this.soundsys.playSFX(`sounds/${key}`);
				}
				return null;
			}
		};
	}

	phaserUpdate() {
		if (this.gameState != 'playing') {
			return;
		}
	}

	phaserRender() {
		// Per-creature render hook; creatures render themselves via sprites.
	}
	// Load unit data method
	loadUnitData() {
		this.creatureData = unitData;
		return this.creatureData;
	}	// Setup method called by GameManager after loading is complete
	setup(playerMode: number) {
		console.log('[DEBUG] Game.setup() called with playerMode:', playerMode);
		
		// Store the player mode
		this.playerMode = playerMode;
				// Load unit data into CreatureManager before any creatures are summoned
		console.log('[DEBUG] Loading unit data into CreatureManager...');
		this.creatureManager.loadUnitData(unitData as any);
		console.log('[DEBUG] Unit data loaded successfully');
		
		// Get the current scene (should be MatchScene at this point)
		// Note: The scene might still be initializing, so let's wait for it
		const matchScene = this.Phaser.scene.getScene('MatchScene');
		console.log('[DEBUG] MatchScene from Phaser.scene.getScene:', matchScene);
				// Check if we have a valid currentScene reference set by MatchScene.init()
		if (this.currentScene) {
			console.log('[DEBUG] Using currentScene set by MatchScene.init():', this.currentScene.scene.key);
		} else {
			console.log('[DEBUG] currentScene not set, using matchScene directly');
			this.currentScene = matchScene;
		}
		
		// Create HexGrid - simple and direct like the original
		this.grid = new HexGrid({}, this);
		
		// Set up the PlayerManager
		this.playerManager.setup(playerMode);
		
		// Synchronize abilities
		this.syncAbilities();
		
		// Show the grid
		if (this.grid) {
			this.grid.showGrid(true);
		}
		
		// The game is now fully set up and should be playing
		this.gameState = 'playing';
		console.log('[DEBUG] Game setup complete, gameState:', this.gameState);
	}

	// Trigger methods - delegate to appropriate service managers
	onCreatureSummon(creature: any) {
		// Delegate to CreatureManager to handle creature summoning triggers
		this.creatureManager.handleTrigger('onCreatureSummon', creature);
	}

	onCreatureDeath(creature: any) {
		// Delegate to CreatureManager to handle creature death triggers
		this.creatureManager.handleTrigger('onCreatureDeath', creature);
	}

	onStartPhase(creature: any) {
		// Delegate to CreatureManager to handle start phase triggers
		this.creatureManager.handleTrigger('onStartPhase', creature);
	}

	onEndPhase(creature: any) {
		// Delegate to CreatureManager to handle end phase triggers
		this.creatureManager.handleTrigger('onEndPhase', creature);
	}	onReset(creature: any) {
		// Delegate to CreatureManager to handle reset triggers
		this.creatureManager.handleTrigger('onReset', creature);
	}

	onEffectAttach(creature: any, effect: any) {
		// Delegate to EffectManager to handle effect attachment
		this.effectManager.triggerEffect('onEffectAttach', [creature, effect]);
	}

	onUnderAttack(creature: any, damage: any) {
		// Delegate to EffectManager to handle under attack triggers
		this.effectManager.triggerEffect('onUnderAttack', [creature, damage]);
	}

	onAttack(creature: any, damage: any) {
		// Delegate to EffectManager to handle attack triggers  
		this.effectManager.triggerEffect('onAttack', [creature, damage]);
	}

	// Method to retrieve creature stats - delegate to CreatureManager
	retrieveCreatureStats(type: any) {
		return this.creatureManager.retrieveCreatureStats(type);
	}
	
	/**
	 * Synchronize abilities between legacy Game.abilities and PlayerManager.abilities
	 * This ensures backward compatibility with old JS ability files
	 */
	syncAbilities() {
		// Copy from this.abilities to playerManager.abilities for any missing entries
		for (let i = 0; i < this.abilities.length; i++) {
			if (this.abilities[i] && !this.playerManager.abilities[i]) {
				this.playerManager.abilities[i] = this.abilities[i];
			}
		}
		
		// Copy from playerManager.abilities to this.abilities for any missing entries
		for (let i = 0; i < this.playerManager.abilities.length; i++) {
			if (this.playerManager.abilities[i] && !this.abilities[i]) {
				this.abilities[i] = this.playerManager.abilities[i];
			}
		}
	}	/**
	 * Reinitialize all creature abilities after ability files have been loaded
	 * This ensures that creatures get their proper ability definitions
	 */
	reinitializeCreatureAbilities() {
		console.log('[DEBUG] Reinitializing creature abilities...');
		
		// Synchronize abilities first
		this.syncAbilities();
		
		// Reinitialize abilities for all existing creatures
		this.creatureManager.creatures.forEach((creature) => {
			if (creature && creature.abilities) {
				// Recreate abilities with proper data now that ability files are loaded
				creature.abilities = [
					new Ability(creature, 0, this),
					new Ability(creature, 1, this),
					new Ability(creature, 2, this),
					new Ability(creature, 3, this),
				];
			}
		});
		
		console.log('[DEBUG] Creature abilities reinitialized');
	}

	setupSignalChannels(channels: string[]) {
		const signals: Record<string, SignalChannel> = {};
		for (const channel of channels) {
			signals[channel] = new SignalChannel();
		}
		return signals;
	}
}

/**
 * Signal Channel wrapper class to provide Phaser 2 compatible interface
 * Maps Phaser 2's .add()/.dispatch() methods to Phaser 3's .on()/.emit()
 */
class SignalChannel {
	private emitter: Phaser.Events.EventEmitter;

	constructor() {
		this.emitter = new Phaser.Events.EventEmitter();
	}

	/**
	 * Add a listener (Phaser 2 compatibility)
	 * @param callback Function to call when signal is dispatched
	 * @param context Context to bind the callback to
	 */
	add(callback: Function, context?: any) {
		// Use 'signal' as the event name for all signals in this channel
		this.emitter.on('signal', callback, context);
	}

	/**
	 * Dispatch a signal (Phaser 2 compatibility)
	 * @param message The message/event name
	 * @param payload Optional payload data
	 */
	dispatch(message: string, payload?: any) {
		// Call all listeners with message and payload
		this.emitter.emit('signal', message, payload);
	}

	/**
	 * Remove a listener
	 * @param callback Function to remove
	 * @param context Context that was used when adding
	 */
	remove(callback: Function, context?: any) {
		this.emitter.off('signal', callback, context);
	}

	/**
	 * Remove all listeners
	 */
	removeAll() {
		this.emitter.removeAllListeners('signal');
	}
}
