import Cookies from 'js-cookie';
import { capitalize } from '../utility/string';
import { Button, ButtonStateEnum } from './button';
import { $ } from '../script';
import Game from '../game';

const COOKIE_KEY = 'ab-meta-powers';

interface MetaPowerToggle {
	enabled: boolean;
	label: string;
}

interface MetaPowersToggles {
	executeMonster: MetaPowerToggle;
	resetCooldowns: MetaPowerToggle;
	disableMaterializationSickness: MetaPowerToggle;
}

interface MetaPowersElements {
	modal: HTMLElement;
	closeModal: HTMLElement;
	resetPowersButton: HTMLElement;
	powersList: HTMLElement;
	executeMonsterButton: HTMLElement;
	resetCooldownsButton: HTMLElement;
	disableMaterializationSicknessButton: HTMLElement;
}

/**
 * "God-mode" UI for debugging game state
 * Available in hot-seat games when the app is in development mode
 *
 * Directly accessing instances of this class as they may not be present in some game modes
 *
 * Caution: usage of these tools may break the game log
 */
export class MetaPowers {
	game: Game;
	toggles: MetaPowersToggles;
	$els: MetaPowersElements;
	btnCloseModal: Button;
	btnExecuteMonster: Button;
	btnResetCooldowns: Button;
	btnDisableMaterializationSickness: Button;

	constructor(game: Game) {
		this.game = game;
		this.toggles = {
			executeMonster: { enabled: false, label: 'Execution Mode' },
			resetCooldowns: { enabled: false, label: 'Disable Materialization Sickness' },
			disableMaterializationSickness: { enabled: false, label: 'Disable Cooldowns' },
		};		// Object that will contain DOM element references
		this.$els = {} as MetaPowersElements;
		this._bindElements();

		// Events
		this.game.signals.ui.add(this._handleUiEvent, this);

		if (Cookies.get(COOKIE_KEY)) {
			this._restorePowers();
		}

		this._updateEnabledPowersPreview();
	}

	/**
	 * Handle events on the "ui" channel
	 *
	 * @param {string} message Event name
	 * @param {object} payload Event payload
	 */
	_handleUiEvent(message, payload) {
		if (message === 'toggleMetaPowers') {
			this._toggleModal();
		}

		if (message === 'toggleDash') {
			this._closeModal();
		}

		if (message === 'toggleScore') {
			this._closeModal();
		}

		if (message === 'toggleMusicPlayer') {
			this._closeModal();
		}

		if (message === 'closeInterfaceScreens') {
			this._closeModal();
		}
	}

	/**
	 * One-time setup of DOM bindings and other DOM manipulation
	 */	_bindElements() {
		this.$els = {
			modal: $.get('#meta-powers'),
			closeModal: $.get('#meta-powers .close-button'),
			resetPowersButton: $.get('#reset-toggled-powers'),
			powersList: $.get('#meta-powers-list'),
			executeMonsterButton: $.get('#execute-monster-button'),
			resetCooldownsButton: $.get('#reset-cooldowns-button'),
			disableMaterializationSicknessButton: $.get('#disable-materialization-sickness-button'),
		};
		this.btnCloseModal = new Button(
			{
				$button: this.$els.closeModal,
				click: () => this._toggleModal(),
			},
			{ isAcceptingInput: () => !this.game.freezedInput },
		);

		this.btnExecuteMonster = new Button(
			{
				$button: this.$els.executeMonsterButton,
				hasShortcut: true,
				click: () => this._togglePower('executeMonster', this.btnExecuteMonster),
			},
			{ isAcceptingInput: () => !this.game.freezedInput },
		);

		this.btnResetCooldowns = new Button(
			{
				$button: this.$els.resetCooldownsButton,
				hasShortcut: true,
				click: () => this._togglePower('resetCooldowns', this.btnResetCooldowns),
			},
			{ isAcceptingInput: () => !this.game.freezedInput },
		);

		this.btnDisableMaterializationSickness = new Button(
			{
				$button: this.$els.disableMaterializationSicknessButton,
				hasShortcut: true,
				click: () =>
					this._togglePower(
						'disableMaterializationSickness',
						this.btnDisableMaterializationSickness,
					),
			},
			{ isAcceptingInput: () => !this.game.freezedInput },
		);
		$.on(this.$els.resetPowersButton, 'click', () => {
			this._clearPowers();
		});
	}

	/**
	 * Toggle the button state for a Meta Power and inform the rest of the app that setting has changed
	 *
	 * @param {string} stateKey Key for `this.state` setting
	 * @param {Button} button Button representing the toggle state
	 */
	_togglePower(stateKey, button) {
		const enabled = !this.toggles[stateKey].enabled;

		this.toggles = {
			...this.toggles,
			[stateKey]: { ...this.toggles[stateKey], enabled },
		};

		button.changeState(enabled ? ButtonStateEnum.active : ButtonStateEnum.normal);

		this.game.signals.metaPowers.dispatch(`toggle${capitalize(stateKey)}`, enabled);

		this._updateEnabledPowersPreview();
		this._persistPowers();
	}

	/**
	 * Persist toggled Meta Powers to a cookie
	 */
	_persistPowers() {
		Cookies.set(COOKIE_KEY, JSON.stringify({ persisting: true, toggles: this.toggles }));
	}

	/**
	 * If the toggled Meta Powers were persisted to a cookie, restore them
	 */
	_restorePowers() {
		const powers = JSON.parse(Cookies.get(COOKIE_KEY)).toggles;

		Object.keys(powers).forEach((key) => {
			if (powers[key].enabled) {
				this._togglePower(key, this[`btn${capitalize(key)}`]);
			}
		});
	}

	/**
	 * Clear toggled Meta Powers and remove cookie
	 */
	_clearPowers() {
		Object.keys(this.toggles).forEach((key) => {
			if (this.toggles[key].enabled) {
				this._togglePower(key, this[`btn${capitalize(key)}`]);
			}
		});
	}

	/**
	 * Display a list of enabled powers outside of the modal for easy reference
	 */
	_updateEnabledPowersPreview() {
		const list = Object.keys(this.toggles)
			.reduce((acc, curr) => {
				if (this.toggles[curr].enabled) {
					return [...acc, this.toggles[curr].label];
				}

				return acc;
			}, [])			.join(', ');

		$.html(this.$els.powersList, list.length ? `Enabled Meta Powers: ${list}` : '');
	}
	/**
	 * Toggle the visibility of the Meta Powers modal
	 */
	_toggleModal() {
		$.toggleClass(this.$els.modal, 'hide');
	}

	/**
	 * Close the Meta Powers modal
	 */
	_closeModal() {
		$.addClass(this.$els.modal, 'hide');
	}
}
