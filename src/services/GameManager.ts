import { Animations } from '../animations';
import { CreatureQueue } from '../models/Creature_queue';
import { GameLog } from '../utility/gamelog';
import { SoundSys } from '../sound/soundsys';
import { MusicPlayer } from '../sound/musicplayer';
import { Hex } from '../utility/hex';
import { HexGrid } from '../utility/hexgrid';
import { getUrl, use as assetsUse } from '../assets';
import { Player, PlayerColor, PlayerID } from '../models/Player';
import { UI } from '../ui/interface';
import { unitData } from '../data/UnitData';
import * as Phaser from 'phaser';
import MatchI from '../multiplayer/match';
import Gameplay from '../multiplayer/gameplay';
import { sleep } from '../utility/time';
import { DEBUG, DEBUG_DISABLE_GAME_STATUS_CONSOLE_LOG, DEBUG_DISABLE_MUSIC } from '../debug';
import { Point, configure as configurePointFacade } from '../utility/pointfacade';
import { pretty as version } from '../utility/version';
import { GameConfig } from '../script';
import { CreatureType, Realm, UnitData } from '../data/types';

// Import DOM utilities to replace jQuery
import { $ } from '../script';
import { Trap } from '../models/Trap';
import { Creature } from '../models/Creature';
import type { CreatureHintType } from '../models/Creature';

export class GameManager {
	game: any;
	// Properties
	gameState: 'initialized' | 'loading' | 'loaded' | 'playing' | 'ended';
	players: Player[];
	creatures: Creature[];
	traps: any[];
	effects: any[];
	drops: any[];
	activeCreature: any;
	triggers: Record<string, RegExp>;
	multiplayer: boolean;
	matchInitialized: boolean;
	matchid: number | null;
	configData: Partial<GameConfig>;
	soundsys: SoundSys;
	musicPlayer: MusicPlayer;
	Phaser: Phaser.Game;
	grid: HexGrid;
	UI: UI;
	playerMode: number;
	$combatFrame: HTMLElement | null;
	timeInterval: NodeJS.Timer | undefined;
	windowResizeTimeout: any;
	pause: boolean;
	preventSetup: boolean;
	animationQueue: any[];
	availableCreatures: CreatureType[];
	gamelog: GameLog;
	queue: CreatureQueue;
	creatureData: typeof unitData | [];
	firstKill: boolean;
	freezedInput: boolean;
	turnThrottle: boolean;
	turn: number;
	background_image: string;
	effectId: number;
	trapId: number;
	dropId: number;
	startMatchTime: Date | undefined;
	match: MatchI | object;
	gameplay: Gameplay | undefined;
	checkTimeFrequency: number;
	signals: any;
	pauseTime: number;
	timePool: number;
	turnTimePool: number;
	endGameSound: any;
	session: any;
	client: any;
	connect: any;
	realms: Realm[];
	availableMusic: any[];
	inputMethod: string;
	playersReady: boolean;
	animations: Animations;
	unitDrops: number;
	minimumTurnBeforeFleeing: number;	
	creaLimitNbr: number;
	abilityUpgrades: number;
	msg: any;
	playerManager: any;
	creatureManager: any;
	trapManager: any;
	effectManager: any;
	pauseStartTime?: Date;

	constructor(game: any) {
		this.game = game;

		this.gameState = 'initialized';
		this.players = [];
		this.creatures = [];
		this.traps = [];
		this.effects = [];
		this.drops = [];
		this.activeCreature = undefined;
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
		this.multiplayer = false;
		this.matchInitialized = false;
		this.matchid = null;
		this.configData = {};
		this.soundsys = undefined as any;
		this.musicPlayer = undefined as any;
		this.Phaser = undefined as any;
		this.grid = undefined as any;
		this.UI = undefined as any;
		this.playerMode = 2;
		this.$combatFrame = null;
		this.timeInterval = undefined;
		this.windowResizeTimeout = undefined;
		this.pause = false;
		this.preventSetup = false;
		this.animationQueue = [];
		this.availableCreatures = [];
		this.gamelog = undefined as any;
		this.queue = undefined as any;
		this.creatureData = [];
		this.firstKill = false;
		this.freezedInput = false;
		this.turnThrottle = false;
		this.turn = 0;
		this.background_image = '';
		this.effectId = 0;
		this.trapId = 0;
		this.dropId = 0;
		this.startMatchTime = undefined;
		this.match = {};
		this.gameplay = undefined;
		this.checkTimeFrequency = 1000;
		this.signals = {};
		this.pauseTime = 0;
		this.timePool = 0;
		this.turnTimePool = 0;
		this.endGameSound = undefined;
		this.session = null;
		this.client = null;
		this.connect = null;
		this.realms = ['-', 'A', 'E', 'G', 'L', 'P', 'S', 'W'];
		this.availableMusic = [];
		this.inputMethod = 'Mouse';
		this.playersReady = false;
		this.animations = undefined as any;		this.unitDrops = 0;
		this.minimumTurnBeforeFleeing = 0;
		this.creaLimitNbr = 0;
		this.abilityUpgrades = 3; // Default value based on form configuration
	}

