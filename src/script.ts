// Modern imports without jQuery dependencies
import { unitData } from './data/UnitData';
import Game from './game';
import { PreMatchAudioPlayer } from './sound/pre-match-audio';
import { Fullscreen } from './ui/fullscreen';
import { buttonSlide } from './ui/button';

import Connect from './multiplayer/connect';
import Authenticate from './multiplayer/authenticate';
import SessionI from './multiplayer/session';
import {
	DEBUG_AUTO_START_GAME,
	DEBUG_DISABLE_HOTKEYS,
	DEBUG_GAME_LOG,
	DEBUG_HAS_GAME_LOG,
} from './debug';

// Load the stylesheet
import './style/main.less';

export type GameConfig = ReturnType<typeof getGameConfig>;

// Utility functions for DOM manipulation (replaces jQuery)
const $ = {
	// Element selection
	get: (selector: string): HTMLElement | null => document.querySelector(selector),
	getAll: (selector: string): NodeListOf<Element> => document.querySelectorAll(selector),
	getId: (id: string): HTMLElement | null => document.getElementById(id),

	// DOM manipulation
	hide: (element: HTMLElement | null): void => {
		if (element) element.style.display = 'none';
	},
	show: (element: HTMLElement | null): void => {
		if (element) element.style.display = '';
	},
	remove: (element: HTMLElement | null): void => {
		if (element) element.remove();
	},
	addClass: (element: HTMLElement | null, className: string): void => {
		if (element) element.classList.add(className);
	},	removeClass: (element: HTMLElement | null, className: string): void => {
		if (element) element.classList.remove(className);
	},
	hasClass: (element: HTMLElement | null, className: string): boolean => {
		return element ? element.classList.contains(className) : false;
	},
	toggleClass: (element: HTMLElement | null, className: string): void => {
		if (element) element.classList.toggle(className);
	},
	setText: (element: HTMLElement | null, text: string): void => {
		if (element) element.textContent = text;
	},
	setHtml: (element: HTMLElement | null, html: string): void => {
		if (element) element.innerHTML = html;
	},
	html: (element: HTMLElement | null, content?: string): string | void => {
		if (!element) return '';
		if (content !== undefined) {
			element.innerHTML = content;
		} else {
			return element.innerHTML;
		}
	},
	text: (element: HTMLElement | null, content?: string): string | void => {
		if (!element) return '';
		if (content !== undefined) {
			element.textContent = content;
		} else {
			return element.textContent || '';
		}
	},
	getValue: (element: HTMLInputElement | null): string => {
		return element ? element.value : '';
	},
	setValue: (element: HTMLInputElement | null, value: string): void => {
		if (element) element.value = value;
	},
	setChecked: (element: HTMLInputElement | null, checked: boolean): void => {
		if (element) element.checked = checked;
	},
	isVisible: (element: HTMLElement | null): boolean => {
		if (!element) return false;
		const style = window.getComputedStyle(element);
		return style.display !== 'none' && style.visibility !== 'hidden';
	},
	// CSS visibility/display checks (jQuery replacement)
	isDisplayed: (element: HTMLElement | null): boolean => {
		if (!element) return false;
		const style = window.getComputedStyle(element);
		return style.display !== 'none';
	},
	isVisibilityHidden: (element: HTMLElement | null): boolean => {
		if (!element) return true;
		const style = window.getComputedStyle(element);
		return style.visibility === 'hidden';
	},
	getCheckedValue: (selector: string): string => {
		const element = document.querySelector(selector + ':checked') as HTMLInputElement;
		return element ? element.value : '';
	},
	trigger: (element: HTMLElement | null, eventType: string): void => {
		if (element) {
			const event = new Event(eventType, { bubbles: true, cancelable: true });
			element.dispatchEvent(event);
		}
	},
	click: (element: HTMLElement | null): void => {
		if (element) element.click();	},
	focus: (element: HTMLElement | null): void => {
		if (element) element.focus();
	},
	setProp: (element: HTMLElement | null, prop: string, value: any): void => {
		if (element) (element as any)[prop] = value;
	},
	css: (element: HTMLElement | null, styles: { [key: string]: string }): void => {
		if (element) {
			Object.keys(styles).forEach(property => {
				const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
				(element.style as any)[camelProperty] = styles[property];
			});
		}
	},
	// Event handling
	on: (selector: string | HTMLElement | Document | null, event: string, handler: EventListener): void => {
		let element: HTMLElement | Document | null;
		if (typeof selector === 'string') {
			element = document.querySelector(selector) as HTMLElement;
		} else {
			element = selector;
		}
		if (element) element.addEventListener(event, handler);
	},
	off: (selector: string | HTMLElement | null, event: string, handler?: EventListener): void => {
		let element: HTMLElement | null;
		if (typeof selector === 'string') {
			element = document.querySelector(selector) as HTMLElement;
		} else {
			element = selector;
		}
		if (element && handler) {
			element.removeEventListener(event, handler);
		} else if (element && !handler) {
			// If no handler specified, clone the element to remove all listeners
			const newElement = element.cloneNode(true);
			element.parentNode?.replaceChild(newElement, element);
		}
	},

	// Form helpers
	getFormData: (form: HTMLFormElement): { [key: string]: string } => {
		const formData = new FormData(form);
		const result: { [key: string]: string } = {};
		formData.forEach((value, key) => {
			result[key] = value as string;
		});
		return result;
	},
	// DOM ready
	ready: (callback: () => void): void => {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', callback);
		} else {
			callback();
		}
	}
};

