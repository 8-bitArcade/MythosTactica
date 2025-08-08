import * as time from '../utility/time';
import * as emoji from 'node-emoji';
import { Hotkeys, getHotKeys } from './hotkeys';

import { Button, ButtonStateEnum } from './button';
import { Chat } from './chat';
import { Creature } from '../models/Creature';
import { Fullscreen } from './fullscreen';
import { ProgressBar } from './progressbar';
import { getUrl } from '../assets';
import { MetaPowers } from './meta-powers';
import { Queue } from './queue';
import { QuickInfo } from './quickinfo';
import { pretty as version } from '../utility/version';

import { capitalize } from '../utility/string';
import { throttle } from 'underscore';
import { DEBUG_DISABLE_HOTKEYS } from '../debug';

import { cycleAudioMode, getAudioMode, AudioMode } from '../sound/soundsys';

/**
 * Class UI
 *
 * Object containing UI DOM element, update functions and event management on UI.
 */
export class UI {
	// Core properties
	soundSys: any;
	configuration: any;
	game: any;
	interfaceAPI: any;
		// DOM elements - jQuery and HTMLElement
	display: HTMLElement | null;
	dash: HTMLElement | null;
	grid: any;
	activebox: HTMLElement | null;
	scoreboard: HTMLElement | null;
	brandlogo: HTMLElement | null;
	ui: HTMLElement | null; // Native DOM element reference
	
	// UI components
	fullscreen: Fullscreen;
	chat: Chat;
	metaPowers?: MetaPowers;
	queue: any;
	quickInfo: any;
	hotkeys: Hotkeys;
	
	// Buttons
	buttons: Button[];
	abilitiesButtons: Button[];
	btnToggleDash: Button;
	btnToggleScore: Button;
	btnFullscreen: Button;
	btnAudio: Button;
	btnSkipTurn: Button;
	btnDelay: Button;
	btnFlee: Button;
	btnExit: Button;
	materializeButton: Button;
	
	// Progress bars
	healthBar: ProgressBar;
	energyBar: ProgressBar;
	timeBar: ProgressBar;
	poolBar: ProgressBar;
	
	// State variables
	active: boolean;
	dashopen: boolean;
	materializeToggled: boolean;
	selectedCreature: string;
	selectedCreatureObj?: Creature;
	selectedPlayer: number;
	selectedAbility: number;
	clickedAbility: number;
	activeAbility: boolean;
	lastViewedCreature: string;
	viewedCreature: string;
	queryUnit: string;
	
	// Animation and timing
	queueAnimSpeed: number;
	dashAnimSpeed: number;
	glowInterval: any;
	animationUpgradeTimeOutID: any;
	
	// Utility
	ignoreNextConfirmUnload: boolean;

	/* Attributes
	 *
	 * NOTE : DOM elements are now native HTMLElement objects
	 *
	 * display :	 	UI container
	 * dash :			Overview container
	 * grid :			Creature grid container
	 * activebox :	Current active creature panel (left panel) container
	 * scoreboard :	Scoreboard container
	 * brandlogo:  Brand logo container
	 *
	 * selectedCreature :	String :	ID of the visible creature card
	 * selectedPlayer :	Integer :	ID of the selected player in the dash
	 *
	 */