	/**
	 * @param {Partial<GameConfig>} setupOpt - Setup options from matchmaking menu
	 * Load all required game files
	 */	loadGame(
		setupOpt: Partial<GameConfig>,
		matchInitialized?: boolean,
		matchid?: number,
		onLoadCompleteFn = () => {},
	) {
		// Need to remove keydown listener before new game start
		// to prevent memory leak and mixing hotkeys between start screen and game
		// Note: Since we don't have a specific handler reference, we'll skip this for now

		if (this.multiplayer && !matchid) {
			this.matchInitialized = matchInitialized;
		}
		if (matchid) {
			this.matchid = matchid;
		}
		this.gameState = 'loading';
		if (setupOpt) {
			this.configData = setupOpt;
			Object.assign(this, setupOpt);
		}
		// console.log(this);
		this.startLoading();
		// Sounds
		const paths = [
			'sounds/step',
			'sounds/swing',
			'sounds/swing2',
			'sounds/swing3',
			'sounds/heartbeat',
			'sounds/drums',
			'sounds/upgrade',
			'sounds/mudbath',
			'sounds/AncientBeast',
		];
		this.soundsys = new SoundSys({ paths });
		this.musicPlayer = this.soundsys.musicPlayer;
		// Assign soundsys to the game instance so other components can access it
		this.game.soundsys = this.soundsys;
		this.game.currentScene.load.on('filecomplete', this.loadFinish, this);
		this.game.currentScene.load.on('complete', onLoadCompleteFn);

		const assets = assetsUse(this.game.currentScene);

		console.log('[DEBUG] Loaded assets:', assets.length, 'assets');
		if (DEBUG) {
			console.log('[DEBUG] Asset details:', assets.slice(0, 5)); // Show first 5 assets
		}

		// Ability SFX
		this.game.currentScene.load.audio('MagmaSpawn0', getUrl('units/sfx/Infernal 0'));

		// Background
		this.game.currentScene.load.image('background', getUrl('locations/' + this.background_image + '/bg'));

		// Load artwork, shout and avatar for each unit
		this.game.loadUnitData(unitData);
	}
	hexAt(x: number, y: number): Hex | undefined {
		if (!this.grid) {
			console.warn('[DEBUG] GameManager.hexAt() called before grid initialization');
			return undefined;
		}
		return this.grid.hexAt(x, y);
	}
	startLoading() {
		$.hide($.getId('gameSetupContainer'));
		$.removeClass($.getId('loader'), 'hide');
		document.body.style.cursor = 'wait';
	}	loadFinish(progressValue?: number) {
		// Use passed progress value or fall back to scene loader progress
		const progress = progressValue !== undefined ? progressValue : (this.game.currentScene?.load?.progress || 0);
		const progressWidth = progress + '%';

		const progressBar = $.get('#barLoader .progress');
		if (progressBar) {
			progressBar.style.width = progressWidth;
		}

		if (progress >= 100) {
			setTimeout(() => {
				this.gameState = 'loaded';
				$.show($.getId('combatwrapper'));
				document.body.style.cursor = 'default';

				if (!this.preventSetup) {
					this.game.setup(this.playerMode);
					this.startMatchScene();
				}
			}, 100);
		}
	}
	/**
	 * Start the MatchScene with the Game instance passed as data
	 */
	private startMatchScene() {
		if (!this.game.Phaser || !this.game.Phaser.scene) {
			return;
		}
		
		this.game.Phaser.scene.start('MatchScene', { game: this.game });
	}

	phaserUpdate() {
		if (this.gameState != 'playing') {
			return;
		}
	}

	phaserRender() {
		for (let i = 1; i < this.creatures.length; i++) {
			//G.Phaser.debug.renderSpriteBounds(G.creatures[i].sprite);
		}
	}

	// Catch the browser being made inactive to prevent initial rendering bugs.
	onBlur() {
		this.preventSetup = true;
	}

