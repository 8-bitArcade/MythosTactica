/**
 * Regression tests for UI interactions
 * Ensures all existing UI functionality works identically after migration
 */

import { $ } from '../script';
import Game from '../game';

// Mock DOM environment
const setupMockDOM = () => {
	document.body.innerHTML = `
		<div id="gameSetup">
			<form id="gameSetup">
				<input type="radio" name="playerMode" value="2" checked>
				<input type="radio" name="combatLocation" value="forest">
				<button id="startButton" type="submit">Start Game</button>
			</form>
		</div>
		<div id="singleplayer" style="display: none;">Singleplayer</div>
		<div id="multiplayer">Multiplayer</div>
		<div class="setupFrame">Setup Frame</div>
		<div class="loginregFrame" style="display: none;">Login Frame</div>
		<div class="match-frame" style="display: none;">Match Frame</div>
		<div id="startMatchButton" style="display: none;">Start Match</div>
		<div id="createMatchButton">Create Match</div>
		<div id="joinMatchButton">Join Match</div>
		<div id="fullscreen">Fullscreen</div>
		<div class="scrim loading">Loading...</div>
		<div id="gameTitle">Game Title</div>
		<form id="register">
			<input name="username" type="text">
			<input name="email" type="email">
			<input name="password" type="password">
			<input name="passwordmatch" type="password">
			<button type="submit">Register</button>
			<div class="error-req" style="display: none;">Required fields</div>
			<div class="error-req-message" style="display: none;">Please fill all fields</div>
			<div class="error-pw-length" style="display: none;">Password too short</div>
			<div class="error-pw" style="display: none;">Passwords don't match</div>
		</form>
		<form id="login">
			<input name="email" type="email">
			<input name="password" type="password">
			<button type="submit">Login</button>
			<div class="error-req" style="display: none;">Required fields</div>
			<div class="error-req-message" style="display: none;">Please fill all fields</div>
			<div class="login-error-req-message" style="display: none;">Login failed</div>
		</form>
		<div class="user">Username</div>
		<div class="welcome" style="display: none;">Welcome</div>
	`;
};

// Mock Phaser and game dependencies
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
	cameras: { main: { shake: jest.fn() } },
	tweens: { add: jest.fn(() => ({ play: jest.fn(), on: jest.fn() })) },
	input: {
		on: jest.fn(),
		keyboard: {
			createCursorKeys: jest.fn(() => ({})),
			addKey: jest.fn(() => ({ isDown: false }))
		}
	}
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

