export const ButtonStateEnum = {
	normal: 'normal',
	disabled: 'disabled',
	glowing: 'glowing',
	selected: 'selected',
	active: 'active',
	hidden: 'hidden',
	noClick: 'noclick',
	slideIn: 'slideIn',
} as const;

/**
 * Allows buttons to touch and slide
 */
export function buttonSlide() {
	let dragging = false;

	document.addEventListener('DOMContentLoaded', function () {
		const typeRadioElements = document.querySelectorAll('.typeRadio');
		
		typeRadioElements.forEach(function (typeRadio) {
			let selectedRadio;

			const radioInputs = typeRadio.querySelectorAll('.dragIt');
			selectedRadio = typeRadio.querySelector('input[type=radio]:checked');

			// Check clicked button
			radioInputs.forEach(function (element) {
				element.addEventListener('mousedown', () => {
					dragging = true;
					const prevInput = element.previousElementSibling as HTMLInputElement;
					if (prevInput && prevInput.type === 'radio') {
						prevInput.checked = true;
						selectedRadio = prevInput;
					}
				});

				// Check hovered button
				element.addEventListener('mouseover', () => {
					if (dragging) {
						if (selectedRadio) selectedRadio.checked = false;
						const prevInput = element.previousElementSibling as HTMLInputElement;
						if (prevInput && prevInput.type === 'radio') {
							prevInput.checked = true;
						}
					}
				});
			});
		});

		document.addEventListener('mouseup', () => {
			dragging = false;
		});
	});
}

type ValueOf<T> = T[keyof T];
type ButtonState = ValueOf<typeof ButtonStateEnum>;