// Export the utility functions for use in other modules
export { $ };

// Generic object we can decorate with helper methods to simply dev and user experience.
// TODO: Expose this in a less hacky way.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Too many unknown types.
const AB = {} as any;
// Create the game
const G = new Game();
// Helper properties and methods for retrieving and playing back game logs.
// TODO: Expose these in a less hacky way too.
AB.currentGame = G;
AB.getLog = () => AB.currentGame.gamelog.stringify();
AB.saveLog = () => AB.currentGame.gamelog.save();
AB.restoreGame = (str) => AB.currentGame.gamelog.load(str);
window.AB = AB;
// Also expose G globally for compatibility with external tools
(window as any).G = G;
const connect = new Connect(G);
G.connect = connect;

// Load the abilities
const abilityLoadPromises = unitData.map(async (creature) => {
	if (!creature.playable) {
		return Promise.resolve();
	}

	return import(`./abilities/${creature.name.split(' ').join('-')}`).then((generator) =>
		generator.default(G),
	);
});

// Wait for all abilities to load, then reinitialize creature abilities
Promise.all(abilityLoadPromises).then(() => {
	console.log('[DEBUG] All abilities loaded, reinitializing creature abilities...');
	G.reinitializeCreatureAbilities();
});

$.ready(() => {
	const scrim = $.get('.scrim');
	if (scrim) {
		scrim.addEventListener('transitionend', function () {
			$.remove(scrim);
		});
		$.removeClass(scrim, 'loading');
	}
	renderPlayerModeType(G.multiplayer);

	// Select a random combat location
	const locationSelectors = $.getAll("input[name='combatLocation']") as NodeListOf<HTMLInputElement>;
	const randomLocationIndex = Math.floor(Math.random() * locationSelectors.length);
	const randomLocation = locationSelectors[randomLocationIndex];
	if (randomLocation) {
		$.setChecked(randomLocation, true);
		$.trigger(randomLocation, 'click');
	}
	// Disable initial game setup until browser tab has focus
	window.addEventListener('blur', G.gameManager.onBlur.bind(G), false);
	window.addEventListener('focus', G.gameManager.onFocus.bind(G), false);

	// Function to disable scroll and arrow keys
	function disableScrollAndArrowKeys(element: HTMLElement) {
		if (!element) return;
		
		element.setAttribute('tabindex', '0'); // Set tabindex to make element focusable

		element.addEventListener('mouseover', () => {
			// Add event listener for mouse over game area
			element.focus(); // Focus the element
			element.addEventListener('wheel', (e) => {
				e.preventDefault();
			});
			element.addEventListener('keydown', (e) => {
				e.preventDefault();
			});

			element.addEventListener('mouseout', () => {
				element.blur(); // Remove focus from the element when mouse leaves game area
			});
		});
	}

	disableScrollAndArrowKeys($.getId('loader')); // Disable scroll and arrow keys for loader element

	// Add listener for Fullscreen API
	const fullscreen = new Fullscreen($.getId('fullscreen'));
	const fullscreenButton = $.getId('fullscreen');
	if (fullscreenButton) {
		fullscreenButton.addEventListener('click', () => fullscreen.toggle());
	}

	const startScreenHotkeys = {
		Space: {
			keyDownTest() {
				return true;
			},
			keyDownAction() {
				startGame();
			},
		},
		Enter: {
			keyDownTest() {
				return true;
			},
			keyDownAction() {
				startGame();
			},
		},
		KeyF: {
			keyDownTest(event) {
				return event.shiftKey;
			},
			keyDownAction() {
				fullscreen.toggle();
			},
		},
		F11: {
			keyDownTest() {
				return true;
			},
			keyDownAction(event) {
				event.preventDefault();
				fullscreen.toggle();
			},
		},
		KeyL: {
			keyDownTest(event) {
				return event.metaKey && event.ctrlKey;
			},
			keyDownAction() {
				readLogFromFile()
					.then((log) => G.gamelog.load(log as string))
					.catch((err) => {
						alert('An error occurred while loading the log file');
						console.log(err);
					});
			},
		},
	};
	// Binding Hotkeys
	if (!DEBUG_DISABLE_HOTKEYS) {
		document.addEventListener('keydown', (event) => {
			const hotkey = startScreenHotkeys[event.code];

			if (hotkey === undefined) {
				return;
			}

			const { keyDownTest, keyDownAction } = hotkey;

			if (keyDownTest.call(this, event)) {
				event.preventDefault();
				keyDownAction.call(this, event);
			}
		});
	}

	if (G.multiplayer) {
		// TODO Remove after implementation 2 vs 2 in multiplayer mode
		forceTwoPlayerMode();
	}

	// Allow button game options to slide in prematch screen	buttonSlide();

	// Create new Object to play audio in pre-match screen
	const beastAudio = new PreMatchAudioPlayer();
	$.on($.getId('gameTitle'), 'click', () => {
		beastAudio.playBeast();
	});

	// Get frequently used elements to avoid repeated DOM queries
	const singleplayerBtn = $.getId('singleplayer');
	const multiplayerBtn = $.getId('multiplayer');
	const gameSetupElement = $.getId('gameSetup');
	const startButtonElement = $.getId('startButton');
	const startMatchButton = $.getId('startMatchButton');
	const createMatchButton = $.getId('createMatchButton');
	const matchFrame = $.get('.match-frame');
	const setupFrame = $.get('.setupFrame');
	const loginregFrame = $.get('.loginregFrame');

	// Hide singleplayer option initially
	$.hide(singleplayerBtn);

	$.on(createMatchButton, 'click', () => {
		$.hide(matchFrame);
		$.show(gameSetupElement);
		renderPlayerModeType(G.multiplayer);
		$.show(startMatchButton);
		$.hide(startButtonElement);

		// TODO Remove after implementation 2 vs 2 in multiplayer mode
		forceTwoPlayerMode();
	});

	$.on(multiplayerBtn, 'click', async () => {
		$.hide(multiplayerBtn);
		$.show(singleplayerBtn);
		$.hide($.get('.setupFrame,.lobby'));
		$.show(loginregFrame);
		const sess = new SessionI(null);
		try {
			await sess.restoreSession();
		} catch (e) {
			console.log('unable to restore session', e);
			return;
		}
	});

	$.on(singleplayerBtn, 'click', async () => {
		$.show(setupFrame);
		$.hide(loginregFrame);
		$.show(multiplayerBtn);
		$.hide(singleplayerBtn);
	});
	// Focus the form to enable "press enter to start the game" functionality
	$.focus(startButtonElement);

	const startGame = () => {
		G.gameManager.loadGame(getGameConfig());
	};

	const restoreGameLog = (log) => {
		G.gamelog.load(log);
	};

	if (DEBUG_HAS_GAME_LOG) {
		setTimeout(() => restoreGameLog(DEBUG_GAME_LOG), 50);
	} else if (DEBUG_AUTO_START_GAME) {
		setTimeout(startGame, 50);
	}

	$.on($.get('form#gameSetup'), 'submit', (e) => {
		// NOTE: Prevent submission
		e.preventDefault();
		startGame();
		// NOTE: Prevent submission
		return false;
	});
	// Register
	async function register(e) {
		e.preventDefault(); // Prevent submit
		const reg = getReg();
		// Check empty fields
		const errorReq = $.get('#register .error-req');
		if ($.isDisplayed(errorReq) || !$.isVisibilityHidden(errorReq)) {
			// 'element' is hidden
			$.hide(errorReq);
			$.hide($.get('#register .error-req-message'));
		}
		if (reg.username == '' || reg.email == '' || reg.password == '' || reg.passwordmatch == '') {
			$.show(errorReq);
			$.show($.get('#register .error-req-message'));
			return;
		}
		const errorPwLength = $.get('.error-pw-length');
		if ($.isDisplayed(errorPwLength) || !$.isVisibilityHidden(errorPwLength)) {
			// 'element' is hidden
			$.hide(errorPwLength);
		}

		// Password length
		if (reg.password.split('').length < 8) {
			$.show(errorPwLength);
			return;
		}
		// Password match
		const errorPw = $.get('.error-pw');
		if ($.isDisplayed(errorPw) || !$.isVisibilityHidden(errorPw)) {
			// 'element' is hidden
			$.hide(errorPw);
		}
		if (reg.password != reg.passwordmatch) {
			$.show(errorPw);
			return;
		}
		const auth = new Authenticate(reg, connect.client);
		const session = await auth.register();
		const sess = new SessionI(session);
		sess.storeSession();
		G.session = session;
		G.client = connect.client;
		G.multiplayer = true;
		$.show($.get('.setupFrame,.welcome'));
		$.show($.get('.match-frame'));
		$.hide($.get('.loginregFrame,#gameSetup'));
		$.setText($.get('.user'), session.username);
		console.log('new user created.' + session);
		return false; // Prevent submit
	}
	$.on('form#register', 'submit', register);
	async function login(e) {
		e.preventDefault(); // Prevent submit
		const login = getLogin();
		let session;
		$.hide($.get('#login .login-error-req-message'));
		if (login.email == '' || login.password == '') {
			$.show($.get('#login .error-req'));
			$.show($.get('#login .error-req-message'));
			return;
		}
		// Check empty fields
		const loginErrorReq = $.get('#login .error-req');
		if ($.isDisplayed(loginErrorReq) || !$.isVisibilityHidden(loginErrorReq)) {
			// 'element' is hidden
			$.hide(loginErrorReq);
			$.hide($.get('#login .error-req-message'));
		}
		const auth = new Authenticate(login, connect.client);
		try {
			session = await auth.authenticateEmail();
		} catch (error) {
			$.show($.get('#login .login-error-req-message'));
			return;
		}

		const sess = new SessionI(session);
		sess.storeSession();
		G.session = session;
		G.client = connect.client;
		G.multiplayer = true;

		$.show($.get('.setupFrame,.welcome'));
		$.show($.get('.match-frame'));
		$.hide($.get('.loginregFrame,#gameSetup'));
		$.setText($.get('.user'), session.username);
		return false; // Prevent submit
	}
	// Login form
	$.on('form#login', 'submit', login);	$.on('#startMatchButton', 'click', () => {
		G.gameManager.loadGame(getGameConfig(), true);
		return false;
	});

	$.on('#joinMatchButton', 'click', () => {
		//TODO move to match data received
		$.show($.get('.lobby'));
		$.hide($.get('.setupFrame'));
		G.gameManager.matchJoin();
		return false;
	});

	$.on('#backFromMatchButton', 'click', () => {
		$.hide($.get('.lobby'));
		$.show($.get('.setupFrame,.welcome'));
	});

	$.on('#refreshMatchButton', 'click', () => {
		G.gameManager.updateLobby();
	});
});