	// Catch the browser coming back into focus so we can render the game board.
	onFocus() {
		this.preventSetup = false;
		// If loaded, call maybeSetup with a tiny delay to prevent rendering issues.
		if (this.gameState == 'loaded') {
			setTimeout(() => {
				this.maybeSetup();
			}, 100);
		}
	}	// If no red flags, remove the loading bar and begin rendering the game.
	maybeSetup() {
		if (this.preventSetup) {
			return;
		}

		$.addClass($.getId('loader'), 'hide');
		document.body.style.cursor = 'default';
		
		// Note: MatchScene will be started after game.setup() completes
		// No need to start it here as it will be started in loadFinish()
		
		this.game.setup(this.playerMode);
	}

	async matchInit() {
		if (this.multiplayer) {
			if (Object.keys(this.match).length === 0) {
				await this.connect.serverConnect(this.session);				const match = new MatchI(this.connect, this, this.session, null);
				const gameplay = new Gameplay(this.game, match);
				match.gameplay = gameplay;
				this.gameplay = gameplay;
				this.match = match;

				// Only host
				if (this.matchInitialized && this.match instanceof MatchI) {
					const n = await this.match.matchCreate();

					console.log('created match', n);
					await match.matchMaker(n, this.configData);
				}
			}
			// Non-host
			if (this.matchid && this.match instanceof MatchI) {
				const n = await this.match.matchJoin(this.matchid);
				console.log('joined match', n);
			}
		}
	}
	async matchJoin() {
		await this.matchInit();
		// @ts-expect-error 2339
		await this.match.matchMaker();
	}	async updateLobby() {
		if (this.matchInitialized) return;

		const lobbyMatchList = $.getId('lobby-match-list');
		if (lobbyMatchList) {
			lobbyMatchList.innerHTML = '';
			$.addClass(lobbyMatchList, 'refreshing');
		}
		
		$.addClass($.getId('refreshMatchButton'), 'disabled');
		$.removeClass($.getId('lobby-loader'), 'hide');
		$.addClass($.getId('lobby-no-matches'), 'hide');
		
		// Short delay to let the user know something has happened.
		await sleep(2000); // 2 seconds

		if (lobbyMatchList) {
			$.removeClass(lobbyMatchList, 'refreshing');
		}
		$.removeClass($.getId('refreshMatchButton'), 'disabled');
		$.addClass($.getId('lobby-loader'), 'hide');

		if (this.match && this.match instanceof MatchI && !this.match.matchUsers.length) {
			$.removeClass($.getId('lobby-no-matches'), 'hide');
			return;
		}

		// @ts-expect-error 2339
		this.match.matchUsers.forEach((v) => {
			const isAvailableMatch = v.string_properties && v.string_properties.match_id;

			if (!isAvailableMatch) {
				return;
			}

			const gameConfig = {
				background_image: v.string_properties.background_image,
				abilityUpgrades: v.numeric_properties.abilityUpgrades,
				creaLimitNbr: v.numeric_properties.creaLimitNbr,
				plasma_amount: v.numeric_properties.plasma_amount,
				playerMode: v.numeric_properties.playerMode,
				timePool: v.numeric_properties.timePool,
				turnTimePool: v.numeric_properties.turnTimePool,
				unitDrops: v.numeric_properties.unitDrops,
			};
			const turntimepool =
				v.numeric_properties.turnTimePool < 0 ? '∞' : v.numeric_properties.timePool;
			const timepool = v.numeric_properties.timePool < 0 ? '∞' : v.numeric_properties.timePool;
			const unitdrops = v.numeric_properties.unitDrops < 0 ? 'off' : 'on';
			this.unitDrops = v.numeric_properties.unitDrops;			const _matchBtn = document.createElement('a');
			_matchBtn.className = 'user-match';
			_matchBtn.innerHTML = `<div class="avatar"></div><div class="user-match__col">
        Host: ${v.presence.username}<br />
        Player Mode: ${v.numeric_properties.playerMode}<br />
        Active Units: ${v.numeric_properties.creaLimitNbr}<br />
        Ability Upgrades: ${v.numeric_properties.abilityUpgrades}<br />
        </div><div class="user-match__col">
        Plasma Points: ${v.numeric_properties.plasma_amount}<br />
        Turn Time(seconds): ${turntimepool}<br />
        Turn Pools(minutes): ${timepool}<br />
        Unit Drops: ${unitdrops}<br /></div>`;
        
			_matchBtn.addEventListener('click', () => {
				$.hide($.getId('lobby'));
				this.loadGame(gameConfig, false, v.string_properties.match_id);
			});
			
			const lobbyMatchList = $.getId('lobby-match-list');
			if (lobbyMatchList) {
				lobbyMatchList.appendChild(_matchBtn);
			}
		});
	}	/**
	 * Resize the combat frame
	 */
	resizeCombatFrame() {
		const cardWrapper = $.getId('cardwrapper');
		const card = $.getId('card');
		const cardWrapperInner = $.getId('cardwrapper_inner');
		
		if (cardWrapper && card && cardWrapperInner) {
			if (cardWrapper.offsetWidth < card.offsetWidth) {
				cardWrapperInner.style.width = cardWrapper.offsetWidth + 'px';
			}
		}
	}
	/**
	 * Replace the current queue with the next queue
	 */	nextRound() {
		// Check if game should end (all players have lost)
		// Use playerManager.players instead of this.players which might be empty
		const players = this.playerManager ? this.playerManager.players : [];
		const hasValidPlayer = players.some(player => !player.hasLost);
		if (!hasValidPlayer && players.length > 0) {
			console.warn('[DEBUG] No valid players remaining, ending game');
			this.gameState = 'ended';
			return;
		}

		this.turn++;
		this.log(`Round ${this.turn}`, 'roundmarker', true);
		this.onStartOfRound();
		this.nextCreature();
	}

