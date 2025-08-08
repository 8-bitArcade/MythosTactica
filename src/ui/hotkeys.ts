import { Fullscreen } from './fullscreen';

/**
 * Handles all keyboard hotkey actions for the Mythos Tactica UI.
 *
 * Each method corresponds to a specific key or key combination and triggers the appropriate UI action.
 *
 * @example
 *   const hotkeys = new Hotkeys(ui);
 *   document.addEventListener('keydown', (e) => { ... });
 */
export class Hotkeys {
	/**
	 * Reference to the UI object. Should implement all methods and properties used by hotkeys.
	 */
	ui: any;

	/**
	 * @param ui - The UI object that hotkeys will control.
	 */
	constructor(ui: any) {
		this.ui = ui;
	}

	/**
	 * Q: Cycle ability or close dash.
	 */
	pressQ() {
		if (this.ui.dashopen) {
			this.ui.closeDash();
		} else {
			this.ui.selectNextAbility();
		}
	}

	/**
	 * S: Scoreboard, save, or skip turn/move down.
	 * @param event KeyboardEvent
	 */
	pressS(event: KeyboardEvent) {
		if (event.shiftKey) {
			this.ui.btnToggleScore?.triggerClick();
		} else if (event.ctrlKey) {
			this.ui.game.gamelog.save();
		} else {
			if (this.ui.dashopen) {
				this.ui.gridSelectDown();
			} else {
				this.ui.btnSkipTurn?.triggerClick();
			}
		}
	}

	/**
	 * T: Toggle scoreboard or close dash.
	 */
	pressT() {
		if (this.ui.dashopen) {
			this.ui.closeDash();
		} else {
			this.ui.btnToggleScore?.triggerClick();
		}
	}

	/**
	 * D: Toggle dash, move right, or delay turn.
	 * @param event KeyboardEvent
	 */
	pressD(event: KeyboardEvent) {
		if (event.shiftKey) {
			this.ui.btnToggleDash?.triggerClick();
		} else {
			if (this.ui.dashopen) {
				this.ui.gridSelectRight();
			} else {
				this.ui.btnDelay?.triggerClick();
			}
		}
	}

	/**
	 * W: Move up or use ability 1.
	 */
	pressW() {
		if (this.ui.dashopen) {
			this.ui.gridSelectUp();
		} else {
			this.ui.abilitiesButtons?.[1]?.triggerClick();
		}
	}

	/**
	 * E: Use ability 2.
	 */
	pressE() {
		if (!this.ui.dashopen) {
			this.ui.abilitiesButtons?.[2]?.triggerClick();
		}
	}

	/**
	 * P: Toggle meta powers (meta+alt).
	 * @param event KeyboardEvent
	 */
	pressP(event: KeyboardEvent) {
		if (event.metaKey && event.altKey) {
			this.ui.game.signals.ui.dispatch('toggleMetaPowers');
		}
	}

	/**
	 * R: Use ability 3 or close dash.
	 */
	pressR() {
		if (this.ui.dashopen) {
			this.ui.closeDash();
		} else {
			this.ui.abilitiesButtons?.[3]?.triggerClick();
		}
	}

	/**
	 * A: Toggle audio or move left.
	 * @param event KeyboardEvent
	 */
	pressA(event: KeyboardEvent) {
		if (event.shiftKey) {
			this.ui.btnAudio?.triggerClick();
		} else if (this.ui.dashopen) {
			this.ui.gridSelectLeft();
		}
	}

	/**
	 * F: Toggle fullscreen or flee.
	 * @param event KeyboardEvent
	 */
	pressF(event: KeyboardEvent) {
		if (event.shiftKey) {
			this.ui.fullscreen?.toggle();
		} else {
			this.ui.btnFlee?.triggerClick();
		}
	}

	/**
	 * X: Save (ctrl+shift) or exit.
	 * @param event KeyboardEvent
	 */
	pressX(event: KeyboardEvent) {
		if (event.shiftKey && event.ctrlKey) {
			this.ui.game.gamelog.save();
		} else {
			this.ui.btnExit?.triggerClick();
		}
	}

	/**
	 * Tab: Hide/show brand logo.
	 * @param event KeyboardEvent
	 */
	pressTab(event: KeyboardEvent) {
		// Remove debug log for production
		if (event.shiftKey) {
			this.ui.$brandlogo?.addClass('hide');
		}
	}

	/**
	 * ArrowUp: Move up in dash or select hex up.
	 */
	pressArrowUp() {
		if (this.ui.dashopen) {
			this.ui.gridSelectUp();
		} else {
			this.ui.game.grid.selectHexUp();
		}
	}

	/**
	 * ArrowDown: Move down in dash or select hex down.
	 */
	pressArrowDown() {
		if (this.ui.dashopen) {
			this.ui.gridSelectDown();
		} else {
			this.ui.game.grid.selectHexDown();
		}
	}

	/**
	 * ArrowLeft: Move left in dash or select hex left.
	 */
	pressArrowLeft() {
		if (this.ui.dashopen) {
			this.ui.gridSelectLeft();
		} else {
			this.ui.game.grid.selectHexLeft();
		}
	}