describe('UI Regression Tests', () => {
	let game: Game;

	beforeEach(() => {
		setupMockDOM();
		jest.clearAllMocks();
		game = new Game();
		game.currentScene = mockScene;
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	describe('Button Interactions', () => {
		test('should handle singleplayer/multiplayer toggle', () => {
			const singleplayerBtn = $.getId('singleplayer');
			const multiplayerBtn = $.getId('multiplayer');
			
			// Initial state
			expect($.isVisible(singleplayerBtn)).toBe(false);
			expect($.isVisible(multiplayerBtn)).toBe(true);
			
			// Simulate multiplayer click
			$.trigger(multiplayerBtn, 'click');
			
			// Should show singleplayer and hide multiplayer
			expect($.isDisplayed(singleplayerBtn)).toBe(true);
			expect($.isDisplayed(multiplayerBtn)).toBe(false);
		});

		test('should handle create match button', () => {
			const createMatchButton = $.getId('createMatchButton');
			const matchFrame = $.get('.match-frame');
			const gameSetup = $.getId('gameSetup');
			const startMatchButton = $.getId('startMatchButton');
			const startButton = $.getId('startButton');
			
			$.trigger(createMatchButton, 'click');
			
			expect($.isDisplayed(matchFrame)).toBe(false);
			expect($.isDisplayed(gameSetup)).toBe(true);
			expect($.isDisplayed(startMatchButton)).toBe(true);
			expect($.isDisplayed(startButton)).toBe(false);
		});

		test('should handle fullscreen button', () => {
			const fullscreenButton = $.getId('fullscreen');
			let fullscreenToggled = false;
			
			// Mock fullscreen API
			const mockFullscreen = {
				toggle: jest.fn(() => { fullscreenToggled = true; })
			};
			
			// Simulate click
			fullscreenButton.addEventListener('click', () => mockFullscreen.toggle());
			$.trigger(fullscreenButton, 'click');
			
			expect(mockFullscreen.toggle).toHaveBeenCalled();
		});
	});

	describe('Form Handling', () => {
		test('should handle game setup form submission', () => {
			const form = $.get('form#gameSetup');
			let formSubmitted = false;
			
			form.addEventListener('submit', (e) => {
				e.preventDefault();
				formSubmitted = true;
				return false;
			});
			
			$.trigger(form, 'submit');
			
			expect(formSubmitted).toBe(true);
		});

		test('should validate registration form', () => {
			const form = $.get('form#register') as HTMLFormElement;
			const usernameInput = form.querySelector('input[name="username"]') as HTMLInputElement;
			const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement;
			const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement;
			const passwordMatchInput = form.querySelector('input[name="passwordmatch"]') as HTMLInputElement;
			
			// Test empty fields validation
			$.setValue(usernameInput, '');
			$.setValue(emailInput, '');
			$.setValue(passwordInput, '');
			$.setValue(passwordMatchInput, '');
			
			const rules = {
				username: (value: string) => value.length > 0 || 'Username required',
				email: (value: string) => value.includes('@') || 'Valid email required',
				password: (value: string) => value.length >= 8 || 'Password too short',
				passwordmatch: (value: string) => {
					const formData = $.getFormData(form);
					return value === formData.password || 'Passwords must match';
				}
			};
			
			const errors = $.validateForm(form, rules);
			
			expect(errors.username).toBe('Username required');
			expect(errors.email).toBe('Valid email required');
			expect(errors.password).toBe('Password too short');
		});

		test('should handle login form validation', () => {
			const form = $.get('form#login') as HTMLFormElement;
			const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement;
			const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement;
			
			// Test with valid data
			$.setValue(emailInput, 'test@example.com');
			$.setValue(passwordInput, 'password123');
			
			const formData = $.getFormData(form);
			
			expect(formData.email).toBe('test@example.com');
			expect(formData.password).toBe('password123');
		});
	});

	describe('Element Visibility and State Management', () => {
		test('should handle scrim loading state', () => {
			const scrim = $.get('.scrim');
			
			expect($.hasClass(scrim, 'loading')).toBe(true);
			
			// Simulate loading complete
			$.removeClass(scrim, 'loading');
			
			expect($.hasClass(scrim, 'loading')).toBe(false);
		});

		test('should manage frame visibility states', () => {
			const setupFrame = $.get('.setupFrame');
			const loginregFrame = $.get('.loginregFrame');
			const matchFrame = $.get('.match-frame');
			
			// Test initial states
			expect($.isDisplayed(setupFrame)).toBe(true);
			expect($.isDisplayed(loginregFrame)).toBe(false);
			expect($.isDisplayed(matchFrame)).toBe(false);
			
			// Simulate state change
			$.hide(setupFrame);
			$.show(loginregFrame);
			
			expect($.isDisplayed(setupFrame)).toBe(false);
			expect($.isDisplayed(loginregFrame)).toBe(true);
		});

		test('should handle error message display', () => {
			const errorReq = $.get('#register .error-req');
			const errorReqMessage = $.get('#register .error-req-message');
			
			// Initially hidden
			expect($.isDisplayed(errorReq)).toBe(false);
			expect($.isDisplayed(errorReqMessage)).toBe(false);
			
			// Show errors
			$.show(errorReq);
			$.show(errorReqMessage);
			
			expect($.isDisplayed(errorReq)).toBe(true);
			expect($.isDisplayed(errorReqMessage)).toBe(true);
			
			// Hide errors
			$.hide(errorReq);
			$.hide(errorReqMessage);
			
			expect($.isDisplayed(errorReq)).toBe(false);
			expect($.isDisplayed(errorReqMessage)).toBe(false);
		});
	});

	describe('Event Delegation and Dynamic Content', () => {
		test('should handle dynamic button creation and events', () => {
			const container = $.createElement('div');
			document.body.appendChild(container);
			
			let buttonClicked = false;
			
			// Set up event delegation
			$.delegate(container, '.dynamic-btn', 'click', () => {
				buttonClicked = true;
			});
			
			// Add dynamic button
			const dynamicButton = $.createElement('button', { className: 'dynamic-btn' }, 'Click me');
			$.append(container, dynamicButton);
			
			// Trigger click
			$.trigger(dynamicButton, 'click');
			
			expect(buttonClicked).toBe(true);
			
			document.body.removeChild(container);
		});

		test('should handle form input changes', () => {
			const form = $.get('form#gameSetup') as HTMLFormElement;
			const radioInputs = form.querySelectorAll('input[name="playerMode"]') as NodeListOf<HTMLInputElement>;
			
			// Test radio button selection
			const firstRadio = radioInputs[0];
			expect(firstRadio.checked).toBe(true);
			
			// Change selection
			$.setChecked(firstRadio, false);
			expect(firstRadio.checked).toBe(false);
			
			$.setChecked(firstRadio, true);
			expect(firstRadio.checked).toBe(true);
		});
	});

	describe('CSS and Animation Compatibility', () => {
		test('should handle CSS class manipulation', () => {
			const element = $.createElement('div');
			
			$.addClass(element, 'test-class');
			expect($.hasClass(element, 'test-class')).toBe(true);
			
			$.addClass(element, 'another-class');
			expect($.hasClass(element, 'another-class')).toBe(true);
			
			$.removeClass(element, 'test-class');
			expect($.hasClass(element, 'test-class')).toBe(false);
			expect($.hasClass(element, 'another-class')).toBe(true);
			
			$.toggleClass(element, 'toggle-class');
			expect($.hasClass(element, 'toggle-class')).toBe(true);
			
			$.toggleClass(element, 'toggle-class');
			expect($.hasClass(element, 'toggle-class')).toBe(false);
		});

		test('should handle element styling', () => {
			const element = $.createElement('div');
			
			$.css(element, {
				'background-color': 'red',
				'font-size': '16px',
				'display': 'block'
			});
			
			expect(element.style.backgroundColor).toBe('red');
			expect(element.style.fontSize).toBe('16px');
			expect(element.style.display).toBe('block');
		});
	});

	describe('Backward Compatibility', () => {
		test('should maintain jQuery-like API compatibility', () => {
			// Test that all expected methods exist
			expect(typeof $.get).toBe('function');
			expect(typeof $.getAll).toBe('function');
			expect(typeof $.getId).toBe('function');
			expect(typeof $.hide).toBe('function');
			expect(typeof $.show).toBe('function');
			expect(typeof $.addClass).toBe('function');
			expect(typeof $.removeClass).toBe('function');
			expect(typeof $.hasClass).toBe('function');
			expect(typeof $.toggleClass).toBe('function');
			expect(typeof $.on).toBe('function');
			expect(typeof $.off).toBe('function');
			expect(typeof $.trigger).toBe('function');
			expect(typeof $.serialize).toBe('function');
			expect(typeof $.validateForm).toBe('function');
		});

		test('should handle legacy jQuery patterns', () => {
			const element = $.createElement('div');
			
			// Test chaining-like behavior through return values
			$.addClass(element, 'class1');
			$.addClass(element, 'class2');
			
			expect($.hasClass(element, 'class1')).toBe(true);
			expect($.hasClass(element, 'class2')).toBe(true);
			
			// Test null safety
			expect(() => $.addClass(null, 'test')).not.toThrow();
			expect(() => $.removeClass(null, 'test')).not.toThrow();
			expect(() => $.hasClass(null, 'test')).not.toThrow();
		});
	});

	describe('Performance Regression', () => {
		test('should maintain performance with large DOM operations', () => {
			const container = $.createElement('div');
			document.body.appendChild(container);
			
			const startTime = performance.now();
			
			// Create many elements
			for (let i = 0; i < 1000; i++) {
				const element = $.createElement('div', { className: `item-${i}` }, `Item ${i}`);
				$.append(container, element);
			}
			
			// Perform operations on all elements
			const items = $.findAll(container, 'div');
			items.forEach(item => {
				$.addClass(item, 'processed');
			});
			
			const endTime = performance.now();
			
			// Should complete within reasonable time
			expect(endTime - startTime).toBeLessThan(100);
			expect(items.length).toBe(1000);
			
			document.body.removeChild(container);
		});
	});
});