	/**
	 * Activate the next creature in queue
	 */	nextCreature() {
		// Defensive check to ensure required properties are initialized
		if (!this.UI || !this.grid || !this.playerManager || !this.queue) {
			console.warn('[DEBUG] GameManager.nextCreature() called before proper initialization');
			return;
		}

		this.UI.closeDash();
		this.UI.btnToggleDash.changeState('normal');
		this.grid.xray(new Hex(-1, -1, null, this.game)); // Clear Xray
		if (this.gameState == 'ended') {
			return;
		}

		if (this.playerManager) {
			this.playerManager.stopTimer();
		}
		// Delay
		setTimeout(() => {
			const interval = setInterval(() => {
				clearInterval(interval);

				let differentPlayer = false;

				if (this.queue.isCurrentEmpty() || this.turn === 0) {
					this.nextRound(); // Switch to the next Round
					return;
				} else {
					const next = this.queue.queue[0];
					if (this.activeCreature && this.activeCreature) {
						differentPlayer = this.activeCreature.player != next.player;
					} else {
						differentPlayer = true;
					}					const last = this.activeCreature;
					this.activeCreature = next; // Set new activeCreature

					if (last && !last.dead) {
						last.updateHealth(); // Update health display due to active creature change
					}
				}				if (this.activeCreature.player.hasLost) {
					console.warn('[DEBUG] Active creature player has lost, finding next valid creature');
					// Find the next player that hasn't lost
					let foundValidPlayer = false;
					for (let i = 0; i < this.queue.queue.length; i++) {
						if (!this.queue.queue[i].player.hasLost) {
							foundValidPlayer = true;
							break;
						}
					}
					
					if (foundValidPlayer) {
						this.nextCreature();
						return;
					} else {
						console.warn('[DEBUG] All players have lost, ending game');
						this.gameState = 'ended';
						return;
					}
				}

				// Play heartbeat sound on other player's turn
				if (differentPlayer) {
					this.soundsys.playHeartBeat('sounds/heartbeat');
				}

				this.log('Active Creature : %CreatureName' + this.activeCreature.id + '%');
				this.activeCreature.activate();
				// console.log(this.activeCreature);

				// Show mini tutorial in the first round for each player
				if (this.turn == 1) {
					this.log('The active unit has a flashing hexagon');
					this.log('It uses a plasma field to protect itself');
					this.log('Its portrait is displayed in the upper left');
					this.log("Under the portrait are the unit's abilities");
					this.log('The ones with revealed icons are usable');
					this.log('Use the last one to materialize a creature');
					this.log('Making units drains your plasma points');
					this.log('Press the hourglass icon to skip the turn');
					this.log('%CreatureName' + this.activeCreature.id + '%, press here to toggle tutorial!');				}				// Updates UI to match new creature
				if (this.UI) {
					this.UI.updateActivebox();
				}
				this.updateQueueDisplay();
				if (this.signals?.creature?.dispatch) {
					this.signals.creature.dispatch('activate', { creature: this.activeCreature });
				}
				if (this.multiplayer && this.playersReady && this.gameplay instanceof Gameplay) {
					this.gameplay.updateTurn();
				} else {
					this.playersReady = true;
				}
			}, 50);
		}, 300);
	}