	/**
	 * ArrowRight: Move right in dash or select hex right.
	 */
	pressArrowRight() {
		if (this.ui.dashopen) {
			this.ui.gridSelectRight();
		} else {
			this.ui.game.grid.selectHexRight();
		}
	}

	/**
	 * Enter: Materialize or toggle chat.
	 */
	pressEnter() {
		if (this.ui.dashopen) {
			this.ui.materializeButton?.triggerClick();
		} else {
			this.ui.chat?.toggle();
		}
	}

	/**
	 * Escape: Cancel ability, close dash or chat, and update fullscreen button state.
	 */
	pressEscape() {
		const isAbilityActive =
			this.ui.activeAbility && this.ui.$scoreboard?.hasClass('hide') && !this.ui.chat?.isOpen;

		if (isAbilityActive) {
			// Check to see if dash view or chat are open first before canceling the active ability
			this.ui.game.playerManager.activeCreature.queryMove();
			this.ui.selectAbility(-1);
		}

		// Check if we were in fullscreen mode and update button state accordingly
		setTimeout(() => {
			if (this.ui.fullscreen) {
				this.ui.fullscreen.updateButtonState();
			}
		}, 100);

		this.ui.game.signals.ui.dispatch('closeInterfaceScreens');
	}

	/**
	 * Shift: Show grid and current creature movement.
	 * @param event KeyboardEvent
	 */
	pressShiftKeyDown(event?: KeyboardEvent) {
		this.ui.$brandlogo?.removeClass('hide');
		this.ui.game.grid.showGrid(true);
		this.ui.game.grid.showCurrentCreatureMovementInOverlay(this.ui.game.activeCreature);
	}

	/**
	 * Shift: Hide grid and clean overlay.
	 */
	pressShiftKeyUp() {
		this.ui.$brandlogo?.addClass('hide');
		this.ui.game.grid.showGrid(false);
		this.ui.game.grid.cleanOverlay();
		this.ui.game.grid.redoLastQuery();
	}

	/**
	 * Control: Hide brand logo on press.
	 */
	pressControlKeyDown() {
		this.ui.$brandlogo?.addClass('hide');
	}

	/**
	 * Control: Hide brand logo on release.
	 */
	pressControlKeyUp() {
		this.ui.$brandlogo?.addClass('hide');
	}

	/**
	 * Space: Confirm hex if dash is not open.
	 */
	pressSpace() {
		if (!this.ui.dashopen) {
			this.ui.game.grid.confirmHex();
		}
	}

	/**
	 * F11: Toggle fullscreen mode.
	 * @param event KeyboardEvent
	 */
	pressF11(event: KeyboardEvent) {
		event.preventDefault();
		const fullscreen = new Fullscreen(document.getElementById('fullscreen'));
		fullscreen.toggle();
	}
}

export function getHotKeys(hk) {
	const hotkeys = {
		KeyS: {
			onkeydown(event) {
				hk.pressS(event);
			},
		},
		KeyT: {
			onkeydown() {
				hk.pressT();
			},
		},
		KeyD: {
			onkeydown(event) {
				hk.pressD(event);
			},
		},
		KeyQ: {
			onkeydown() {
				hk.pressQ();
			},
		},
		KeyW: {
			onkeydown() {
				hk.pressW();
			},
		},
		KeyE: {
			onkeydown() {
				hk.pressE();
			},
		},
		KeyP: {
			onkeydown(event) {
				hk.pressP(event);
			},
		},
		KeyR: {
			onkeydown() {
				hk.pressR();
			},
		},
		KeyA: {
			onkeydown(event) {
				hk.pressA(event);
			},
		},
		KeyF: {
			onkeydown(event) {
				hk.pressF(event);
			},
		},
		KeyX: {
			onkeydown(event) {
				hk.pressX(event);
			},
		},
		Tab: {
			onkeydown(event) {
				hk.pressTab(event);
			},
		},
		ArrowUp: {
			onkeydown() {
				hk.pressArrowUp();
			},
		},
		ArrowDown: {
			onkeydown() {
				hk.pressArrowDown();
			},
		},
		ArrowLeft: {
			onkeydown() {
				hk.pressArrowLeft();
			},
		},
		ArrowRight: {
			onkeydown() {
				hk.pressArrowRight();
			},
		},
		Enter: {
			onkeydown() {
				hk.pressEnter();
			},
		},
		Escape: {
			onkeydown() {
				hk.pressEscape();
			},
		},
		ShiftLeft: {
			onkeydown() {
				hk.pressShiftKeyDown();
			},
			onkeyup() {
				hk.pressShiftKeyUp();
			},
		},
		ShiftRight: {
			onkeydown() {
				hk.pressShiftKeyDown();
			},
			onkeyup() {
				hk.pressShiftKeyUp();
			},
		},
		ControlLeft: {
			onkeydown() {
				hk.pressControlKeyDown();
			},
			onkeyup() {
				hk.pressControlKeyUp();
			},
		},
		ControlRight: {
			onkeydown() {
				hk.pressControlKeyDown();
			},
			onkeyup() {
				hk.pressControlKeyUp();
			},
		},
		Space: {
			onkeydown() {
				hk.pressSpace();
			},
		},
		F11: {
			onkeydown(event) {
				hk.pressF11(event);
			},
		},
	};
	return hotkeys;
}