/**
 * force 1 vs 1 game mode
 * should be removed after implementation 2 vs 2 in multiplayer mode
 */
function forceTwoPlayerMode() {
	$.click($.getId('p2'));
	$.setProp($.getId('p4'), 'disabled', true);
}

/**
 * get Registration.
 * @return {Object} login form.
 */
function getReg() {
	const reg = {
		username: $.getValue($.get('.register input[name="username"]') as HTMLInputElement),
		email: $.getValue($.get('.register input[name="email"]') as HTMLInputElement),
		password: $.getValue($.get('.register input[name="password"]') as HTMLInputElement),
		passwordmatch: $.getValue($.get('.register input[name="passwordmatch"]') as HTMLInputElement),
	};

	return reg;
}

/**
 * read log from file
 * @returns {Promise<string>}
 */
function readLogFromFile() {
	// TODO: This would probably be better off in ./src/utility/gamelog.ts
	return new Promise((resolve, reject) => {
		const fileInput = document.createElement('input') as HTMLInputElement;
		fileInput.accept = '.ab';
		fileInput.type = 'file';

		fileInput.onchange = (event) => {
			const file = (event.target as HTMLInputElement).files[0];
			const reader = new FileReader();

			reader.readAsText(file);

			reader.onload = () => {
				resolve(reader.result);
			};

			reader.onerror = () => {
				reject(reader.error);
			};
		};

		fileInput.click();
	});
}