	updateQueueDisplay(excludeActiveCreature?) {
		if (this.UI) {
			this.UI.updateQueueDisplay();
		}
	}	/**
	 * @param {any} obj - Any variable to display in console and game log
	 * Display obj in the console log and in the game log
	 */	log(obj, htmlclass?, ifNoTimestamp = false) {
		// Formating
		let stringConsole = obj,
			stringLog = obj;

		// Debug logging for template replacement issues
		if (typeof obj === 'string' && obj.includes('%CreatureName')) {
			console.log('[DEBUG] Template replacement - Original message:', obj);
			console.log('[DEBUG] Total creatures:', this.creatures.length);
			console.log('[DEBUG] Creatures array:', this.creatures.map(c => c ? `${c.name} (ID: ${c.id})` : 'null'));
		}

		// Find all creature name placeholders in the string and replace them
		const creatureNamePattern = /%CreatureName(\d+)%/g;
		let match;
		
		while ((match = creatureNamePattern.exec(obj)) !== null) {
			const creatureId = parseInt(match[1]);
			const creature = this.creatures.find(c => c && c.id === creatureId);
			
			if (creature) {
				const consoleReplacement = creature.player.name + "'s " + creature.name;
				const logReplacement = "<span class='" + creature.player.color + "'>" + creature.name + '</span>';
				
				stringConsole = stringConsole.replace(match[0], consoleReplacement);
				stringLog = stringLog.replace(match[0], logReplacement);
				
				console.log(`[DEBUG] Replaced ${match[0]} with: ${consoleReplacement}`);
			} else {
				console.log(`[DEBUG] No creature found with ID ${creatureId}`);
			}
		}

		// Reset regex lastIndex for next use
		creatureNamePattern.lastIndex = 0;

		if (!DEBUG_DISABLE_GAME_STATUS_CONSOLE_LOG) {
			console.log(stringConsole);
		}
		
		// Only try to add to chat if UI is properly initialized
		if (this.UI && this.UI.chat) {
			this.UI.chat.addMsg(stringLog, htmlclass, ifNoTimestamp);
		}
	}
	togglePause() {		if (this.freezedInput && this.pause) {
			this.pause = false;
			this.freezedInput = false;
			this.pauseTime += new Date().valueOf() - this.pauseStartTime.valueOf();
			const pauseElement = document.getElementById('pause');
			if (pauseElement) {
				pauseElement.remove();
			}
			if (this.playerManager) {
				this.playerManager.startTimer();
			}
		} else if (!this.pause && !this.freezedInput) {
			this.pause = true;
			this.freezedInput = true;
			this.pauseStartTime = new Date();
			if (this.playerManager) {
				this.playerManager.stopTimer();
			}
			const uiElement = document.getElementById('ui');
			if (uiElement) {
				const pauseDiv = document.createElement('div');
				pauseDiv.id = 'pause';
				pauseDiv.textContent = 'Pause';
				uiElement.appendChild(pauseDiv);
			}
		}
	}

	/**
	 * End turn for the current unit
	 */
	skipTurn(o?) {
		// NOTE: If skipping a turn and there is a temp creature, destroy it.
		this.creatures.filter((c) => c.temp).forEach((c) => c.destroy());

		// Send skip turn to server

		if (this.turnThrottle) {
			return;
		}
		o = Object.assign(
			{
				callback: function () {},
				noTooltip: false,
				tooltip: 'Skipped',
			},
			o,
		);

		this.turnThrottle = true;
		this.UI.btnSkipTurn.changeState('disabled');
		this.UI.btnDelay.changeState('disabled');
		this.UI.btnAudio.changeState('disabled');

		setTimeout(() => {
			this.turnThrottle = false;
			this.UI.btnSkipTurn.changeState('normal');

			if (this.activeCreature?.canWait && this.queue.queue.length > 1) {
				this.UI.btnDelay.changeState('normal');
			}

			o.callback.apply();
		}, 1000);

		if (this.activeCreature) {
			this.activeCreature.facePlayerDefault();

			const skipTurn = new Date();
			const p = this.activeCreature.player;
			p.totalTimePool = p.totalTimePool - (skipTurn.valueOf() - p.startTime.valueOf());
			this.pauseTime = 0;
			this.activeCreature.deactivate('turn-end');
			const activeCreature = this.activeCreature;
			this.nextCreature();

			setTimeout(() => {
				if (!o.noTooltip) {
					activeCreature.hint(o.tooltip, 'msg_effects');
				}
			}, 350);
		}
	}