export class Button {
	private isGameAcceptingInput: () => boolean;
	state: ButtonState;
	cssTransitionMeta: { transitionClass: any };
	resolveCssTransition: null;
	$button: any;
	overridefreeze: any;
	clickable: any;
	hasShortcut: any;
	touchX: any;
	touchY: any;
	css: any;
	resolveTransitionTask: null;
	stateTransitionMeta: { transitionClass: any };
	resolveCssTransitionTask: any;
	abilityId?: number; // Optional property for ability buttons
	click() {
		throw new Error('Method not implemented.');
	}	/**
	 * Constructor - Create attributes and default buttons
	 * @constructor
	 * @param {Object} opts - Options
	 * @param {Object} {isAcceptingInput: () => boolean}
	 */
	constructor(opts, configuration: { isAcceptingInput: () => boolean }) {
		this.isGameAcceptingInput = configuration.isAcceptingInput;

		const defaultOpts = {
			click: function () {},
			mouseover: function () {},
			mouseleave: function () {},
			touchstart: function () {},
			touchend: function () {},
			touchX: 0,
			touchY: 0,
			hasShortcut: false,
			clickable: true,
			state: ButtonStateEnum.normal,
			$button: undefined,
			attributes: {},
			overridefreeze: false,
			css: {
				disabled: {},
				glowing: {},
				selected: {},
				active: {},
				normal: {},
				slideIn: {},
				hidden: {},
				noclick: {},
			},
		};

		opts = Object.assign(defaultOpts, opts);
		Object.assign(this, opts);
		this.changeState(this.state);

		// Used in applying and removing CSS transitions
		this.cssTransitionMeta = {
			transitionClass: null,
		};
		this.resolveCssTransition = null;
	}
	changeState(state?: ButtonState) {
		const wrapperElement = this.$button.parentElement;
		state = state || this.state;
		this.state = state;
		
		// Remove all event listeners
		const newButton = this.$button.cloneNode(true);
		if (this.$button.parentNode) {
			this.$button.parentNode.replaceChild(newButton, this.$button);
			this.$button = newButton;
		}

		if (!['disabled', 'hidden'].includes(this.state)) {
			this.$button.addEventListener('click', () => {
				if (!this.overridefreeze) {
					if (!this.isGameAcceptingInput || !this.clickable) {
						return;
					}
				}

				this.click();
			});
		}

		this.$button.addEventListener('mouseover', () => {
			if (!this.overridefreeze) {
				if (!this.isGameAcceptingInput || !this.clickable) {
					return;
				}
			}

			if (this.hasShortcut) {
				this.$button.classList.add('hover');
			}

			this.mouseover();
		});

		this.$button.addEventListener('mouseleave', () => {
			if (!this.overridefreeze) {
				if (!this.isGameAcceptingInput || !this.clickable) {
					return;
				}
			}
			if (this.hasShortcut) {
				this.$button.classList.remove('hover');
			}

			this.mouseleave();
		});

		this.$button.addEventListener('touchstart', (event) => {
			event.preventDefault();
			event.stopPropagation();
			if (!this.overridefreeze) {
				if (!this.isGameAcceptingInput || !this.clickable) {
					return;
				}
			}

			if (this.hasShortcut) {
				this.$button.classList.add('hover');
			}

			this.touchX = event.changedTouches[0].pageX;
			this.touchY = event.changedTouches[0].pageY;
		});

		this.$button.addEventListener('touchend', (event) => {
			event.preventDefault();
			event.stopPropagation();
			if (!this.overridefreeze) {
				if (!this.isGameAcceptingInput || !this.clickable) {
					return;
				}
			}

			if (this.hasShortcut) {
				this.$button.classList.remove('hover');
			}

			if (
				this.shouldTriggerClick(event.changedTouches[0]) &&
				this.state !== ButtonStateEnum.disabled
			) {
				this.click();
			}
		});

		this.$button.classList.remove('disabled', 'glowing', 'selected', 'active', 'noclick', 'slideIn', 'hidden');
		if (wrapperElement) {
			wrapperElement.classList.remove('hidden');
		}
		
		// Apply normal CSS
		Object.assign(this.$button.style, this.css.normal);

		if (state === ButtonStateEnum.hidden) {
			if (wrapperElement && wrapperElement.id && this.$button.id && wrapperElement.id.includes(this.$button.id)) {
				wrapperElement.classList.add('hidden');
			}
		}
		if (state !== ButtonStateEnum.normal) {
			this.$button.classList.add(state);
			Object.assign(this.$button.style, this.css[state]);
		}
	}
	mouseover() {
		throw new Error('Method not implemented.');
	}
	mouseleave() {
		throw new Error('Method not implemented.');
	}
	/**
	 * Apply a CSS class on a button for a duration
	 * Useful for flashing a different icon etc for a certain period of time
	 * @param {string} transitionClass A CSS class to apply for the transition
	 * @param {number} transitionMs Time spent in the transition
	 */
	cssTransition(transitionClass, transitionMs) {
		const resolveCssTransitionTask = () => {
			this.$button.classList.remove(transitionClass);
			this.resolveTransitionTask = null;
		};

		// Check if the metadata matches, if not then you start the transition immediately, otherwise
		// preserve previous triggers but extend duration
		if (this.cssTransitionMeta.transitionClass !== transitionClass) {
			this.$button.classList.remove(this.cssTransitionMeta.transitionClass);
			this.$button.classList.add(transitionClass);
			this.stateTransitionMeta = {
				transitionClass,
			};
		}

		if (this.resolveCssTransitionTask) {
			clearTimeout(this.resolveCssTransitionTask);
			this.resolveCssTransitionTask = null;
		}

		// If transition state is not to be reached, do not call the transition function
		// This eliminates async issues that might be encountered by careless use
		if (transitionMs > 0) {
			this.resolveCssTransitionTask = setTimeout(resolveCssTransitionTask, transitionMs);
		}
	}

	triggerClick() {
		if (!this.overridefreeze) {
			if (
				!this.isGameAcceptingInput ||
				!this.clickable ||
				['disabled', 'hidden'].includes(this.state)
			) {
				return;
			}
		}

		this.click();
	}

	triggerMouseover() {
		if (!this.overridefreeze) {
			if (!this.isGameAcceptingInput || !this.clickable) {
				return;
			}
		}

		this.mouseover();
	}

	triggerMouseleave() {
		if (!this.overridefreeze) {
			if (!this.isGameAcceptingInput || !this.clickable) {
				return;
			}
		}

		this.mouseleave();
	}

	shouldTriggerClick(changedTouches) {
		const endTouchX = changedTouches.pageX;
		const endTouchY = changedTouches.pageY;
		let result = false;

		if (Math.abs(this.touchX - endTouchX) < 50 && Math.abs(this.touchY - endTouchY) < 50) {
			result = true;
		}

		return result;
	}
}