	/**
	 * Create attributes and default buttons
	 * @constructor
	 */
	constructor(configuration, game, soundSysInstance) {
		this.soundSys = soundSysInstance;
		this.configuration = configuration;		this.game = game;
		
		this.fullscreen = new Fullscreen(
			document.querySelector('#fullscreen.button'),
			game.fullscreenMode,
		);		this.display = document.getElementById('ui');
		this.ui = document.getElementById('ui');
		this.dash = document.getElementById('dash');
		this.grid = this.makeCreatureGrid(document.getElementById('creaturerasterwrapper'));
		this.activebox = document.getElementById('activebox');
		this.scoreboard = document.getElementById('scoreboard');
		this.brandlogo = document.getElementById('brandlogo');
		
		// Debug: Check if UI elements were found
		console.log('[DEBUG] UI elements found:', {
			display: !!this.display,
			ui: !!this.ui,
			dash: !!this.dash,
			activebox: !!this.activebox,
			scoreboard: !!this.scoreboard,
			brandlogo: !!this.brandlogo,
			creaturerasterwrapper: !!document.getElementById('creaturerasterwrapper')
		});
		
		this.active = false;

		this.queue = UI.getQueue(this, document.getElementById('queuewrapper'));
		this.quickInfo = UI.getQuickInfo(this, document.querySelector('div.quickinfowrapper'));

		// Last clicked creature in Godlet Printer for the current turn
		this.lastViewedCreature = '';

		// Last viewed creature for the current turn
		this.viewedCreature = '';

		// Chat
		this.chat = new Chat(game);

		// Meta Powers - only available for hot-seat games running in development mode.
		if (process.env.NODE_ENV === 'development' && !this.game.multiplayer) {
			this.metaPowers = new MetaPowers(this.game);
		}

		// Buttons Objects
		this.buttons = [];
		this.abilitiesButtons = [];
		// Dash Button
		this.btnToggleDash = new Button(
			{
				$button: document.querySelector('.toggledash'),
				hasShortcut: true,
				click: () => {
					this.game.signals.ui.dispatch('toggleDash');
				},
				overridefreeze: true,
			},
			{ isAcceptingInput: () => this.interfaceAPI.isAcceptingInput },
		);
		this.buttons.push(this.btnToggleDash);
		// Score Button
		this.btnToggleScore = new Button(
			{
				$button: document.querySelector('.togglescore'),
				hasShortcut: true,
				click: () => {
					this.game.signals.ui.dispatch('toggleScore');
				},
				overridefreeze: true,
			},
			{ isAcceptingInput: () => this.interfaceAPI.isAcceptingInput },
		);

		// In-Game Fullscreen Button
		this.btnFullscreen = new Button(
			{
				$button: document.querySelector('#fullscreen.button'),
				hasShortcut: true,
				click: () => this.fullscreen.toggle(),
				overridefreeze: true,
			},
			{ isAcceptingInput: () => this.interfaceAPI.isAcceptingInput },
		);
		this.buttons.push(this.btnFullscreen);

		// Audio Button
		this.btnAudio = new Button(
			{
				$button: document.querySelector('.toggle-music-player'),
				hasShortcut: true,
				click: () => {
					this.game.signals.ui.dispatch('toggleMusicPlayer');
				},
				overridefreeze: true,
			},
			{ isAcceptingInput: () => this.interfaceAPI.isAcceptingInput },
		);		
		this.buttons.push(this.btnAudio);
		this.btnAudio.$button.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			const newMode = cycleAudioMode(this.game.soundsys, this);
			this.updateAudioIcon(newMode);
		});
		
		// Skip Turn Button
		this.btnSkipTurn = new Button(
			{
				$button: document.querySelector('#skip.button'),				hasShortcut: true,
				click: () => {
					if (!this.dashopen) {
						if (game.turnThrottle) {
							return;
						}

						game.gamelog.add({
							action: 'skip',
						});

						// Prevents upgrade animation from carrying on into opponent's turn and disabling their button
						clearTimeout(this.animationUpgradeTimeOutID);

						game.gameManager.skipTurn();
						this.lastViewedCreature = '';
						this.queryUnit = '';
						const buttonElement = this.btnSkipTurn.$button;

						buttonElement.classList.remove('bounce');
					}
				},
			},
			{ isAcceptingInput: () => this.interfaceAPI.isAcceptingInput },
		);
		this.buttons.push(this.btnSkipTurn);

		// Delay Unit Button
		this.btnDelay = new Button(
			{
				$button: document.querySelector('#delay.button'),				hasShortcut: true,
				click: () => {
					if (!this.dashopen) {
						if (game.turnThrottle || !game.activeCreature?.canWait || game.queue.isCurrentEmpty()) {
							return;
						}

						game.gamelog.add({
							action: 'delay',
						});
						game.gameManager.delayCreature();
					}
				},
			},
			{ isAcceptingInput: () => this.interfaceAPI.isAcceptingInput },
		);
		this.buttons.push(this.btnDelay);

		// Flee Match Button
		this.btnFlee = new Button(
			{
				$button: document.querySelector('#flee.button'),
				hasShortcut: true,
				click: () => {
					if (!this.dashopen) {
						if (game.turn < game.minimumTurnBeforeFleeing) {
							alert(
								`You cannot flee the match in the first ${game.minimumTurnBeforeFleeing} rounds.`,
							);
							return;
						}

						if (game.playerManager.activeCreature.player.isLeader()) {
							alert('You cannot flee the match while being in lead.');
							return;
						}

						if (window.confirm('Are you sure you want to flee the match?')) {
							game.gamelog.add({
								action: 'flee',
							});
							game.playerManager.activeCreature.player.flee();
						}
					}
				},
				state: ButtonStateEnum.disabled,
			},
			{ isAcceptingInput: () => this.interfaceAPI.isAcceptingInput },
		);
		this.buttons.push(this.btnFlee);
		this.btnExit = new Button(
			{
				$button: document.querySelector('#exit.button'),
				hasShortcut: true,
				click: () => {
					if (this.dashopen) {
						return;
					}
					game.gamelog.add({
						action: 'exit',
					});
					game.resetGame();
				},
				state: ButtonStateEnum.normal,
			},
			{ isAcceptingInput: () => this.interfaceAPI.isAcceptingInput },
		);
		this.buttons.push(this.btnExit);

		this.materializeButton = new Button(
			{
				$button: document.querySelector('#materialize_button'),
				css: {
					disabled: {
						cursor: 'not-allowed',
					},
					glowing: {
						cursor: 'pointer',
					},
					selected: {},
					active: {},
					noclick: {},
					normal: {
						cursor: 'default',
					},
					slideIn: {},
				},
			},
			{ isAcceptingInput: () => this.interfaceAPI.isAcceptingInput },
		);

		// Defines states for ability buttons
		for (let i = 0; i < 4; i++) {
			const b = new Button(
				{
					$button: document.querySelector('.ability[ability="' + i + '"]'),
					hasShortcut: true,
					click: () => {
						this.clickedAbility = i;

						const game = this.game;
						if (this.selectedAbility != i) {
							if (this.dashopen) {
								return false;
							}

							const ability = game.playerManager.activeCreature.abilities[i];
							// Passive ability icon can cycle between usable abilities
							if (i == 0) {
								// Joywin
								const selectedAbility = this.selectNextAbility();
								const creature = game.activeCreature;								if (selectedAbility > 0) {
									this.abilitiesButtons.forEach((btn, index) => {
										if (index === 0) {
											btn.$button.classList.remove('cancelIcon');
											btn.$button.classList.remove('nextIcon');

											console.log(btn.$button);
											this.clickedAbility = -1;
										}
									});
									b.cssTransition('nextIcon', 1000);
								} else if (selectedAbility === -1) {
									this.abilitiesButtons.forEach((btn, index) => {
										console.log(this.clickedAbility);
										if (index === 0) {
											btn.$button.classList.remove('nextIcon');
											btn.$button.classList.remove('cancelIcon');
											this.clickedAbility = -1;
										}
									});
									b.cssTransition('cancelIcon', 1000);
								}

								return;
							}
							// Colored frame around selected ability
							if (ability.require() == true && i != 0) {
								this.selectAbility(i);
							}
							// Activate Ability
							game.playerManager.activeCreature.abilities[i].use();
						} else {
							// Cancel Ability
							this.closeDash();
							game.playerManager.activeCreature.queryMove();
							this.selectAbility(-1);
						}					},
					mouseover: () => {
						if (this.selectedAbility == -1) {
							this.showAbilityCosts(i);
						}
						
						(function () {
							const desc = document.querySelector('.desc[ability="' + i + '"]') as HTMLElement;

							// Ensure tooltip stays in window - adjust
							var rect = desc.getBoundingClientRect();
							const margin = 20;
							if (rect.bottom > window.innerHeight - margin) {
								const value = window.innerHeight - rect.bottom - margin;
								desc.style.top = value + 'px';
								(desc.querySelector('.arrow') as HTMLElement).style.top = 27 - value + 'px'; // Keep arrow position
							}
						})();
					},
					mouseleave: () => {
						if (this.selectedAbility == -1) {
							this.hideAbilityCosts();
						}
						(function () {
							const desc = document.querySelector('.desc[ability="' + i + '"]') as HTMLElement;
							desc.style.top = '0px';
							(desc.querySelector('.arrow') as HTMLElement).style.top = '27px';
						})();
					},
					abilityId: i,
					css: {
						disabled: {
							cursor: 'help',
						},
						glowing: {
							cursor: 'pointer',
						},
						selected: {},
						active: {},
						noclick: {
							cursor: 'help',
						},
						normal: {
							cursor: 'default',
						},
						slideIn: {
							cursor: 'pointer',
						},
					},
				},
				{ isAcceptingInput: () => this.interfaceAPI.isAcceptingInput },
			);
			this.buttons.push(b);
			this.abilitiesButtons.push(b);
		}
		// ProgressBar
		this.healthBar = new ProgressBar({
			$bar: document.querySelector('#leftpanel .progressbar .bar.healthbar'),
			color: 'red',
		});

		this.energyBar = new ProgressBar({
			$bar: document.querySelector('#leftpanel .progressbar .bar.energybar'),
			color: 'yellow',
		});

		this.timeBar = new ProgressBar({
			$bar: document.querySelector('#rightpanel .progressbar .timebar'),
			color: 'white',
		});

		this.poolBar = new ProgressBar({
			$bar: document.querySelector('#rightpanel .progressbar .poolbar'),
			color: 'grey',
		});

		// Sound Effects slider
		const slider = document.getElementById('sfx') as HTMLInputElement;
		slider.addEventListener('input', () => (game.soundsys.allEffectsMultiplier = slider.value));

		// Prevents default touch behaviour on slider when first touched (prevents scrolling the screen).
		slider.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

		slider.addEventListener('touchmove', (e) => {
			// Get slider relative to the view port.
			const sliderRect = slider.getBoundingClientRect();
			// The original touch point Y coordinate relative to the view port.
			const touchPoint = e.touches[0].clientY;
			/// The y coord of the touch event relative to the slider.
			const touchRelToSlider = touchPoint - sliderRect.top;
			const distFromBottom = sliderRect.height - touchRelToSlider;
			// Normalize the distance from the bottom of the slider to a value between 0 and 1.
			const normDist = distFromBottom / sliderRect.height;			// Scale normDist to range of the slider.
			const scaledDist = normDist * (parseFloat(slider.max) - parseFloat(slider.min));
			// New value of the slider.
			const slidersNewVal = scaledDist + parseFloat(slider.min);
			// Sets the slider value to the new value between the min/max bounds of the slider.
			slider.value = Math.min(Math.max(slidersNewVal, parseFloat(slider.min)), parseFloat(slider.max)).toString();

			// Manually dispatches the input event to update the sound system with new slider value.
			slider.dispatchEvent(new Event('input'));
		});

		this.hotkeys = new Hotkeys(this);
		const ingameHotkeys = getHotKeys(this.hotkeys);
		// Remove hex grid if window loses focus
		window.addEventListener('blur', () => {
			game.grid.showGrid(false);
		});

		// Binding Hotkeys
		if (!DEBUG_DISABLE_HOTKEYS) {
			document.addEventListener('keydown', (e) => {
				if (game.freezedInput) {
					return;
				}

				const keydownAction = ingameHotkeys[e.code] && ingameHotkeys[e.code].onkeydown;

				if (keydownAction !== undefined) {
					keydownAction.call(this, e);

					if (!(e.code === 'Tab' && e.shiftKey)) {
						e.preventDefault();
					}
				}
			});

			document.addEventListener('keyup', (e) => {
				if (game.freezedInput) {
					return;
				}

				const keyupAction = ingameHotkeys[e.code] && ingameHotkeys[e.code].onkeyup;

				if (keyupAction !== undefined) {
					keyupAction.call(this, e);

					e.preventDefault();
				}
			});
		}

		// Mouse Shortcut
		document.getElementById('dash').addEventListener('mousedown', (e) => {
			if (game.freezedInput) {
				return;
			}

			switch (e.which) {
				case 1:
					// Left mouse button pressed
					break;
				case 2:
					// Middle mouse button pressed
					if (this.dashopen) {
						this.materializeButton.triggerClick();
					}
					break;
				case 3:
					// Right mouse button pressed
					if (this.dashopen) {
						this.closeDash();
					}
					break;
			}
		});

		// Mouse Shortcut
		document.getElementById('musicplayerwrapper').addEventListener('mousedown', (e) => {
			if (game.freezedInput) {
				return;
			}
			switch (e.which) {
				case 1:
					// Left mouse button pressed
					break;
				case 2:
					// Middle mouse button pressed
					break;
				case 3:
					// Right mouse button pressed
					this.closeMusicPlayer();
					break;
			}
		});		// Mouse Shortcut
		this.ui.addEventListener('mousedown', (e) => {
			if (game.freezedInput) {
				return;
			}
			switch (e.which) {
				case 1:
					// Left mouse button pressed
					break;
				case 2:
					// Middle mouse button pressed
					break;
				case 3:
					// Right mouse button pressed
					this.closeScoreboard();
					break;
			}
		});

		// Mouse Shortcut
		document.getElementById('meta-powers').addEventListener('mousedown', (e) => {
			if (game.freezedInput) {
				return;
			}
			switch (e.which) {
				case 1:
					// Left mouse button pressed
					break;
				case 2:
					// Middle mouse button pressed
					break;
				case 3:
					// Right mouse button pressed
					this.metaPowers._closeModal();
					break;
			}
		});
		// Add wheel event listeners to multiple elements		
		const wheelElements = [
			document.getElementById('combatwrapper'),
			this.dash,
			document.getElementById('toppanel')
		].filter(el => el); // Filter out null elements
		
		wheelElements.forEach(element => {
			element.addEventListener('wheel', (e) => {
				if (game.freezedInput) {
					return;
				}

				// Dash
				if (this.dashopen) {
					if (e.deltaY < 0) {
						// Wheel up
						this.gridSelectPrevious();
					} else if (e.deltaY > 0) {
						// Wheel down
						this.gridSelectNext();
					}
					// Abilities
				} else {
					if (e.deltaY < 0) {
						// Wheel up
						this.selectPreviousAbility();
						// TODO: Allow to cycle between the usable active abilities by pressing the passive one's icon
					} else if (e.deltaY > 0) {
						// Wheel down
						this.selectNextAbility();
					}
				}

				e.preventDefault();
			});
		});		this.dash.querySelectorAll('.section.numbers .stat').forEach(statElement => {
			statElement.addEventListener('mouseover', (event) => {
				const section = (event.target as HTMLElement).closest('.section');
				const which = section.classList.contains('stats') ? '.stats_desc' : '.masteries_desc';
				document.querySelector(which).classList.add('shown');
			});
		});

		this.dash.querySelectorAll('.section.numbers .stat').forEach(statElement => {
			statElement.addEventListener('mouseleave', (event) => {
				const section = (event.target as HTMLElement).closest('.section');
				const which = section.classList.contains('stats') ? '.stats_desc' : '.masteries_desc';
				document.querySelector(which).classList.remove('shown');
			});
		});

		this.dash.querySelector('#playertabswrapper').classList.add('numplayer' + game.playerMode);

		this.selectedCreature = '';
		this.selectedPlayer = 0;
		this.selectedAbility = -1;
		this.clickedAbility = -1;
		this.queueAnimSpeed = 500; // ms
		this.dashAnimSpeed = 250; // ms

		this.materializeToggled = false;
		this.dashopen = false;
		this.glowInterval = setInterval(() => {
			const opa =
				0.5 +
				Math.floor(((1 + Math.sin(Math.floor(new Date().getTime() * Math.PI * 0.2) / 100)) / 4) * 100) / 100;
			const opaWeak = opa / 2;

			game.grid.allhexes.forEach((hex) => {
				if (hex.overlayClasses.match(/creature/)) {
					if (hex.overlayClasses.match(/selected|active/)) {
						if (hex.overlayClasses.match(/weakDmg/)) {
							hex.overlay.alpha = opaWeak;
							return;
						}

						hex.overlay.alpha = opa;
					}
				}
			});
		}, 10);
		if (game.turnTimePool) {
			document.querySelector('.turntime').textContent = time.getTimer(game.turnTimePool);
		}

		if (game.timePool) {
			document.querySelector('.timepool').textContent = time.getTimer(game.timePool);
		}

		this.confirmWindowUnload();

		document.querySelectorAll('#tabwrapper a').forEach(link => {
			link.removeAttribute('href');
		}); // Empty links
		this.btnExit.changeState(ButtonStateEnum.hidden);		// Show UI
		console.log('[DEBUG] Setting UI display to block');
		this.display.style.display = 'block';
		this.display.style.width = '100%';
		this.display.style.height = '100%';
		this.display.style.position = 'fixed';
		this.display.style.top = '0';
		this.display.style.left = '0';
		this.dash.style.display = 'none';
		
		// Hide the loading scrim that might be blocking the UI
		const scrim = document.querySelector('.scrim.loading') as HTMLElement;
		if (scrim) {
			console.log('[DEBUG] Hiding loading scrim');
			scrim.classList.remove('loading');
		}
		
		console.log('[DEBUG] UI display style set:', this.display?.style.display, 'width:', this.display?.style.width, 'height:', this.display?.style.height);

		// Events
		this.game.signals.ui.add(this._handleUiEvent, this);
	}

	/**
	 * Handle events on the "ui" channel.
	 *
	 * @param {string} message Event name.
	 * @param {object} payload Event payload.
	 */	_handleUiEvent(message, payload) {
		if (message === 'toggleDash') {
			this.toggleDash(false);
			this.closeMusicPlayer();
			this.closeScoreboard();
		}

		if (message === 'toggleScore') {
			this.toggleScoreboard(false);
			this.closeDash();
			this.closeMusicPlayer();
		}

		if (message === 'toggleMusicPlayer') {
			this.toggleMusicPlayer();
			this.closeDash();
			this.closeScoreboard();
		}

		if (message === 'toggleMetaPowers') {
			this.closeDash();
			this.closeMusicPlayer();
			this.closeScoreboard();
		}

		if (message === 'closeInterfaceScreens') {
			this.closeDash();
			this.closeMusicPlayer();
			this.closeScoreboard();
		}
	}

	showAbilityCosts(abilityId) {
		const game = this.game,
			creature = game.activeCreature,
			ab = creature.abilities[abilityId];

		if (ab.costs !== undefined) {
			if (typeof ab.costs.energy == 'number') {
				const costsEnergy = ab.costs.energy + creature.stats.reqEnergy;
				this.energyBar.previewSize(costsEnergy / creature.stats.energy);
				this.energyBar.setAvailableStyle();

				if (costsEnergy > creature.energy) {
					// Indicate the minimum energy required for the hovered ability
					// if the requirement is not met
					this.energyBar.setSize(costsEnergy / creature.stats.energy);
					this.energyBar.previewSize(
						costsEnergy / creature.stats.energy - creature.energy / creature.stats.energy,
					);

					this.energyBar.setUnavailableStyle();
				}
			} else {
				this.energyBar.previewSize(0);
			}
			if (typeof ab.costs.health == 'number') {
				this.healthBar.previewSize(ab.costs.health / creature.stats.health);
			} else {
				this.healthBar.previewSize(0);
			}
		}
	}

	hideAbilityCosts() {
		const game = this.game,
			creature = game.activeCreature;
		// Reset energy bar to match actual energy value
		this.energyBar.setSize(creature.energy / creature.stats.energy);

		this.energyBar.previewSize(0);
		this.healthBar.previewSize(0);
	}

	selectPreviousAbility() {
		const game = this.game,
			b = this.selectedAbility == -1 ? 4 : this.selectedAbility;

		for (let i = b - 1; i > 0; i--) {
			const creature = game.activeCreature;

			if (creature.abilities[i].require() && !creature.abilities[i].used) {
				this.abilitiesButtons[i].triggerClick();
				return;
			}
		}

		game.playerManager.activeCreature.queryMove();
	}

	/**
	 * Cycles to next available ability. Returns the ability number selected or -1 if deselected.
	 */
	selectNextAbility() {
		const game = this.game,
			b = this.selectedAbility == -1 ? 0 : this.selectedAbility;
		if (this.selectedAbility == 3) {
			game.playerManager.activeCreature.queryMove();
			this.selectAbility(-1);
			return -1;
		}
		for (let i = b + 1; i < 4; i++) {
			const creature = game.activeCreature;

			if (creature.abilities[i].require() && !creature.abilities[i].used) {
				this.abilitiesButtons[i].triggerClick();
				return i;
			}

			// Check if creature has at least one more ability to choose from
			let creatureHaveAtleastOneAvailableAbility = false;
			for (let y = i; y < 4; y++) {
				if (creature.abilities[y].require()) {
					creatureHaveAtleastOneAvailableAbility = true;
					break;
				}
			}

			// If creature has no more available abilities to choose from, return -1
			if (!creatureHaveAtleastOneAvailableAbility) {
				game.playerManager.activeCreature.queryMove();
				this.selectAbility(-1);
				return -1;
			}
		}
	}
	resizeDash() {
		const cardwrapper = document.getElementById('cardwrapper');
		const card = document.getElementById('card');
		const materializeButton = document.getElementById('materialize_button');
		const cardwrapperInner = document.getElementById('cardwrapper_inner');
		
		if (!cardwrapper || !card || !materializeButton || !cardwrapperInner) return;
		
		const cardwrapperRect = cardwrapper.getBoundingClientRect();
		const cardRect = card.getBoundingClientRect();
		const materializeRect = materializeButton.getBoundingClientRect();
		
		let zoom1 = cardwrapperRect.width / cardRect.width,
			zoom2 = cardwrapperRect.height / (cardRect.height + materializeRect.height),
			zoom = Math.min(zoom1, zoom2, 1);

		Object.assign(cardwrapperInner.style, {
			transform: `scale(${zoom})`,
			left: `${(cardwrapperRect.width - cardRect.width * zoom) / 2}px`,
			position: 'absolute',
			margin: '0',
		});

		const creaturerasterwrapper = document.getElementById('creaturerasterwrapper');
		const creatureraster = document.getElementById('creatureraster');
		
		if (!creaturerasterwrapper || !creatureraster) return;
		
		const rasterwrapperRect = creaturerasterwrapper.getBoundingClientRect();
		const rasterRect = creatureraster.getBoundingClientRect();
		
		zoom1 = rasterwrapperRect.width / rasterRect.width;
		zoom2 = rasterwrapperRect.height / rasterRect.height;
		zoom = Math.min(zoom1, zoom2, 1);

		Object.assign(creatureraster.style, {
			transform: `scale(${zoom})`,
			left: `${(rasterwrapperRect.width - rasterRect.width * zoom) / 2}px`,
			position: 'absolute',
			margin: '0',
		});
	}

	/**
	 * Query a creature in the available creatures of the active player.
	 *
	 * @param {string} creatureType Creature type
	 * @param {number} player Player ID
	 * @param {'emptyHex' | 'portrait' | 'grid'} clickMethod Method used to view creatures.
	 */	showCreature(creatureType, player, clickMethod) {
		const game = this.game;
		
		// Early validation checks
		if (!game || !game.players || !game.playerManager) {
			console.error('showCreature: Missing game data');
			return;
		}
		
		if (!this.dashopen) {
			this.dash.style.display = 'block';
			this.dash.style.opacity = '0';
			// Use a simple transition instead of jQuery transition
			this.dash.style.transition = `opacity ${this.dashAnimSpeed}ms linear`;
			// Trigger reflow to ensure the initial opacity is applied
			this.dash.offsetHeight;
			this.dash.style.opacity = '1';		}
		this.dashopen = true;
		if (player === undefined) {
			if (!game.playerManager.activeCreature || !game.playerManager.activeCreature.player) {
				console.error('showCreature: No active creature or player found');
				return;
			}
			player = game.playerManager.activeCreature.player.id;
		}
		
		// Validate the player exists
		if (!game.players[player]) {
			console.error('showCreature: Player', player, 'does not exist');
			return;
		}
		
		// Set dash active - add null check to prevent errors
		if (!this.dash) {
			console.error('UI dash element not found');
			return;
		}
		
		this.dash.classList.add('active');
		const tooltip = this.dash.querySelector('#tooltip');
		if (tooltip) {
			tooltip.classList.remove('active');
		}
		const playerTabsWrapper = this.dash.querySelector('#playertabswrapper');
		if (playerTabsWrapper) {
			playerTabsWrapper.classList.add('active');
		}
		
		this.changePlayerTab(game.playerManager.activeCreature.team);
		this.resizeDash();

		if (playerTabsWrapper) {
			const playerTabs = playerTabsWrapper.querySelectorAll('.playertabs');
			playerTabs.forEach(tab => {
				// Remove existing click listeners by cloning element
				const newTab = tab.cloneNode(true) as HTMLElement;
				tab.parentNode?.replaceChild(newTab, tab);
				
				// Add new click listener
				newTab.addEventListener('click', (e) => {
					if (game.freezedInput) {
						return;
					}
					const target = e.currentTarget as HTMLElement;
					const playerAttribute = target.getAttribute('player');
					const playerId = playerAttribute ? parseInt(playerAttribute, 10) : 0;
					this.showCreature('--', playerId, '');
				});
			});
		}
		
		// Update player info
		for (let i = game.players.length - 1; i >= 0; i--) {
			const vignetteEl = document.querySelector(`#dash .playertabs.p${i} .vignette`) as HTMLElement;
			if (vignetteEl) {
				vignetteEl.style.backgroundImage = `url("${game.players[i].avatar}")`;
			}
			
			const nameEl = document.querySelector(`#dash .playertabs.p${i} .name`);
			if (nameEl) {
				nameEl.textContent = game.players[i].name;
			}
			
			const plasmaEl = document.querySelector(`#dash .playertabs.p${i} .plasma`);
			if (plasmaEl) {
				plasmaEl.textContent = 'Plasma ' + game.players[i].plasma;
			}
			
			const scoreEl = document.querySelector(`#dash .playertabs.p${i} .score`);
			if (scoreEl) {
				scoreEl.textContent = 'Score ' + game.players[i].getScore().total;
			}
			
			const unitsEl = document.querySelector(`#dash .playertabs.p${i} .units`);
			if (unitsEl) {
				unitsEl.textContent = 'Units ' + game.players[i].getNbrOfCreatures() + ' / ' + game.creaLimitNbr;
			}
		}

		// Change to the player tab
		if (player != this.selectedPlayer) {
			this.changePlayerTab(player);
		}
		// Remove active class from all vignettes and add to the selected one
		const vignettes = this.grid.querySelectorAll('.vignette');
		vignettes.forEach(vignette => {
			vignette.classList.remove('active', 'dead', 'queued', 'notsummonable');
		});
		
		// Add active class to the specific creature
		const targetVignette = this.grid.querySelector(`[creature='${creatureType}']`);
		if (targetVignette) {
			targetVignette.classList.add('active');
		}

		this.selectedCreature = creatureType;
		// Added: Visually highlight the selected creature on the grid
		// This ensures the tile matches the active creature shown in the UI panel
		const allVignettes = this.grid.querySelectorAll('.vignette');
		allVignettes.forEach(v => v.classList.remove('active'));

		const activeVignette = this.grid.querySelector(`[creature='${creatureType}']`);
		if (activeVignette) {
			activeVignette.classList.add('active');
		}
		const stats = game.retrieveCreatureStats(creatureType);
		if (stats === undefined) return;

		//function to add the name, realm, size etc of the current card in the menu
		function addCardCharacterInfo() {
			const name = stats.name;
			let type = stats.type;
			let set = stats.set;
			const no_of_hexes =
				stats.size === 1
					? '&#11041'
					: stats.size == 2
					? '&#11041 &#11041'
					: '&#11041 &#11041 &#11041';			if (stats.level === '-' || stats.realm == '-') {
				type = '&#9734';
				document.querySelector('#card .sideA .type').classList.add('star');
				set = '';
			} else {
				document.querySelector('#card .sideA .type').classList.remove('star');
			}

			document.querySelector('#card .sideA .type').innerHTML = type;
			document.querySelector('#card .sideA .name').textContent = name;
			document.querySelector('#card .sideA .set').innerHTML = set;
			document.querySelector('#card .sideA .hexes').innerHTML = no_of_hexes;
		}		// TODO card animation
		if (
			(game.players[player] && game.players[player].availableCreatures && 
			 game.players[player].availableCreatures.indexOf(creatureType) > 0) ||
			creatureType == '--'		) {
			// retrieve the selected unit
			this.selectedCreatureObj = undefined;
			if (game.players[player] && game.players[player].creatures) {
				game.players[player].creatures.forEach((creature) => {
					if (creature.type == creatureType) {
						this.selectedCreatureObj = creature;
					}
				});
			}// Card A
			const cardSideA = document.querySelector('#card .sideA') as HTMLElement;
			cardSideA.style.backgroundImage = `url('${getUrl('cards/margin')}'), url('${getUrl(
				'units/artwork/' + stats.name,
			)}')`;
			
			const cardSideAInfo = document.querySelector('#card .sideA .section.info') as HTMLElement;
			cardSideAInfo.className = cardSideAInfo.className.replace(/sin[- AEGLPSW]/g, '');
			cardSideAInfo.classList.add('sin' + stats.type.substring(0, 1));
			addCardCharacterInfo();

			// Card B
			const cardSideB = document.querySelector('#card .sideB') as HTMLElement;
			cardSideB.style.backgroundImage = `url('${getUrl('cards/margin')}'), url('${getUrl(
				'cards/' + stats.type.substring(0, 1),
			)}')`;
					Object.entries(stats.stats).forEach(([key, value]) => {
				const statEl = document.querySelector(`#card .sideB .${key} .value`);
				if (statEl) {
					statEl.classList.remove('buff', 'debuff');
					if (this.selectedCreatureObj) {
						if (key == 'health') {
							statEl.textContent = this.selectedCreatureObj.health + '/' + this.selectedCreatureObj.stats[key];
						} else if (key == 'movement') {
							statEl.textContent = this.selectedCreatureObj.remainingMove + '/' + this.selectedCreatureObj.stats[key];
						} else if (key == 'energy') {
							statEl.textContent = this.selectedCreatureObj.energy + '/' + this.selectedCreatureObj.stats[key];
						} else if (key == 'endurance') {
							statEl.textContent = this.selectedCreatureObj.endurance + '/' + this.selectedCreatureObj.stats[key];
						} else {
							statEl.textContent = this.selectedCreatureObj.stats[key];
						}
						if (this.selectedCreatureObj.stats[key] > value) {
							// Buff
							statEl.classList.add('buff');
						} else if (this.selectedCreatureObj.stats[key] < value) {
							// Debuff
							statEl.classList.add('debuff');
						}					} else {
						statEl.textContent = String(value);
					}
				}
			});			Object.entries(game.abilities[stats.id]).forEach(([key]) => {
				const abilityEl = document.querySelector(`#card .sideB .abilities .ability:nth-child(${parseInt(key) + 1})`);
				if (abilityEl) {					const iconEl = abilityEl.querySelector('.icon') as HTMLElement;
					if (iconEl) {
						iconEl.style.backgroundImage = `url('${getUrl('units/abilities/' + stats.name + ' ' + key)}')`;
					}
					
					const titleEl = abilityEl.querySelector('.wrapper .info h3');
					if (titleEl) {
						titleEl.textContent = stats.ability_info[key].title;
					}
					
					const descEl = abilityEl.querySelector('.wrapper .info #desc');
					if (descEl) {
						descEl.textContent = stats.ability_info[key].desc;
					}
					
					const infoEl = abilityEl.querySelector('.wrapper .info #info');
					if (infoEl) {
						infoEl.textContent = stats.ability_info[key].info;
					}
					
					const upgradeEl = abilityEl.querySelector('.wrapper .info #upgrade');
					if (upgradeEl) {
						upgradeEl.textContent = 'Upgrade: ' + stats.ability_info[key].upgrade;
					}

					if (stats.ability_info[key].costs !== undefined && key !== '0') {
						const costEl = abilityEl.querySelector('.wrapper .info #cost');
						if (costEl) {
							costEl.textContent = ' - costs ' + stats.ability_info[key].costs.energy + ' energy pts.';
						}
					} else {
						const costEl = abilityEl.querySelector('.wrapper .info #cost');
						if (costEl) {
							costEl.textContent = ' - this ability is passive.';
						}
					}
				}
			});			const summonedOrDead = game.players[player] && game.players[player].creatures ? 
				game.players[player].creatures.some((creature) => creature.type == creatureType) : false;this.materializeButton.changeState(ButtonStateEnum.disabled);
		const cardSideAEl = document.querySelector('#card .sideA') as HTMLElement;
		if (cardSideAEl) {
			cardSideAEl.classList.add('disabled');
			cardSideAEl.removeEventListener('click', null);
		}

		const activeCreature = game.activeCreature;
		if (activeCreature.player.getNbrOfCreatures() > game.creaLimitNbr) {
			const materializeButtonText = document.querySelector('#materialize_button p') as HTMLElement;
			if (materializeButtonText) {
				materializeButtonText.textContent = game.msg.ui.dash.materializeOverload;
			}
		}
		// Check if the player is viewing the wrong tab
		else if (
			activeCreature.player.id !== player &&
			activeCreature.isDarkPriest() &&
			activeCreature.abilities[3].testRequirements() &&
			activeCreature.abilities[3].used === false
		) {
			const materializeButtonText = document.querySelector('#materialize_button p') as HTMLElement;
			if (materializeButtonText) {
				materializeButtonText.textContent = game.msg.ui.dash.wrongPlayer;
			}
			// Switch to turn player's dark priest
			this.materializeButton.click = () => {
				this.showCreature('--', activeCreature.player.id, '');
			};

			const cardSideA = document.querySelector('#card .sideA') as HTMLElement;
			if (cardSideA) {
				cardSideA.addEventListener('click', this.materializeButton.click);
				cardSideA.classList.remove('disabled');
			}
			this.materializeButton.changeState(ButtonStateEnum.glowing);
			const materializeButton = document.querySelector('#materialize_button') as HTMLElement;
			if (materializeButton) {
				materializeButton.style.display = '';
			}
			} else if (
				!summonedOrDead &&
				activeCreature.player.id === player &&
				activeCreature.type === '--' &&
				activeCreature.abilities[3].used === false
			) {
				const lvl = creatureType.substring(1, 2) - 0,
					size = game.retrieveCreatureStats(creatureType).size - 0,
					plasmaCost = lvl + size;
		// Messages (TODO: text strings in a new language file)
		if (plasmaCost > activeCreature.player.plasma) {
			const materializeButtonText = document.querySelector('#materialize_button p') as HTMLElement;
			if (materializeButtonText) {
				materializeButtonText.textContent = game.msg.ui.dash.lowPlasma;
			}
		} else {
			if (creatureType == '--') {
				const materializeButtonText = document.querySelector('#materialize_button p') as HTMLElement;
				if (materializeButtonText) {
					materializeButtonText.textContent = game.msg.ui.dash.selectUnit;
				}
			} else {
				const materializeButtonText = document.querySelector('#materialize_button p') as HTMLElement;
				if (materializeButtonText) {
					materializeButtonText.textContent = game.msg.ui.dash.materializeUnit(plasmaCost.toString());
				}

				// Bind button
				this.materializeButton.click = () => {
					this.materializeToggled = false;
					this.selectAbility(3);
					this.closeDash();

					if (this.lastViewedCreature) {
						activeCreature.abilities[3].materialize(this.lastViewedCreature);
					} else {
						activeCreature.abilities[3].materialize(this.selectedCreature);
						this.lastViewedCreature = this.selectedCreature;
					}
				};
				const cardSideA = document.querySelector('#card .sideA') as HTMLElement;
				if (cardSideA) {
					cardSideA.addEventListener('click', this.materializeButton.click);
					cardSideA.classList.remove('disabled');
				}
				this.materializeButton.changeState(ButtonStateEnum.glowing);
				const materializeButton = document.querySelector('#materialize_button') as HTMLElement;
				if (materializeButton) {
					materializeButton.style.display = '';
				}
			}
		}
			} else {				if (creatureType == '--' && !activeCreature.abilities[3].used) {
					// Figure out if the player has enough plasma to summon any available creatures
					const activePlayer = game.players[game.playerManager.activeCreature.player.id];
					if (!activePlayer || !activePlayer.creatures || !activePlayer.availableCreatures) {
						console.warn('showCreature: Active player data is missing for materialize check');
						this.materializeButton.changeState(ButtonStateEnum.disabled);
						return;
					}
					
					const deadOrSummonedTypes = activePlayer.creatures.map((creature) => creature.type);
					const availableTypes = activePlayer.availableCreatures.filter(
						(el) => !deadOrSummonedTypes.includes(el),
					);
					// Assume we can't afford anything
					// Check one available creature at a time until we see something we can afford
					let can_afford_a_unit = false;
					availableTypes.forEach((type) => {
						const lvl = type.substring(1, 2) - 0;
						const size = game.retrieveCreatureStats(type).size - 0;
						const plasmaCost = lvl + size;
						if (plasmaCost <= activePlayer.plasma) {
							can_afford_a_unit = true;
						}
					});			// If we can't afford anything, tell the player and disable the materialize button
			if (!can_afford_a_unit) {
				const materializeButtonText = document.querySelector('#materialize_button p') as HTMLElement;
				if (materializeButtonText) {
					materializeButtonText.textContent = game.msg.ui.dash.noPlasma;
				}
				this.materializeButton.changeState(ButtonStateEnum.disabled);
			}
			// Otherwise, let's have it show a random creature on click
			else {
				const materializeButtonText = document.querySelector('#materialize_button p') as HTMLElement;
				if (materializeButtonText) {
					materializeButtonText.textContent = game.msg.ui.dash.selectUnit;
				}
				// Bind button for random unit selection
				this.materializeButton.click = () => {
					this.lastViewedCreature = this.showRandomCreature();
				};
				// Apply the changes
				const cardSideA = document.querySelector('#card .sideA') as HTMLElement;
				if (cardSideA) {
					cardSideA.addEventListener('click', this.materializeButton.click);
					cardSideA.classList.remove('disabled');
				}
				this.materializeButton.changeState(ButtonStateEnum.glowing);
			}			} else if (
				activeCreature.abilities[3].used &&
				game.playerManager.activeCreature.isDarkPriest() &&
				player == game.playerManager.activeCreature.player.id &&
				(clickMethod == 'emptyHex' || clickMethod == 'portrait' || clickMethod == 'grid')
			) {
				if (summonedOrDead) {
					const materializeButton = document.querySelector('#materialize_button') as HTMLElement;
					if (materializeButton) {
						materializeButton.style.display = 'none';
					}
				} else if (clickMethod == 'portrait' && creatureType != '--') {
					const materializeButton = document.querySelector('#materialize_button') as HTMLElement;
					if (materializeButton) {
						materializeButton.style.display = 'none';
					}
				} else {
					const materializeButtonText = document.querySelector('#materialize_button p') as HTMLElement;
					if (materializeButtonText) {
						materializeButtonText.textContent = game.msg.ui.dash.materializeUsed;
					}
					const materializeButton = document.querySelector('#materialize_button') as HTMLElement;
					if (materializeButton) {
						materializeButton.style.display = '';
					}
				}
			} else {
				const materializeButton = document.querySelector('#materialize_button') as HTMLElement;
				if (materializeButton) {
					materializeButton.style.display = 'none';
				}
			}
			}		} else {
			// Card A
			const cardSideA = document.querySelector('#card .sideA') as HTMLElement;
			if (cardSideA) {
				cardSideA.style.backgroundImage = `url('${getUrl('cards/margin')}'), url('${getUrl(
					'units/artwork/' + stats.name,
				)}')`;
			}
			
			const cardSideAInfo = document.querySelector('#card .sideA .section.info') as HTMLElement;
			const classList = cardSideAInfo?.className.replace(/sin[- AEGLPSW]/g, '') || '';
			if (cardSideAInfo) {
				cardSideAInfo.className = classList;
				cardSideAInfo.classList.add('sin' + stats.type.substring(0, 1));
			}
			addCardCharacterInfo();
			
			// Card B
			Object.entries(stats.stats).forEach(([key, value]) => {
				const statEl = document.querySelector(`#card .sideB .${key} .value`) as HTMLElement;
				if (statEl) {
					statEl.classList.remove('buff');
					statEl.classList.remove('debuff');
					statEl.textContent = String(value);
				}
			});

			// Abilities
			Object.entries(stats.ability_info).forEach(([key]) => {
				const abilityEl = document.querySelector(`#card .sideB .abilities .ability:nth-child(${parseInt(key) + 1})`) as HTMLElement;
				if (abilityEl) {
					const iconEl = abilityEl.querySelector('.icon') as HTMLElement;
					if (iconEl) {
						iconEl.style.backgroundImage = `url('${getUrl('units/abilities/' + stats.name + ' ' + key)}')`;
					}
					
					const titleEl = abilityEl.querySelector('.wrapper .info h3') as HTMLElement;
					if (titleEl) {
						titleEl.textContent = stats.ability_info[key].title;
					}
					
					const descEl = abilityEl.querySelector('.wrapper .info #desc') as HTMLElement;
					if (descEl) {
						descEl.innerHTML = stats.ability_info[key].desc;
					}
					
					const infoEl = abilityEl.querySelector('.wrapper .info #info') as HTMLElement;
					if (infoEl) {
						infoEl.innerHTML = stats.ability_info[key].info;
					}
					
					// Check for an upgrade					
					const upgradeEl = abilityEl.querySelector('.wrapper .info #upgrade') as HTMLElement;
					if (upgradeEl) {
						if (stats.ability_info[key].upgrade) {
							upgradeEl.textContent = 'Upgrade: ' + stats.ability_info[key].upgrade;
						} else {
							upgradeEl.textContent = ' ';
						}
					}					const costEl = abilityEl.querySelector('.wrapper .info #cost') as HTMLElement;
					if (costEl) {
						if (stats.ability_info[key].costs !== undefined && key !== '0') {
							costEl.textContent = ' - costs ' + stats.ability_info[key].costs.energy + ' energy pts.';
						} else {
							costEl.textContent = ' - this ability is passive.';
						}
					}
				}
			});			// Materialize button
			this.materializeButton.changeState(ButtonStateEnum.disabled);
			const materializeButtonText = document.querySelector('#materialize_button p') as HTMLElement;
			if (materializeButtonText) {
				materializeButtonText.textContent = game.msg.ui.dash.heavyDev;
			}
			const materializeButton = document.querySelector('#materialize_button') as HTMLElement;
			if (materializeButton) {
				materializeButton.style.display = '';
			}
			const cardSideAToDisable = document.querySelector('#card .sideA') as HTMLElement;
			if (cardSideAToDisable) {
				cardSideAToDisable.classList.add('disabled');
				cardSideAToDisable.removeEventListener('click', cardSideAToDisable.onclick);
			}

			// OpenCollective Banner
			const bannerTitles = ['sponsor', 'backer', 'helper'];
			const bannerObject = document.querySelector('#opencollective_banner > object') as HTMLObjectElement;
			if (bannerObject) {
				bannerObject.setAttribute('data',
					`https://opencollective.com/MythosTactica/tiers/${
						bannerTitles[Math.floor(Math.random() * bannerTitles.length)]
					}.svg?avatarHeight=61&width=800&limit=10`
				);
			}
		}
	}

	/**
	 * Selects a random available unit and shows its card on the dash.
	 *
	 * Calls showCreature(chosenRandomUnit, activePlayerID, '') to handle opening the dash.
	 *
	 * Called by toggleDash with the randomize option and by clicking the materialize button
	 * when it reads "Please select..."
	 *
	 * @returns ID of the random creature selected.
	 */	showRandomCreature() {
		const game = this.game;
		
		// Check if we have the necessary data
		if (!game.players || !game.playerManager.activeCreature || !game.playerManager.activeCreature.player) {
			console.warn('showRandomCreature: Missing required game data');
			return '--'; // Default to priest
		}
		
		// Figure out what the active player can summon
		const activePlayer = game.players[game.playerManager.activeCreature.player.id];
		if (!activePlayer || !activePlayer.creatures || !activePlayer.availableCreatures) {
			console.warn('showRandomCreature: Active player or player data is missing');
			return '--'; // Default to priest
		}
		
		const deadOrSummonedTypes = activePlayer.creatures.map((creature) => creature.type);		const availableTypes = activePlayer.availableCreatures.filter(
			(el) => !deadOrSummonedTypes.includes(el),
		);

		// If no available types, default to priest
		if (availableTypes.length === 0) {
			console.warn('showRandomCreature: No available creatures to summon');
			this.showCreature('--', game.playerManager.activeCreature.team, '');
			return '--';
		}

		// Randomize array to grab a random creature
		for (let i = availableTypes.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = availableTypes[i];
			availableTypes[i] = availableTypes[j];
			availableTypes[j] = temp;
		}

		// Grab the first creature we can afford (if none, default to priest)
		let typeToPass = '--';
		availableTypes.some((creature) => {
			const lvl = creature.substring(1, 2) - 0;
			const size = game.retrieveCreatureStats(creature).size - 0;
			const plasmaCost = lvl + size;

			if (plasmaCost <= activePlayer.plasma) {
				typeToPass = creature;
				return true;
			}

			return false;
		});

		// Show the random unit selected
		this.showCreature(typeToPass, game.playerManager.activeCreature.team, '');

		return typeToPass;
	}

	selectAbility(i) {
		this.checkAbilities();
		this.selectedAbility = i;

		if (i > -1) {
			this.showAbilityCosts(i);
			this.abilitiesButtons[i].changeState(ButtonStateEnum.active);
			this.activeAbility = true;
		} else {
			this.hideAbilityCosts();
			this.activeAbility = false;
		}
	}

	/**
	 * Change to the specified player tab in the dash
	 * @param{number} id - player id (integer)
	 */	changePlayerTab(id) {
		const game = this.game;

		// Check if we have the necessary data
		if (!game.players || !game.players[id]) {
			console.warn('changePlayerTab: Player', id, 'not found or players array is empty');
			return;
		}

		// Check if dash element exists
		if (!this.dash) {
			console.warn('changePlayerTab: Dash element not found');
			return;
		}

		this.selectedPlayer = id;
		
		// Remove existing selection classes and add the new one
		this.dash.classList.remove('selected0', 'selected1', 'selected2', 'selected3');
		this.dash.classList.add('selected' + id);

		// Update all vignettes in the grid
		const gridVignettes = this.grid.querySelectorAll('.vignette');
		gridVignettes.forEach(vignette => {
			vignette.classList.remove('active', 'dead', 'queued', 'notsummonable');
			vignette.classList.add('locked');
		});
		const tabwrapper = document.getElementById('tabwrapper');
		const playertabswrapper = document.getElementById('playertabswrapper');
		if (tabwrapper) tabwrapper.style.display = 'block';
		if (playertabswrapper) playertabswrapper.style.display = 'block';
				// Check if player has availableCreatures before trying to iterate
		const player = game.players[id];
		if (!player.availableCreatures || !Array.isArray(player.availableCreatures)) {
			console.warn('changePlayerTab: Player', id, 'has no availableCreatures array');
			return;
		}
		
		console.log(`[DEBUG] changePlayerTab: Player ${id} has ${player.availableCreatures.length} available creatures:`, player.availableCreatures);
		
		// Change creature status
		player.availableCreatures.forEach((creature) => {
			const vignette = this.grid.querySelector(`[creature='${creature}']`);
			if (vignette) {
				vignette.classList.remove('locked');
			}

			const lvl = creature.substring(1, 2) - 0,
				size = game.retrieveCreatureStats(creature).size - 0,
				plasmaCost = lvl + size;

			if (plasmaCost > player.plasma) {
				const vignetteNotAffordable = this.grid.querySelector(`[creature='${creature}']`);
				if (vignetteNotAffordable) {
					vignetteNotAffordable.classList.add('notsummonable');
				}
			}
		});
		// Check if the player has creatures before iterating
		if (player.creatures && Array.isArray(player.creatures)) {
			player.creatures.forEach((creature) => {
				const creaVignette = this.grid.querySelector(`[creature='${creature.type}']`);

				if (creaVignette) {
					creaVignette.classList.remove('notsummonable');
					if (creature.dead === true) {
						creaVignette.classList.add('dead');
					} else {
						creaVignette.classList.add('queued');
					}
				}
			});
		}
		// Bind creature vignette click
		const vignetteElements = this.grid.querySelectorAll('.vignette');
		vignetteElements.forEach(vignette => {
			// Remove existing click listeners by cloning element
			const newVignette = vignette.cloneNode(true) as HTMLElement;
			vignette.parentNode?.replaceChild(newVignette, vignette);
			
			// Add new click listener			
			newVignette.addEventListener('click', (e) => {
				e.preventDefault();
				if (game.freezedInput) {
					return;
				}
				
				if ((e.currentTarget as HTMLElement).classList.contains('locked')) {
					const tooltip = this.dash.querySelector('#tooltip');
					if (tooltip) tooltip.textContent = 'Creature locked.';
				}

				const creatureType = (e.currentTarget as HTMLElement).getAttribute('creature'); // CreatureType
				this.lastViewedCreature = creatureType;
				this.showCreature(creatureType, this.selectedPlayer, 'grid');
			});
		});
	}toggleMusicPlayer() {
		const musicWrapper = document.querySelector('#musicplayerwrapper') as HTMLElement;
		if (musicWrapper) {
			musicWrapper.classList.toggle('hide');
		}
	}

	closeMusicPlayer() {
		const musicWrapper = document.querySelector('#musicplayerwrapper') as HTMLElement;
		if (musicWrapper) {
			musicWrapper.classList.add('hide');
		}
	}	// Function to close scoreboard if pressing outside of it
	easyScoreClose(e) {
		const score = document.getElementById('scoreboard');
		const scoreboard = document.getElementById('scoreboard');

		// Check if the target of the click isn't the scoreboard nor a descendant of it
		if (score && !score.contains(e.target)) {
			if (scoreboard) {
				scoreboard.removeEventListener('click', this.easyScoreClose);
				scoreboard.style.display = 'none';
			}
		}
	}
	toggleScoreboard(gameOver) {
		const game = this.game;

		// If the scoreboard is already displayed, hide it and return
		if (!this.scoreboard.classList.contains('hide')) {
			this.closeScoreboard();

			return;
		}

		// Binding the click outside of the scoreboard to close the view
		this.scoreboard.addEventListener('click', this.easyScoreClose);

		// Configure scoreboard data
		const scoreboardTitle = this.scoreboard.querySelector('#scoreboardTitle');
		if (scoreboardTitle) {
			scoreboardTitle.textContent = 'Current Score';
		}
		// Calculate the time cost of the last turn
		const skipTurn = new Date().getTime(),
			p = game.playerManager.activeCreature.player;

		p.totalTimePool = Number(p.totalTimePool) - (skipTurn - p.startTime);

		const $table = document.querySelector('#scoreboard table tbody');

		// Write table for number players

		// Clear table
		const tableMeta = [
			{
				cls: 'player_name',
				title: 'Players',
			},
			{
				cls: 'firstKill',
				emoji: emoji.get('syringe'),
				title: 'First blood',
			},
			{
				cls: 'kill',
				emoji: emoji.get('skull'),
				title: 'Kills',
			},
			{
				cls: 'combo',
				emoji: emoji.get('chains'),
				title: 'Combos',
			},
			{
				cls: 'humiliation',
				emoji: emoji.get('baby'),
				title: 'Humiliation',
			},
			{
				cls: 'annihilation',
				emoji: emoji.get('coffin'),
				title: 'Annihilation',
			},
			{
				cls: 'deny',
				emoji: emoji.get('collision'),
				title: 'Denies',
			},
			{
				cls: 'pickupDrop',
				emoji: emoji.get('cherries'),
				title: 'Drops picked',
			},
			{
				cls: 'timebonus',
				emoji: emoji.get('alarm_clock'),
				title: 'Time Bonus',
			},
			{
				cls: 'nofleeing',
				emoji: emoji.get('chicken'),
				title: 'No Fleeing',
			},
			{
				cls: 'creaturebonus',
				emoji: emoji.get('heartbeat'),
				title: 'Survivor Units',
			},
			{
				cls: 'darkpriestbonus',
				title: 'Survivor Dark Priest',
			},
			{
				cls: 'immortal',
				emoji: emoji.get('bat'),
				title: 'Immortal',
			},
			{
				cls: 'upgrade',
				emoji: emoji.get('medal'),
				title: 'Ability Upgrades',
			},
			{
				cls: 'total',
				emoji: emoji.get('100'),
				title: 'Total',
			},
		];
		tableMeta.forEach((row) => {
			const rowElement = $table.querySelector(`tr.${row.cls}`);
			if (rowElement) {
				rowElement.innerHTML = '';
				rowElement.innerHTML = `<td>
			${row.emoji ? `<span class="tooltiptext">${row.title}</span>${row.emoji}` : `${row.title}`}
			</td>`;

				// Add cells for each player
				for (let i = 0; i < game.playerMode; i++) {
					const cell = document.createElement('td');
					cell.textContent = '--';
					rowElement.appendChild(cell);
				}
			}
		});

		// Fill the board
		for (let i = 0; i < game.playerMode; i++) {
			// Each player
			// TimeBonus
			if (game.timePool > 0) {
				game.players[i].bonusTimePool = Math.round(game.players[i].totalTimePool / 1000);
			}

			//----------Display-----------//
			const colId = game.playerMode > 2 ? i + 2 + ((i % 2) * 2 - 1) * Math.min(1, i % 3) : i + 2;			// Change Name
			const playerNameRow = $table.querySelector('tr.player_name');
			if (playerNameRow) {
				const playerNameCell = playerNameRow.querySelector(`td:nth-child(${colId})`);
				if (playerNameCell) {
					playerNameCell.textContent = game.players[i].name;
				}
			}

			// Change score			
			Object.entries(game.players[i].getScore()).forEach(([index, val]) => {
				const text = val === 0 && index !== 'total' ? '--' : String(val);
				const scoreRow = $table.querySelector(`tr.${index}`);
				if (scoreRow) {
					const scoreCell = scoreRow.querySelector(`td:nth-child(${colId})`);
					if (scoreCell) {
						scoreCell.textContent = text;
					}
				}
			});
		}		if (gameOver) {
			// Set title
			const scoreboardTitle = this.scoreboard.querySelector('#scoreboardTitle') as HTMLElement;
			if (scoreboardTitle) {
				scoreboardTitle.textContent = 'Match Over';
			}

			// Declare winner
			if (game.playerMode > 2) {
				// 2 vs 2
				const score1 = game.players[0].getScore().total + game.players[2].getScore().total,
					score2 = game.players[1].getScore().total + game.players[3].getScore().total;

				const scoreboardText = document.querySelector('#scoreboard p');
				if (score1 > score2) {
					// Left side wins
					if (scoreboardText) {
						scoreboardText.textContent = game.players[0].name + ' and ' + game.players[2].name + ' won the match!';
					}
				} else if (score1 < score2) {
					// Right side wins
					if (scoreboardText) {
						scoreboardText.textContent = game.players[1].name + ' and ' + game.players[3].name + ' won the match!';
					}
				} else if (score1 == score2) {
					// Draw
					if (scoreboardText) {
						scoreboardText.textContent = 'Draw!';
					}
				}
			} else {
				// 1 vs 1
				const score1 = game.players[0].getScore().total,
					score2 = game.players[1].getScore().total;

				const scoreboardText = document.querySelector('#scoreboard p');
				if (score1 > score2) {
					// Left side wins
					if (scoreboardText) {
						scoreboardText.textContent = game.players[0].name + ' won the match!';
					}
				} else if (score1 < score2) {
					// Right side wins
					if (scoreboardText) {
						scoreboardText.textContent = game.players[1].name + ' won the match!';
					}
				} else if (score1 == score2) {
					// Draw
					if (scoreboardText) {
						scoreboardText.textContent = 'Draw!';
					}
				}
			}
		}
		// Finally, show the scoreboard
		this.scoreboard.classList.remove('hide');
	}

	closeScoreboard() {
		this.scoreboard.classList.add('hide');
	}

	/**
	 * Show the dash and hide some buttons
	 * @param{boolean} [randomize] - True selects a random creature from the grid.
	 */	toggleDash(randomize) {
		const game = this.game,
			creature = game.activeCreature;

		if (this.dash.classList.contains('active')) {
			this.clickedAbility = -1;
			this.closeDash();
			return;
		}

		game.signals.ui.dispatch('onOpenDash');
		if (randomize && !this.lastViewedCreature) {
			// Optional: select a random creature from the grid
			this.showRandomCreature();
		} else if (!randomize) {
			this.showCreature('--', game.playerManager.activeCreature.team, '');
		} else if (this.lastViewedCreature) {
			this.showCreature(this.lastViewedCreature, game.playerManager.activeCreature.team, '');
		} else {
			this.showCreature(game.playerManager.activeCreature.type, game.playerManager.activeCreature.team, '');
		}
	}	closeDash() {
		const game = this.game;

		// Remove the 'active' class using native DOM
		this.dash.classList.remove('active');
		
		// Set up CSS transition using native styles
		Object.assign(this.dash.style, {
			'transition': `opacity ${this.dashAnimSpeed}ms linear`,
			'opacity': '0'
		});
		
		// Use setTimeout to replicate the transition callback
		setTimeout(() => {
			this.dash.style.display = 'none';
		}, this.dashAnimSpeed);

		if (this.materializeToggled && game.activeCreature && game.playerManager.activeCreature.type === '--') {
			game.playerManager.activeCreature.queryMove();
		}

		this.dashopen = false;
		this.materializeToggled = false;
	}

	gridSelectUp() {
		// 🔁 Updated: Use showCreature(...) to ensure both UI panel and grid highlight stay in sync

		const game = this.game;
		const creatureType = this.selectedCreature;

		if (creatureType === '--') {
			this.showCreature('W1', this.selectedPlayer, '');
			return;
		}

		const currentRealmIndex = game.realms.indexOf(creatureType[0]);
		const newRealm = game.realms[currentRealmIndex - 1];
		if (newRealm && newRealm !== '-') {
			const nextCreature = newRealm + creatureType[1];
			this.showCreature(nextCreature, this.selectedPlayer, '');
		}
	}

	gridSelectDown() {
		// 🔁 Updated: Use showCreature(...) to ensure both UI panel and grid highlight stay in sync

		const game = this.game;
		const creatureType = this.selectedCreature;
		if (creatureType === '--') {
			this.showCreature('A1', this.selectedPlayer, '');
			return;
		}

		const currentRealmIndex = game.realms.indexOf(creatureType[0]);
		const newRealm = game.realms[currentRealmIndex + 1];
		if (newRealm) {
			const nextCreature = newRealm + creatureType[1];
			this.showCreature(nextCreature, this.selectedPlayer, '');
		}
	}

	gridSelectLeft() {
		// 🔁 Updated: Use showCreature(...) to ensure both UI panel and grid highlight stay in sync

		const creatureType = this.selectedCreature === '--' ? 'A0' : this.selectedCreature;

		const col = parseInt(creatureType[1]);
		if (col - 1 < 1) return;
		const nextCreature = creatureType[0] + (col - 1);
		this.showCreature(nextCreature, this.selectedPlayer, '');
	}

	gridSelectRight() {
		// 🔁 Updated: Use showCreature(...) to ensure both UI panel and grid highlight stay in sync

		const creatureType = this.selectedCreature === '--' ? 'A8' : this.selectedCreature;

		const col = parseInt(creatureType[1]);
		if (col + 1 > 7) return;
		const nextCreature = creatureType[0] + (col + 1);
		this.showCreature(nextCreature, this.selectedPlayer, '');
	}

	gridSelectNext() {
		const game = this.game;
		const isDarkPriest = this.selectedCreature === '--';
		const creatureType = isDarkPriest ? 'A0' : this.selectedCreature;
		let valid;
		let nextCreature;

		if (parseInt(creatureType[1]) + 1 > 7) {
			// End of row
			if (game.realms.indexOf(creatureType[0]) + 1 < game.realms.length) {
				const realm = game.realms[game.realms.indexOf(creatureType[0]) + 1];				// Test If Valid Creature
				if (game.players[this.selectedPlayer].availableCreatures.includes(realm + '1')) {
					valid = true;

					for (let i = 0, len = game.players[this.selectedPlayer].creatures.length; i < len; i++) {
						const creature = game.players[this.selectedPlayer].creatures[i];

						if (creature instanceof Creature && creature.type == realm + '1' && creature.dead) {
							valid = false;
						}
					}					if (valid) {
						nextCreature = realm + '1';
						this.lastViewedCreature = nextCreature;
						this.showCreature(nextCreature, this.selectedPlayer, '');
						return;
					}
				}

				this.selectedCreature = realm + '1';
			} else {
				return;
			}		} else {
			// Test If Valid Creature
			if (
				game.players[this.selectedPlayer].availableCreatures.includes(
					creatureType[0] + (parseInt(creatureType[1]) + 1)
				)
			) {
				valid = true;

				for (let i = 0, len = game.players[this.selectedPlayer].creatures.length; i < len; i++) {
					const creature = game.players[this.selectedPlayer].creatures[i];

					if (
						creature instanceof Creature &&
						creature.type == creatureType[0] + (parseInt(creatureType[1]) + 1) &&
						creature.dead
					) {
						valid = false;
					}
				}				if (valid) {
					nextCreature = creatureType[0] + (parseInt(creatureType[1]) + 1);
					this.lastViewedCreature = nextCreature;
					this.showCreature(nextCreature, this.selectedPlayer, '');
					return;
				}
			}

			this.selectedCreature = creatureType[0] + (parseInt(creatureType[1]) + 1);
		}

		this.gridSelectNext();
	}

	gridSelectPrevious() {
		const game = this.game;
		const creatureType = this.selectedCreature == '--' ? 'W8' : this.selectedCreature;
		let valid;
		let nextCreature;

		if (parseInt(creatureType[1]) - 1 < 1) {
			// End of row
			if (game.realms.indexOf(creatureType[0]) - 1 > -1) {
				const realm = game.realms[game.realms.indexOf(creatureType[0]) - 1];				// Test if valid creature
				if (game.players[this.selectedPlayer].availableCreatures.includes(realm + '7')) {
					valid = true;

					for (let i = 0, len = game.players[this.selectedPlayer].creatures.length; i < len; i++) {
						const creature = game.players[this.selectedPlayer].creatures[i];

						if (creature instanceof Creature && creature.type == realm + '7' && creature.dead) {
							valid = false;
						}
					}					if (valid) {
						nextCreature = realm + '7';
						this.lastViewedCreature = nextCreature;
						this.showCreature(nextCreature, this.selectedPlayer, '');
						return;
					}
				}

				this.selectedCreature = realm + '7';
			} else {
				return;
			}
		} else {			// Test if valid creature			
			if (
				game.players[this.selectedPlayer].availableCreatures.includes(
					creatureType[0] + (parseInt(creatureType[1]) - 1)
				)
			) {
				valid = true;

				for (let i = 0, len = game.players[this.selectedPlayer].creatures.length; i < len; i++) {
					const creature = game.players[this.selectedPlayer].creatures[i];					if (
						creature instanceof Creature &&
						creature.type == creatureType[0] + (parseInt(creatureType[1]) - 1) &&
						creature.dead
					) {
						valid = false;
					}
				}				if (valid) {
					nextCreature = creatureType[0] + (parseInt(creatureType[1]) - 1);
					this.lastViewedCreature = nextCreature;
					this.showCreature(nextCreature, this.selectedPlayer, '');
					return;
				}
			}

			this.selectedCreature = creatureType[0] + (parseInt(creatureType[1]) - 1);
		}

		this.gridSelectPrevious();
	}
	/**
	 * Change ability buttons and bind events
	 */
	changeAbilityButtons() {
		const game = this.game,
			creature = game.activeCreature;		this.abilitiesButtons.forEach((btn) => {
			const ab = creature.abilities[btn.abilityId];
			btn.css.normal = {
				'background-image': `url('${getUrl(
					'units/abilities/' + creature.name + ' ' + btn.abilityId,
				)}')`,
			};
			// Find the description element next to the button
			const buttonElement = btn.$button;
			const descElement = buttonElement?.nextElementSibling;
			if (descElement && descElement.classList.contains('desc')) {
				const titleSpan = descElement.querySelector('span.title');
				const descP = descElement.querySelector('p.description');
				const infoP = descElement.querySelector('p.full-info');
				
				if (titleSpan) titleSpan.textContent = ab?.title || '';
				if (descP) descP.innerHTML = ab?.desc || '';
				if (infoP) infoP.innerHTML = ab?.info || '';
			}
			btn.changeState(); // Apply changes
		});
	}
	/* updateActiveBox()
	 *
	 * Update activebox with new current creature's abilities
	 */	banner(message) {
		const bannerElement = document.querySelector('#banner') as HTMLElement;
		if (bannerElement) {
			bannerElement.textContent = message;
		}
	}
		updateActivebox() {
		const game = this.game,
			creature = game.activeCreature;

		const abilitiesButtons = document.querySelectorAll('#abilities .ability') as NodeListOf<HTMLElement>;
		abilitiesButtons.forEach(button => {
			button.removeEventListener('click', null);
		});
		
		// Use native DOM methods since we're transitioning away from jQuery
		const activebox = document.getElementById('activebox');
		const abilitiesPanel = document.getElementById('abilities');
		
		if (activebox && abilitiesPanel) {
			// Hide panel first
			abilitiesPanel.style.transform = 'translateY(-420px)';
			abilitiesPanel.style.transition = 'transform 500ms ease-in-out';
					setTimeout(() => {
				// Update panel classes and content
				abilitiesPanel.className = abilitiesPanel.className.replace(/p[0-3]/g, '');
				abilitiesPanel.classList.add('p' + creature.player.id);

				this.energyBar.setSize(creature.oldEnergy / creature.stats.energy);
				this.healthBar.setSize(creature.oldHealth / creature.stats.health);

				this.btnAudio.changeState(ButtonStateEnum.normal);
					this.btnSkipTurn.changeState(ButtonStateEnum.normal);
					this.btnFullscreen.changeState(ButtonStateEnum.normal);					// Change ability buttons
					this.changeAbilityButtons();
					// Update upgrade info
					this.updateAbilityUpgrades();
					// Callback after final transition
					const abilitiesElement = document.getElementById('abilities');
					if (abilitiesElement) {
						abilitiesElement.style.transform = 'translateY(0px)';
						abilitiesElement.style.transition = 'transform 500ms ease-out';
						
						setTimeout(() => {
							this.btnAudio.changeState(ButtonStateEnum.slideIn);
							this.btnSkipTurn.changeState(ButtonStateEnum.slideIn);
							this.btnFullscreen.changeState(ButtonStateEnum.slideIn);
							if (creature.canWait && game.queue.getCurrentQueueLength() > 1) {
								this.btnDelay.changeState(ButtonStateEnum.slideIn);
							}
							this.checkAbilities();
						}, 500);
					}
				},
			);
			if (game.multiplayer) {
				if (!this.active) {
					game.freezedInput = true;
				} else {
					game.freezedInput = false;
				}
			}
		}
	}

	updateAudioIcon(mode: string): void {
		let iconKey = 'icons/audio';
		let tooltipText = 'Audio: Full';

		if (mode === 'sfx') {
			iconKey = 'icons/SFX';
			tooltipText = 'Audio: SFX';
		} else if (mode === 'muted') {
			iconKey = 'icons/muted';
			tooltipText = 'Audio: Muted';
		}
				const iconUrl = getUrl(iconKey);
		const audioImg = document.querySelector('#audio img') as HTMLImageElement;
		if (audioImg) {
			audioImg.src = iconUrl;
		}

		const tooltip = document.querySelector('#audio-tooltip') as HTMLElement;
		if (tooltip) {
			tooltip.textContent = tooltipText;
		}
	}
	updateAbilityUpgrades(): void {
		const game = this.game,
			creature = game.activeCreature;

		// Change ability buttons
		this.abilitiesButtons.forEach((btn) => {
			const ab = creature.abilities[btn.abilityId];
			const buttonElement = btn.$button[0] || btn.$button;
			const $desc = buttonElement?.nextElementSibling?.classList.contains('desc') 
				? buttonElement.nextElementSibling 
				: buttonElement?.parentElement?.querySelector('.desc');			// Play the ability upgrade animation and sound when it gets upgraded
			if (
				!ab.upgraded &&
				ab.usesLeftBeforeUpgrade() === 0 &&
				(ab.used || !ab.isUpgradedPerUse()) &&
				game.abilityUpgrades != 0
			) {
				// Add the class for the background image and fade transition
				const upgradeButtonElement = btn.$button[0] || btn.$button;
				if (upgradeButtonElement?.classList) {
					upgradeButtonElement.classList.add('upgradeTransition');
					upgradeButtonElement.classList.add('upgradeIcon');
				}

				btn.changeState(ButtonStateEnum.slideIn); // Keep the button in view

				// After .3s play the upgrade sound
				setTimeout(() => {
					game.soundsys.playSFX('sounds/upgrade');
				}, 300);

				// After 2s remove the background and update the button if it's not a passive
				setTimeout(() => {
					const upgradeButtonElement = btn.$button[0] || btn.$button;
					if (upgradeButtonElement?.classList) {
						upgradeButtonElement.classList.remove('upgradeIcon');
					}
				}, 1200);

				// Then remove the animation
				this.animationUpgradeTimeOutID = setTimeout(() => {
					const upgradeButtonElement = btn.$button[0] || btn.$button;
					if (upgradeButtonElement?.classList) {
						upgradeButtonElement.classList.remove('upgradeTransition');
					}
					if (ab.isUpgradedPerUse()) {
						btn.changeState(ButtonStateEnum.disabled);
					}
				}, 1500);

				ab.setUpgraded(); // Set the ability to upgraded
			}

			// Change the ability's frame when it gets upgraded
			const frameButtonElement = btn.$button[0] || btn.$button;
			if (ab.isUpgraded()) {
				if (frameButtonElement?.classList) {
					frameButtonElement.classList.add('upgraded');
				}
			} else {
				if (frameButtonElement?.classList) {
					frameButtonElement.classList.remove('upgraded');
				}
			}// Add extra ability info
			const $abilityInfo = $desc?.querySelector('.abilityinfo_content');
			if ($abilityInfo) {
				const infoElements = $abilityInfo.querySelectorAll('.info');
				infoElements.forEach(el => el.remove());

				const costsString = ab.getFormattedCosts();
				if (costsString) {
					const costsDiv = document.createElement('div');
					costsDiv.className = 'info costs';
					costsDiv.innerHTML = 'Costs : ' + costsString;
					$abilityInfo.appendChild(costsDiv);
				}

				const dmgString = ab.getFormattedDamages();
				if (dmgString) {
					const dmgDiv = document.createElement('div');
					dmgDiv.className = 'info damages';
					dmgDiv.innerHTML = 'Damages : ' + dmgString;
					$abilityInfo.appendChild(dmgDiv);
				}

				const specialString = ab.getFormattedEffects();
				if (specialString) {
					const specialDiv = document.createElement('div');
					specialDiv.className = 'info special';
					specialDiv.innerHTML = 'Effects : ' + specialString;
					$abilityInfo.appendChild(specialDiv);
				}

				if (ab.hasUpgrade()) {
					if (!ab.isUpgraded()) {
						const upgradeDiv = document.createElement('div');
						upgradeDiv.className = 'info upgrade';
						upgradeDiv.innerHTML = 
							(ab.isUpgradedPerUse() ? 'Uses' : 'Rounds') +
							' left before upgrading : ' +
							ab.usesLeftBeforeUpgrade();
						$abilityInfo.appendChild(upgradeDiv);
					}

					const upgradeInfoDiv = document.createElement('div');
					upgradeInfoDiv.className = 'info upgrade';
					upgradeInfoDiv.innerHTML = 'Upgrade : ' + ab.upgrade;
					$abilityInfo.appendChild(upgradeInfoDiv);
				}
			}
		});	}

	checkAbilities(): void {
		let game = this.game,
			oneUsableAbility = false;
		for (let i = 0; i < 4; i++) {			const ab = game.playerManager.activeCreature.abilities[i];
			ab.message = '';
			const req = ab.require();
			ab.message = ab.used ? (game.msG?.playerManager?.abilities?.alreadyUsed || game.msg?.abilities?.alreadyUsed || 'Already used') : ab.message;

			// Tooltip for passive ability to display if there is any usable abilities or not
			if (i === 0) {
				const b = this.selectedAbility == -1 ? 4 : this.selectedAbility; // Checking usable abilities
				for (let j = 0 + 1; j < 4; j++) {					if (
						game.playerManager.activeCreature.abilities[j].require() &&
						!game.playerManager.activeCreature.abilities[j].used
					) {
						ab.message = game.msG?.playerManager?.abilities?.passiveCycle || game.msg?.abilities?.passiveCycle || 'Passive available'; // Message if there is any usable abilities
						break;
					} else {
						ab.message = game.msG?.playerManager?.abilities?.passiveUnavailable || game.msg?.abilities?.passiveUnavailable || 'Passive unavailable'; // Message if there is no usable abilities
					}
				}
			}			if (ab.message == (game.msG?.playerManager?.abilities?.passiveCycle || game.msg?.abilities?.passiveCycle)) {
				this.abilitiesButtons[i].changeState(ButtonStateEnum.slideIn);
			} else if (req && !ab.used && ab.trigger == 'onQuery') {
				this.abilitiesButtons[i].changeState(ButtonStateEnum.slideIn);
				oneUsableAbility = true;
			} else if (
				ab.message == (game.msG?.playerManager?.abilities?.noTarget || game.msg?.abilities?.noTarget) ||
				(ab.trigger != 'onQuery' && req && !ab.used)
			) {
				this.abilitiesButtons[i].changeState(ButtonStateEnum.noClick);
			} else {
				this.abilitiesButtons[i].changeState(ButtonStateEnum.disabled);
			}			// Charge
			const abilityButtonElement = this.abilitiesButtons[i].$button[0] || this.abilitiesButtons[i].$button;
			const descElement = abilityButtonElement?.nextElementSibling;
			if (descElement && descElement.classList.contains('desc')) {
				const chargeElements = descElement.querySelectorAll('.charge');
				chargeElements.forEach(el => el.remove());
				
				if (ab.getCharge !== undefined) {
					const chargeDiv = document.createElement('div');
					chargeDiv.className = 'charge';
					chargeDiv.innerHTML = 'Charge : ' + ab.getCharge().value + '/' + ab.getCharge().max;
					descElement.appendChild(chargeDiv);
				}

				// Message
				const messageElements = descElement.querySelectorAll('.message');
				messageElements.forEach(el => el.remove());
				
				if (ab.message !== '') {
					const messageDiv = document.createElement('div');
					messageDiv.className = 'message';
					messageDiv.innerHTML = ab.message;
					descElement.appendChild(messageDiv);
				}
			}
		}

		// No action possible
		if (!oneUsableAbility && game.playerManager.activeCreature.remainingMove === 0) {
			//game.skipTurn( { tooltip: "Finished" } ); // Autoskip
			game.playerManager.activeCreature.noActionPossible = true;
			this.btnSkipTurn.changeState(ButtonStateEnum.slideIn);
		}	}

	updateTimer(): void {
		const game = this.game,
			date = new Date().getTime() - game.pauseTime;

		// TurnTimePool
		if (game.turnTimePool >= 0) {
			let remainingTime =
				game.turnTimePool - Math.round((date - game.playerManager.activeCreature.player.startTime) / 1000);

			if (game.timePool > 0) {
				remainingTime = Math.min(
					remainingTime,
					Math.round(
						(game.playerManager.activeCreature.player.totalTimePool -
							(date - game.playerManager.activeCreature.player.startTime)) /
							1000,
					),
				);
			}			const id = game.playerManager.activeCreature.player.id;
			const turnTimeElement = document.querySelector('.p' + id + ' .turntime') as HTMLElement;
			if (turnTimeElement) {
				turnTimeElement.textContent = time.getTimer(remainingTime);
				// Time Alert
				if (remainingTime < 6) {
					turnTimeElement.classList.add('alert');
				} else {
					turnTimeElement.classList.remove('alert');
				}
			}

			// Time Bar
			const timeRatio = (date - game.playerManager.activeCreature.player.startTime) / 1000 / game.turnTimePool;
			this.timeBar.setSize(1 - timeRatio);
		} else {
			const turnTimeElements = document.querySelectorAll('.turntime');
			turnTimeElements.forEach(el => (el as HTMLElement).textContent = '∞');
		}

		// TotalTimePool
		if (game.timePool >= 0) {
			game.players.forEach((player) => {
				let remainingTime =
					player.id == game.playerManager.activeCreature.player.id
						? player.totalTimePool - (date - player.startTime)
						: player.totalTimePool;				remainingTime = Math.max(Math.round(remainingTime / 1000), 0);
				const timePoolElement = document.querySelector('.p' + player.id + ' .timepool') as HTMLElement;
				if (timePoolElement) {
					timePoolElement.textContent = time.getTimer(remainingTime);
				}
			});

			// Time Bar
			const poolRatio =
				(game.playerManager.activeCreature.player.totalTimePool - (date - game.playerManager.activeCreature.player.startTime)) /
				1000 /
				game.timePool;
			this.poolBar.setSize(poolRatio);
		} else {
			const timePoolElements = document.querySelectorAll('.timepool');
			timePoolElements.forEach(el => (el as HTMLElement).textContent = '∞');
		}
	}

	/**
	 * Delete and add element to the Queue container based on the game's queues
	 */
	updateQueueDisplay(): void {
		const game = this.game;
		this.queue.setQueue(game.queue, game.turn);
	}

	xrayQueue(creaID: any): void {
		this.queue.xray(creaID);
	}

	bouncexrayQueue(creaID: any): void {
		this.queue.xray(creaID);
		this.queue.bounce(creaID);
	}

	updateFatigue(): void {
		this.queue.refresh();
	}
	endGame(): void {
		this.toggleScoreboard(true);
		this.btnFlee.changeState(ButtonStateEnum.hidden);
		this.btnExit.changeState(ButtonStateEnum.normal);
	}
		showGameSetup(): void {
		this.toggleScoreboard(false);
		this.updateQueueDisplay();
		const matchMakingElement = document.querySelector('#matchMaking') as HTMLElement;
		if (matchMakingElement) {
			matchMakingElement.style.display = '';
		}
		const gameSetupElement = document.querySelector('#gameSetupContainer') as HTMLElement;
		if (gameSetupElement) {
			gameSetupElement.style.display = '';
		}
		const loaderElement = document.querySelector('#loader') as HTMLElement;
		if (loaderElement) {
			loaderElement.classList.add('hide');
		}
		this.queue.empty(Queue.IMMEDIATE);
	}

	/**
	 * Make the user confirm attempts to navigate away (refresh, back button, close
	 * tab, etc) to prevent accidentally ending the game.
	 *
	 * webpack-dev-server reloads in the development environment will bypass this check.
	 */
	confirmWindowUnload(): void {
		this.ignoreNextConfirmUnload = false;

		const confirmUnload = (event) => {
			const confirmation =
				'A game is in progress and cannot be restored, are you sure you want to leave?';

			if (this.ignoreNextConfirmUnload) {
				delete event['returnValue'];
				return;
			}

			// https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload#example
			event.preventDefault();
			event.returnValue = confirmation;
			return confirmation;
		};

		window.addEventListener('beforeunload', confirmUnload);

		// If running in webpack-dev-server, allow Live Reload events to bypass this check.
		if (process.env.NODE_ENV === 'development') {
			// https://stackoverflow.com/a/61579190/1414008
			window.addEventListener('message', ({ data: { type } }) => {
				if (type === 'webpackInvalid') {
					this.ignoreNextConfirmUnload = true;
					window.location.reload();
				}
			});
		}
	}

	private makeCreatureGrid(rasterElement: HTMLElement): HTMLElement {
		const getLink = (type) => {
			const stats = this.game.retrieveCreatureStats(type);
			const snakeCaseName = stats.name.replace(' ', '_');
			return `<a href="#${snakeCaseName}" class="vignette realm${stats.realm} type${type}" creature="${type}">
						<div class="tooltip">
							<div class="content">${stats.name}</div>
						</div>
						<div class="overlay"></div>
						<div class="border"></div>
					</a>`;
		};

		const tmpElement = document.createElement('div');
		const rasterWrapper = document.createElement('div');
		rasterWrapper.setAttribute('id', 'creatureraster');
		rasterElement.appendChild(rasterWrapper);

		for (const realm of 'AEGLPSW'.split('')) {
			for (const i of '1234567'.split('')) {
				const type = realm + i;
				tmpElement.innerHTML = getLink(type);
				rasterWrapper.appendChild(tmpElement.firstChild);
			}
		}

		return rasterElement;
	}

	private static getQuickInfo(ui, quickInfoDomElement) {
		const quickInfo = new QuickInfo(quickInfoDomElement);
		const creatureFormatter = (creature) => {
			const name = creature?.name ? capitalize(creature.name) : 'Unknown';
			const trapOrLocation = capitalize(
				creature?.hexagons[0]?.trap ? creature?.hexagons[0]?.trap?.name : ui.game.combatLocation,
			);
			const nameColorClasses =
				creature && creature.player ? `p${creature.player.id} player-text bright` : '';

			return `<div class="vignette hex">
			<div class="hexinfo frame">
			<p class="name ${nameColorClasses}">${name}</p>
			<p>${trapOrLocation}</p>
			</div>
			</div>
			`;
		};

		const playerFormatter = (player) =>
			`<div class="vignette active p${player.id}">
				<div class="playerinfo frame p${player.id}">
				<p class="name">${player.name}</p>
				<p class="points"><span>${player.getScore().total}</span> Points</p>
				<p class="plasma"><span>${player.plasma}</span> Plasma</p>
				<p class="units"><span>${player.getNbrOfCreatures() + ' / ' + ui.game.creaLimitNbr}</span> Units</p>
				<p><span class="activePlayer turntime">&#8734;</span> / <span class="timepool">&#8734;</span></p>
			</div></div>`;
		const hexFormatter = (hex) => {
			const rawName = hex.creature ? hex.creature.name : hex.drop ? hex.drop.name : hex.coord;
			const name = rawName ? capitalize(rawName) : 'Unknown';
			const trapLocationName = hex.trap ? hex.trap.name : ui.game.combatLocation;
			const trapOrLocation = trapLocationName ? capitalize(trapLocationName) : 'Unknown Location';
			const nameColorClasses =
				hex.creature && hex.creature.player ? `p${hex.creature.player.id} player-text bright` : '';
			return `<div class="vignette hex">
			<div class="hexinfo frame">
			<p class="name ${nameColorClasses}">${name}</p>
			<p>${trapOrLocation}</p>
			</div>
			</div>
			`;
		};

		const gameFormatter = (game) => {
			return `<div class="vignette hex">
			<div class="hexinfo frame">
			<p class="name">Mythos Tactica</p>
			<p>${version}</p>
			</div>
			</div>
			`;
		};

		/**
		 * NOTE: Throttling here because we want to
		 * skip a hex 'mouse out' if there's a
		 * 'mouse enter' soon after. We don't want a
		 * transition between 2 different hexes that
		 * have the same contents.
		 */
		const throttledSet = throttle(
			(str) => {
				quickInfo.set(str);
			},
			50,
			{ leading: false },
		);

		const showCurrentPlayer = () => {
			throttledSet(playerFormatter(ui.game.activePlayer));
		};

		const showHex = (hex) => {
			throttledSet(hexFormatter(hex));
		};

		const showCreature = (creature) => {
			throttledSet(creatureFormatter(creature));
		};

		const showGameInfo = () => {
			throttledSet(gameFormatter(ui.game));
		};

		const showDefault = () => {
			showCurrentPlayer();
		};

		ui.game.signals.creature.add((message) => {
			if (['abilityend', 'activate'].includes(message)) {
				showDefault();
			}
		});

		ui.game.signals.ui.add((message, payload) => {
			if (
				[
					'toggleMusicPlayer',
					'toggleDash',
					'toggleScore',
					'toggleMetaPowers',
					'closeInterfaceScreens',
					'vignettecreaturemouseleave',
					'vignetteturnendmouseleave',
				].includes(message)
			) {
				showDefault();
			} else if ('vignettecreaturemouseenter' === message) {
				showCreature(payload.creature);
			} else if ('vignetteturnendmouseenter' === message) {
				showGameInfo();
			}
		});

		ui.game.signals.hex.add((message, { hex }) => {
			if (message === 'over' && (hex.creature || hex.drop || hex.trap)) {
				showHex(hex);
			} else {
				showDefault();
			}
		});

		return quickInfo;
	}

	private static getQueue(ui, queueDomElement) {
		/**
		 * NOTE:
		 * Sets up event handlers for the Queue.
		 * Creates Queue.
		 * Attaches events to the Queue.
		 * Returns Queue.
		 */
		const ifGameNotFrozen = utils.ifGameNotFrozen(ui.game);

		const onCreatureClick = ifGameNotFrozen((creature) => {
			/**
			 * NOTE:
			 * If showing the active player's Dark Priest, open the dash using
			 * another method which restores any previously selected creature
			 * for materialization.
			 */
			if (creature.isDarkPriest() && creature.id === ui.game.playerManager.activeCreature.id) {
				ui.toggleDash();
			} else {
				ui.showCreature(creature.type, creature.player.id, 'portrait');
			}
		});

		const onCreatureMouseEnter = ifGameNotFrozen((placeholderCreature) => {
			const creatures = ui.game.creatureManager.creatures.filter((c) => c instanceof Creature);
			const creature = creatures.filter((c) => c.id === placeholderCreature.id)[0];
			const otherCreatures = creatures.filter((c) => c.id !== placeholderCreature.id);

			otherCreatures.forEach((c) => {
				c.xray(true);
				c.hexagons.forEach((hex) => {
					hex.cleanOverlayVisualState();
				});
			});
			creature.hexagons.forEach((hex) => {
				hex.overlayVisualState('hover h_player' + creature.team);
			});

			ui.game.grid.showMovementRange(creature);
			ui.queue.xray(creature.id);
		});

		const onCreatureMouseLeave = (maybeCreature) => {
			// The mouse over adds a coloured hex to the creature, so when we mouse leave we have to remove them
			const creatures = ui.game.creatureManager.creatures.filter((c) => c instanceof Creature);
			creatures.forEach((creature) => {
				creature.hexagons.forEach((hex) => {
					hex.cleanOverlayVisualState();
				});
			});

			ui.game.grid.redoLastQuery();
			creatures.forEach((creature) => {
				creature.xray(false);
			});

			ui.queue.xray(-1);
			ui.quickInfo.clear();
		};

		const onTurnEndClick = throttle(() => {
			ui.game.soundsys.playSFX('sounds/MythosTactica');
		}, 2000);
		const onTurnEndMouseEnter = ifGameNotFrozen(() => {
			if (ui.$brandlogo?.classList) {
				ui.$brandlogo.classList.remove('hide');
			}
			ui.game.grid.showGrid(true);
			ui.game.grid.showCurrentCreatureMovementInOverlay(ui.game.activeCreature);
		});

		const onTurnEndMouseLeave = () => {
			if (ui.$brandlogo?.classList) {
				ui.$brandlogo.classList.add('hide');
			}
			ui.game.grid.showGrid(false);
			ui.game.grid.cleanOverlay();
			ui.game.grid.redoLastQuery();
		};
		// Hide the project logo when navigating away using a hotkey
		document.addEventListener('visibilitychange', function () {
			if (document.hidden) {
				if (ui.$brandlogo?.classList) {
					ui.$brandlogo.classList.add('hide');
				}
			}
		});
		// Hide the project logo when navigating away using a hotkey (Ctrl+Shift+M)
		document.addEventListener('keydown', (event) => {
			if (event.ctrlKey && event.shiftKey && event.key === 'M') {
				console.log('ctrl+shift+M pressed');
				if (ui.brandlogo) {
					ui.brandlogo.classList.add('hide');
				}
			}
		});

		const SIGNAL_CREATURE_CLICK = 'vignettecreatureclick';
		const SIGNAL_CREATURE_MOUSE_ENTER = 'vignettecreaturemouseenter';
		const SIGNAL_CREATURE_MOUSE_LEAVE = 'vignettecreaturemouseleave';
		const SIGNAL_DELAY_CLICK = 'vignettedelayclick';
		const SIGNAL_DELAY_MOUSE_ENTER = 'vignettedelaymouseenter';
		const SIGNAL_DELAY_MOUSE_LEAVE = 'vignettedelaymouseleave';
		const SIGNAL_TURN_END_CLICK = 'vignetteturnendlick';
		const SIGNAL_TURN_END_MOUSE_ENTER = 'vignetteturnendmouseenter';
		const SIGNAL_TURN_END_MOUSE_LEAVE = 'vignetteturnendmouseleave';

		ui.game.signals.ui.add((msg, payload) => {
			switch (msg) {
				case SIGNAL_CREATURE_CLICK:
					onCreatureClick(payload.creature);
					break;
				case SIGNAL_CREATURE_MOUSE_ENTER:
					onCreatureMouseEnter(payload.creature);
					break;
				case SIGNAL_CREATURE_MOUSE_LEAVE:
					onCreatureMouseLeave(payload.creature);
					break;				case SIGNAL_TURN_END_CLICK:
					onTurnEndClick();
					break;
				case SIGNAL_TURN_END_MOUSE_ENTER:
					onTurnEndMouseEnter(payload.turnNumber);
					break;
				case SIGNAL_TURN_END_MOUSE_LEAVE:
					onTurnEndMouseLeave();
					break;
			}
		});

		const queueEventHandlers = {
			onCreatureClick: (creature) =>
				ui.game.signals.ui.dispatch(SIGNAL_CREATURE_CLICK, { creature }),
			onCreatureMouseEnter: (creature) =>
				ui.game.signals.ui.dispatch(SIGNAL_CREATURE_MOUSE_ENTER, { creature }),
			onCreatureMouseLeave: (creature) =>
				ui.game.signals.ui.dispatch(SIGNAL_CREATURE_MOUSE_LEAVE, { creature }),
			onDelayClick: () => ui.game.signals.ui.dispatch(SIGNAL_DELAY_CLICK, {}),
			onDelayMouseEnter: () => ui.game.signals.ui.dispatch(SIGNAL_DELAY_MOUSE_ENTER, {}),
			onDelayMouseLeave: () => ui.game.signals.ui.dispatch(SIGNAL_DELAY_MOUSE_LEAVE, {}),
			onTurnEndClick: (turnNumber) =>
				ui.game.signals.ui.dispatch(SIGNAL_TURN_END_CLICK, { turnNumber }),
			onTurnEndMouseEnter: (turnNumber) =>
				ui.game.signals.ui.dispatch(SIGNAL_TURN_END_MOUSE_ENTER, { turnNumber }),
			onTurnEndMouseLeave: (turnNumber) =>
				ui.game.signals.ui.dispatch(SIGNAL_TURN_END_MOUSE_LEAVE, { turnNumber }),
		};

		return new Queue(queueDomElement, queueEventHandlers);
	}
}

const utils = {
	ifGameNotFrozen: (game) => {
		// NOTE: Higher order function
		// Filters out function calls made when the game is frozen.
		return (fn) => {
			return (...args) => {
				if (game.freezedInput) {
					return;
				} else {
					return fn(...args);
				}
			};
		};
	},
};