	/**
	 * Delay the action turn of the current creature
	 */	delayCreature(o) {
		// Send skip turn to server
		if (this.multiplayer && this.gameplay instanceof Gameplay) {
			this.gameplay.delay();
		}

		if (this.turnThrottle) {
			return;
		}

		if (!this.activeCreature?.canWait || !this.queue || this.queue.isCurrentEmpty()) {
			return;
		}
		o = Object.assign(
			{
				callback: function () {},
			},
			o,
		);

		this.turnThrottle = true;
		this.UI.btnSkipTurn.changeState('disabled');
		this.UI.btnDelay.changeState('disabled');

		setTimeout(() => {
			this.turnThrottle = false;
			this.UI.btnSkipTurn.changeState('normal');
			if (this.activeCreature?.canWait && !this.queue.isCurrentEmpty()) {
				this.UI.btnDelay.changeState('slideIn');
			}

			o.callback.apply();
		}, 1000);

		const skipTurn = new Date(),
			p = this.activeCreature.player;

		p.totalTimePool = p.totalTimePool - (skipTurn.valueOf() - p.startTime.valueOf());
		this.activeCreature.wait();
		this.nextCreature();
	}

	/**
	 * @param {CreatureType} type - Creature's type (ex: "--" for Dark Priest)
	 * Query the database for creature stats.
	 * Additonaly, ensure that a `type` property exists on each creature.
	 */




	// Removed individual args from definition because we are using the arguments variable.
	onStartPhase(creature?: any, callback?: any) {
		// Use first argument if passed, otherwise fallback to arguments[0] for compatibility
		const activeCreature = creature || arguments[0];
		const totalTraps = this.traps.length;

		let trap: Trap;

		for (let i = 0; i < totalTraps; i++) {
			trap = this.traps[i];

			if (trap === undefined) {
				continue;
			}

			if (trap.turnLifetime > 0) {
				if (this.turn - trap.creationTurn >= trap.turnLifetime) {
					if (trap.fullTurnLifetime) {
						if (trap.ownerCreature == this.activeCreature) {
							trap.destroy();
							i--;
						}
					} else {
						trap.destroy();
						i--;
					}
				}
			}		}
		this.game.effectManager.triggerDeleteEffect('onStartPhase', activeCreature);
		this.game.creatureManager.triggerAbility('onStartPhase', arguments);
		this.game.effectManager.triggerEffect('onStartPhase', [activeCreature, activeCreature]);
	}
	// Removed individual args from definition because we are using the arguments variable.
	onEndPhase(creature?: any, callback?: any) {
		// Use first argument if passed, otherwise fallback to arguments[0] for compatibility
		const activeCreature = creature || arguments[0];
		// Check if Abolished used third ability
		if (activeCreature && activeCreature.abilities && activeCreature.abilities.some((ability) => ability.title === 'Bonfire Spring')) {
			activeCreature.accumulatedTeleportRange += 1;
		}
		this.game.effectManager.triggerDeleteEffect('onEndPhase', activeCreature);
		this.game.creatureManager.triggerAbility('onEndPhase', arguments);
		this.game.effectManager.triggerEffect('onEndPhase', [activeCreature, activeCreature]);
	}

	// Removed individual args from definition because we are using the arguments variable.
	onStartOfRound(/* creature, callback */) {
		this.game.effectManager.triggerDeleteEffect('onStartOfRound', 'all');
	}

	// Removed individual args from definition because we are using the arguments variable.	
	onCreatureMove(/* creature, hex, callback */) {
		this.game.creatureManager.triggerAbility('onCreatureMove', arguments);
	}

	// Removed individual args from definition because we are using the arguments variable.
	onCreatureDeath(/* creature, callback */) {
		const creature = arguments[0];

		this.game.creatureManager.triggerAbility('onCreatureDeath', arguments);
		this.game.effectManager.triggerEffect('onCreatureDeath', [creature, creature]);

		// Fire onOtherCreatureDeath for all other creatures
		this.game.creatures.forEach(other => {
			if (other !== creature && !other.dead && !other.temp) {
				this.game.creatureManager.triggerAbility('onOtherCreatureDeath', [other, creature]);
				this.game.effectManager.triggerEffect('onOtherCreatureDeath', [other, creature]);
			}
		});

		// Looks for traps owned by this creature and destroy them
		this.traps
			.filter(
				(trap) => trap.turnLifetime > 0 && trap.fullTurnLifetime && trap.ownerCreature == creature,
			)
			.forEach((trap) => trap.destroy());

		// Look for effects owned by this creature and destroy them if necessary
		this.effects
			.filter((effect) => effect.owner === creature && effect.deleteOnOwnerDeath)
			.forEach((effect) => {
				effect.deleteEffect();
				// Update UI in case effect changes it
				if (effect.target) {
					// `this.effects` might be the wrong type or need to look at `EffectTarget` type definition
					effect.target.updateHealth();
				}
			});
	}