/**
 * get Login.
 * @return {Object} login form.
 */
function getLogin() {
	const login = {
		email: $.getValue($.get('.login input[name="email"]') as HTMLInputElement),
		password: $.getValue($.get('.login input[name="password"]') as HTMLInputElement),
	};
	return login;
}

/**
 * Render the player mode text inside game form
 * @param {Boolean} isMultiPlayer Is playing in online multiplayer mode or hotSeat mode
 * @returns {Object} HTMLElement
 */
function renderPlayerModeType(isMultiPlayer) {
	const playerModeType = $.getId('playerModeType');
	return isMultiPlayer ? $.setText(playerModeType, '[ Online ]') : $.setText(playerModeType, '[ Hotseat ]');
}

/**
 * Generate game config from form and return it.
 * @return {Object} The game config.
 */
export function getGameConfig() {
	const defaultConfig = {
		playerMode: parseInt($.getCheckedValue('input[name="playerMode"]'), 10),
		creaLimitNbr: parseInt($.getCheckedValue('input[name="activeUnits"]'), 10), // DP counts as One
		unitDrops: parseInt($.getCheckedValue('input[name="unitDrops"]'), 10),
		abilityUpgrades: parseInt($.getCheckedValue('input[name="abilityUpgrades"]'), 10),
		plasma_amount: parseInt($.getCheckedValue('input[name="plasmaPoints"]'), 10),
		turnTimePool: parseInt($.getCheckedValue('input[name="turnTime"]'), 10),
		timePool: parseInt($.getCheckedValue('input[name="timePool"]'), 10) * 60,
		background_image: $.getCheckedValue('input[name="combatLocation"]'),
		combatLocation: $.getCheckedValue('input[name="combatLocation"]'),
		fullscreenMode: $.hasClass($.getId('fullscreen'), 'fullscreenMode'),
	};
	return defaultConfig;
}

/**
 * Return true if an object has no keys.
 * @param {Object} obj The object to test.
 * @return {boolean} Empty or not.
 */
export function isEmpty(obj) {
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			return false;
		}
	}

	return true;
}