	onCreatureSummon(creature, callback) {
		this.game.creatureManager.triggerAbility('onCreatureSummon', [creature, creature, callback]);
		this.game.effectManager.triggerEffect('onCreatureSummon', [creature, creature]);

		// Fire onOtherCreatureSummon for all other creatures
		this.game.creatures.forEach(other => {
			if (other !== creature && !other.dead && !other.temp) {
				this.game.creatureManager.triggerAbility('onOtherCreatureSummon', [other, creature]);
				this.game.effectManager.triggerEffect('onOtherCreatureSummon', [other, creature]);
			}
		});
	}

	// Removed individual args from definition because we are using the arguments variable.
	onEffectAttach(creature, effect /*, callback */) {
		this.game.effectManager.triggerEffect('onEffectAttach', [creature, effect]);
	}

	onUnderAttack(creature, damage) {
		this.game.creatureManager.triggerAbility('onUnderAttack', arguments, damage);
		this.game.effectManager.triggerEffect('onUnderAttack', arguments, damage);
		return damage;
	}

	// Removed individual args from definition because we are using the arguments variable.
	onDamage(/* creature, damage */) {
		this.game.creatureManager.triggerAbility('onDamage', arguments);
		this.game.effectManager.triggerEffect('onDamage', arguments);
	}
	onHeal(creature, amount) {
		this.game.creatureManager.triggerAbility('onHeal', arguments);
		this.game.effectManager.triggerEffect('onHeal', arguments);
	}

	onAttack(creature, damage) {
		this.game.creatureManager.triggerAbility('onAttack', arguments, damage);
		this.game.effectManager.triggerEffect('onAttack', arguments, damage);
	}


	/* endGame()
	 *
	 * End the game and print stats
	 */
	endGame() {		this.soundsys.stopMusic();
		this.endGameSound = this.soundsys.playSFX('sounds/drums');

		if (this.playerManager) {
			this.playerManager.stopTimer();
		}
		this.gameState = 'ended';

		//-------End bonuses--------//
		for (let i = 0; i < this.playerMode; i++) {
			// No fleeing
			if (!this.players[i].hasFled) {
				this.players[i].score.push({
					type: 'nofleeing',
				});
			}

			// Surviving Creature Bonus
			let immortal = true;
			for (let j = 0; j < this.players[i].creatures.length; j++) {
				if (!this.players[i].creatures[j].dead) {
					if (this.players[i].creatures[j].type != '--') {
						this.players[i].score.push({
							type: 'creaturebonus',
							creature: this.players[i].creatures[j],
						});
					} else {
						// Dark Priest Bonus
						this.players[i].score.push({
							type: 'darkpriestbonus',
						});
					}
				} else {
					immortal = false;
				}
			}

			// Immortal
			if (immortal && this.players[i].creatures.length > 1) {
				// At least 1 creature summoned
				this.players[i].score.push({
					type: 'immortal',
				});
			}
		}
		this.UI.endGame();
	}
	action(o, opt) {
		if (!this.grid || !this.activeCreature) {
			console.warn('[DEBUG] GameManager.action() called before proper initialization');
			return;
		}

		const defaultOpt = {
			callback: function () {},
		};

		opt = Object.assign(defaultOpt, opt);

		this.game.clearOncePerDamageChain();
		switch (o.action) {			case 'move':
				if (this.grid.hexes && this.grid.hexes[o.target.y] && this.grid.hexes[o.target.y][o.target.x]) {
					this.activeCreature.moveTo(this.grid.hexes[o.target.y][o.target.x], {
						callback: opt.callback,
					});
				}
				break;
			case 'skip':
				this.skipTurn({
					callback: opt.callback,
				});
				break;
			case 'delay':
				this.delayCreature({
					callback: opt.callback,
				});
				break;
			case 'flee':
				this.activeCreature.player.flee({
					callback: opt.callback,
				});
				break;
			case 'ability': {
				const args = Array.from(o.args[1]);
				const ability = this.activeCreature.abilities[o.id];
				// If Abolished used Bonfire Spring, reset the range
				if (ability.title === 'Bonfire Spring') {
					this.activeCreature.accumulatedTeleportRange = 0;
				}				if (o.target.type == 'hex') {
					if (this.grid.hexes && this.grid.hexes[o.target.y] && this.grid.hexes[o.target.y][o.target.x]) {
						args.unshift(this.grid.hexes[o.target.y][o.target.x]);
						this.activeCreature.abilities[o.id].animation2({
							callback: opt.callback,
							arg: args,
						});
					}
				}

				if (o.target.type == 'creature') {
					args.unshift(this.creatures[o.target.crea]);
					this.activeCreature.abilities[o.id].animation2({
						callback: opt.callback,
						arg: args,
					});
				}				if (o.target.type == 'array') {
					if (this.grid.hexes) {
						const array = o.target.array.map((item) => {
							if (this.grid.hexes[item.y] && this.grid.hexes[item.y][item.x]) {
								return this.grid.hexes[item.y][item.x];
							}
							return null;
						}).filter(hex => hex !== null);

						args.unshift(array);
						this.activeCreature.abilities[o.id].animation2({
							callback: opt.callback,
							arg: args,
						});
					}
				}
				break;
			}
		}
	}

	/**
	 * Loads an image from a URL and returns the HTMLImageElement.
	 * @param url The image URL
	 * @returns {HTMLImageElement}
	 */
	public getImage(url: string): HTMLImageElement {
		const img = new Image();
		img.src = url;
		img.onload = function () {
			// No-op
		};
		return img;
	}
	resetGame() {
		this.endGameSound;
		this.UI.showGameSetup();
		if (this.playerManager) {
			this.playerManager.stopTimer();
		}
		this.players = [];
		this.creatures = [];
		this.effects = [];
		this.activeCreature = undefined;
		this.matchid = null;
		this.playersReady = false;
		this.preventSetup = false;
		this.animations = new Animations(this.game);
		this.queue = new CreatureQueue(() => this.creatures);
		this.creatureData = [];
		this.pause = false;
		this.gameState = 'initialized';
		this.availableCreatures = [];
		this.animationQueue = [];
		this.configData = {};
		this.match = {};
		this.gameplay = undefined;
		this.matchInitialized = false;
		this.firstKill = false;
		this.freezedInput = false;
		this.turnThrottle = false;
		this.turn = 0;

		this.gamelog.reset();
	}

	clearOncePerDamageChain() {
		const creatures = this.creatures,
			totalCreatures = creatures.length,
			totalEffects = this.effects.length;

		let creature: Creature, totalAbilities;

		for (let i = totalCreatures - 1; i >= 0; i--) {
			creature = this.creatures[i];

			if (creature) {
				totalAbilities = creature.abilities.length;

				for (let j = totalAbilities - 1; j >= 0; j--) {
					creature.abilities[j].triggeredThisChain = false;
				}
			}
		}

		for (let i = 0; i < totalEffects; i++) {
			// `this.effects` might be the wrong type or need to look at `EffectTarget` type definition
			this.effects[i].triggeredThisChain = false;
		}
	}

	/**
	 * Setup signal channels based on a list of channel names.
	 *
	 * @example setupSignalChannels(['ui', 'game'])
	 * // ... another file
	 * this.game.signals.ui.add((message, payload) => console.log(message, payload), this);
	 *
	 * @see https://photonstorm.github.io/phaser-ce/Phaser.Signal.html
	 *
	 * @param {array} channels List of channel names.
	 * @returns {object} Phaser signals keyed by channel name.
	 */
	

	onLogSave(log) {
		log.custom.configData = this.configData;
	}

	onLogLoad(log) {
		if (this.gameState !== 'initialized') {
			alert('Can only load game from configuration menu.');
			return;
		}

		const actions = [...log.actions];
		const numTotalActions = actions.length;
		const game = this;
		const configData = log.custom.configData;
		game.configData = log.custom.configData ?? game.configData;

		const nextAction = () => {
			if (actions.length === 0) {
				// this.activeCreature.queryMove(); // Avoid bug: called twice breaks opening UI (may need to revisit)
				return;
			}

			if (!DEBUG_DISABLE_GAME_STATUS_CONSOLE_LOG) {
				console.log(`${1 + numTotalActions - actions.length} / ${numTotalActions}`);
			}

			const interval = setInterval(() => {
				if (!game.freezedInput && !game.turnThrottle) {
					clearInterval(interval);
					game.playerManager.activeCreature.queryMove();
					game.action(actions.shift(), {
						callback: nextAction,
					});
				}
			}, 100);
		};

		game.loadGame(configData, undefined, undefined, () => {
			setTimeout(() => nextAction(), 3000);
		});
	}
}
