/**
 * Centralized Input Management System for MythosTactica
 * 
 * This class provides a unified interface for handling all input types:
 * - Mouse input with hex grid coordinate detection
 * - Keyboard shortcuts and hotkeys
 * - Touch input for mobile devices
 * - Input state management for different game modes
 */

import Game from '../game';
import { Hex } from '../utility/hex';
import { HexGrid } from '../utility/hexgrid';
import { HEX_WIDTH_PX, HEX_HEIGHT_PX } from '../utility/const';

export interface InputState {
	enabled: boolean;
	mode: 'menu' | 'game' | 'ui' | 'disabled';
	activeHex: Hex | null;
	hoveredHex: Hex | null;
	selectedCreature: any | null;
	isDragging: boolean;
	lastClickTime: number;
	doubleClickThreshold: number;
}

export interface KeyboardShortcut {
	key: string;
	modifiers?: {
		ctrl?: boolean;
		shift?: boolean;
		alt?: boolean;
		meta?: boolean;
	};
	action: (event: KeyboardEvent) => void;
	description: string;
	enabled: boolean;
}

export interface TouchInputConfig {
	enabled: boolean;
	doubleTapThreshold: number;
	longPressThreshold: number;
	swipeThreshold: number;
}

export class InputManager {
	private game: Game;
	private scene: Phaser.Scene;
	private grid: HexGrid;
	
	// Input state management
	private inputState: InputState;
	
	// Keyboard shortcuts registry
	private shortcuts: Map<string, KeyboardShortcut>;
	
	// Touch input configuration
	private touchConfig: TouchInputConfig;
	
	// Event handlers (stored for cleanup)
	private boundHandlers: Map<string, Function>;
	
	// Phaser input objects
	private pointerInput: Phaser.Input.InputPlugin;
	private keyboardInput: Phaser.Input.Keyboard.KeyboardPlugin;
	
	// Touch tracking
	private touchStartTime: number = 0;
	private touchStartPosition: { x: number; y: number } = { x: 0, y: 0 };
	private lastTouchTime: number = 0;

	constructor(game: Game) {
		this.game = game;
		this.scene = null;
		this.grid = null;
		
		// Initialize input state
		this.inputState = {
			enabled: false,
			mode: 'menu',
			activeHex: null,
			hoveredHex: null,
			selectedCreature: null,
			isDragging: false,
			lastClickTime: 0,
			doubleClickThreshold: 300
		};
		
		// Initialize shortcuts registry
		this.shortcuts = new Map();
		
		// Initialize touch configuration
		this.touchConfig = {
			enabled: true,
			doubleTapThreshold: 300,
			longPressThreshold: 500,
			swipeThreshold: 50
		};
		
		// Initialize bound handlers map
		this.boundHandlers = new Map();
		
		// Set up default keyboard shortcuts
		this.setupDefaultShortcuts();
	}

	/**
	 * Initialize the InputManager with a Phaser scene
	 */
	initialize(scene: Phaser.Scene): void {
		this.scene = scene;
		this.grid = this.game.grid;
		
		if (!this.scene) {
			throw new Error('InputManager requires a valid Phaser scene');
		}
		
		// Get Phaser input plugins
		this.pointerInput = this.scene.input;
		this.keyboardInput = this.scene.input.keyboard;
		
		// Set up input event listeners
		this.setupPointerInput();
		this.setupKeyboardInput();
		this.setupTouchInput();
		
		// Enable input by default
		this.enableInput();
		
		console.log('[InputManager] Initialized successfully');
	}

	/**
	 * Set up pointer (mouse) input handling
	 */
	private setupPointerInput(): void {
		if (!this.pointerInput) return;
		
		// Handle pointer down events
		const onPointerDown = (pointer: Phaser.Input.Pointer) => {
			if (!this.inputState.enabled) return;
			
			const hex = this.getHexFromPointer(pointer);
			if (hex) {
				this.handleHexClick(hex, pointer);
			}
		};
		
		// Handle pointer move events for hover
		const onPointerMove = (pointer: Phaser.Input.Pointer) => {
			if (!this.inputState.enabled) return;
			
			const hex = this.getHexFromPointer(pointer);
			if (hex !== this.inputState.hoveredHex) {
				this.handleHexHover(hex, this.inputState.hoveredHex);
				this.inputState.hoveredHex = hex;
			}
		};
		
		// Handle pointer up events
		const onPointerUp = (pointer: Phaser.Input.Pointer) => {
			if (!this.inputState.enabled) return;
			
			this.inputState.isDragging = false;
		};
		
		// Store bound handlers for cleanup
		this.boundHandlers.set('pointerdown', onPointerDown as Function);
		this.boundHandlers.set('pointermove', onPointerMove as Function);
		this.boundHandlers.set('pointerup', onPointerUp as Function);
		
		// Register with Phaser
		this.pointerInput.on('pointerdown', onPointerDown);
		this.pointerInput.on('pointermove', onPointerMove);
		this.pointerInput.on('pointerup', onPointerUp);
	}

	/**
	 * Set up keyboard input handling
	 */
	private setupKeyboardInput(): void {
		if (!this.keyboardInput) return;
		
		const onKeyDown = (event: KeyboardEvent) => {
			if (!this.inputState.enabled) return;
			
			this.handleKeyboardInput(event);
		};
		
		// Store bound handler for cleanup
		this.boundHandlers.set('keydown', onKeyDown as Function);
		
		// Register with Phaser
		this.keyboardInput.on('keydown', onKeyDown);
	}

	/**
	 * Set up touch input handling for mobile devices
	 */
	private setupTouchInput(): void {
		if (!this.touchConfig.enabled || !this.scene) return;
		
		// Touch start handler
		const onTouchStart = (pointer: Phaser.Input.Pointer) => {
			if (!this.inputState.enabled || !pointer.isDown) return;
			
			this.touchStartTime = Date.now();
			this.touchStartPosition = { x: pointer.x, y: pointer.y };
		};
		
		// Touch end handler
		const onTouchEnd = (pointer: Phaser.Input.Pointer) => {
			if (!this.inputState.enabled) return;
			
			const touchDuration = Date.now() - this.touchStartTime;
			const touchDistance = Phaser.Math.Distance.Between(
				this.touchStartPosition.x, this.touchStartPosition.y,
				pointer.x, pointer.y
			);
			
			// Handle different touch gestures
			if (touchDistance < this.touchConfig.swipeThreshold) {
				if (touchDuration < this.touchConfig.longPressThreshold) {
					// Regular tap
					this.handleTouchTap(pointer);
				} else {
					// Long press
					this.handleTouchLongPress(pointer);
				}
			} else {
				// Swipe gesture
				this.handleTouchSwipe(pointer, touchDistance);
			}
		};
		
		// Store bound handlers for cleanup
		this.boundHandlers.set('touchstart', onTouchStart as Function);
		this.boundHandlers.set('touchend', onTouchEnd as Function);
		
		// Register touch events (these work through pointer events in Phaser 3)
		this.pointerInput.on('pointerdown', onTouchStart);
		this.pointerInput.on('pointerup', onTouchEnd);
	}

	/**
	 * Convert pointer coordinates to hex grid coordinates
	 * Enhanced for better accuracy with the graphics-based rendering system
	 */
	private getHexFromPointer(pointer: Phaser.Input.Pointer): Hex | null {
		if (!this.grid || !this.grid.display) return null;
		
		// Use the existing hex hitbox system for accurate detection
		// This leverages the polygon-based hit detection already implemented
		let foundHex: Hex | null = null;
		
		// Check each hex's hitbox for intersection with the pointer
		this.grid.forEachHex((hex) => {
			if (hex.hitBox && hex.hitBox.input && hex.hitBox.input.enabled) {
				// Use Phaser's built-in hit test
				const hitTest = hex.hitBox.input.hitArea.contains(
					pointer.x - hex.hitBox.x,
					pointer.y - hex.hitBox.y
				);
				
				if (hitTest) {
					foundHex = hex;
					return; // Found the hex, no need to continue
				}
			}
		});
		
		// Fallback to mathematical calculation if hitbox detection fails
		if (!foundHex) {
			foundHex = this.getHexFromPointerMath(pointer);
		}
		
		return foundHex;
	}

	/**
	 * Mathematical fallback for hex coordinate detection
	 */
	private getHexFromPointerMath(pointer: Phaser.Input.Pointer): Hex | null {
		if (!this.grid || !this.grid.display) return null;
		
		// Convert screen coordinates to grid local coordinates
		// Account for grid display container position and scale
		const gridContainer = this.grid.gridGroup;
		if (!gridContainer) return null;
		
		// Get the world transform matrix and apply inverse to get local coordinates
		const worldMatrix = gridContainer.getWorldTransformMatrix();
		const localPoint = worldMatrix.applyInverse(pointer.x, pointer.y);
		
		// Convert pixel coordinates to hex coordinates using the existing system
		// Using constants from const.ts
		
		// Calculate hex coordinates from pixel position
		// This reverses the offsetCoordsToPx calculation from const.ts
		const hexY = Math.round(localPoint.y / HEX_HEIGHT_PX);
		
		// Account for hex offset pattern (every other row is offset by 0.5)
		let hexX: number;
		if (hexY % 2 === 0) {
			// Even rows: x = (pixelX / HEX_WIDTH_PX) - 0.5
			hexX = Math.round((localPoint.x / HEX_WIDTH_PX) - 0.5);
		} else {
			// Odd rows: x = pixelX / HEX_WIDTH_PX
			hexX = Math.round(localPoint.x / HEX_WIDTH_PX);
		}
		
		// Get the hex from the grid using the calculated coordinates
		return this.grid.hexAt(hexX, hexY);
	}

	/**
	 * Handle hex click events
	 */
	private handleHexClick(hex: Hex, pointer: Phaser.Input.Pointer): void {
		const currentTime = Date.now();
		const isDoubleClick = (currentTime - this.inputState.lastClickTime) < this.inputState.doubleClickThreshold;
		
		this.inputState.lastClickTime = currentTime;
		this.inputState.activeHex = hex;
		
		// Determine click type and handle accordingly
		if (isDoubleClick) {
			this.handleHexDoubleClick(hex);
		} else {
			this.handleHexSingleClick(hex);
		}
		
		// Update cursor based on hex state
		this.updateCursor(hex);
		
		console.log(`[InputManager] Hex clicked: (${hex.x}, ${hex.y})`);
	}

	/**
	 * Handle single hex click
	 */
	private handleHexSingleClick(hex: Hex): void {
		// Use the existing hex click system for compatibility
		if (hex.onSelectFn && typeof hex.onSelectFn === 'function') {
			hex.onSelectFn(hex);
		}
		
		// Handle creature selection
		if (hex.creature && this.inputState.mode === 'game') {
			this.inputState.selectedCreature = hex.creature;
			
			// Trigger creature selection events
			if (this.game.signals && this.game.signals.creature) {
				this.game.signals.creature.dispatch('selected', hex.creature);
			}
		}
	}

	/**
	 * Handle double hex click (confirm action)
	 */
	private handleHexDoubleClick(hex: Hex): void {
		// Use the existing hex confirm system for compatibility
		if (hex.onConfirmFn && typeof hex.onConfirmFn === 'function') {
			hex.onConfirmFn(hex);
		}
	}

	/**
	 * Handle hex hover events
	 */
	private handleHexHover(newHex: Hex | null, oldHex: Hex | null): void {
		// Clear old hex hover state
		if (oldHex && oldHex.creature) {
			oldHex.creature.resetBounce?.();
		}
		
		// Set new hex hover state
		if (newHex && newHex.creature && this.inputState.mode === 'game') {
			// Trigger creature hover effects - check if bounce method exists
			if (newHex.creature && typeof (newHex.creature as any).bounce === 'function') {
				(newHex.creature as any).bounce();
			}
			
			// Update grid hover state
			this.grid.hoveredCreature = newHex.creature;
		} else {
			this.grid.hoveredCreature = null;
		}
		
		// Update cursor
		this.updateCursor(newHex);
	}

	/**
	 * Handle keyboard input and shortcuts
	 */
	private handleKeyboardInput(event: KeyboardEvent): void {
		const shortcutKey = this.getShortcutKey(event);
		const shortcut = this.shortcuts.get(shortcutKey);
		
		if (shortcut && shortcut.enabled) {
			event.preventDefault();
			shortcut.action(event);
			console.log(`[InputManager] Keyboard shortcut executed: ${shortcutKey}`);
		}
	}

	/**
	 * Handle touch tap events
	 */
	private handleTouchTap(pointer: Phaser.Input.Pointer): void {
		const currentTime = Date.now();
		const isDoubleTap = (currentTime - this.lastTouchTime) < this.touchConfig.doubleTapThreshold;
		
		this.lastTouchTime = currentTime;
		
		const hex = this.getHexFromPointer(pointer);
		if (hex) {
			if (isDoubleTap) {
				this.handleHexDoubleClick(hex);
			} else {
				this.handleHexSingleClick(hex);
			}
		}
	}

	/**
	 * Handle touch long press events
	 */
	private handleTouchLongPress(pointer: Phaser.Input.Pointer): void {
		const hex = this.getHexFromPointer(pointer);
		if (hex && hex.creature) {
			// Show creature info or context menu on long press
			if (this.game.signals && this.game.signals.ui) {
				this.game.signals.ui.dispatch('showCreatureInfo', hex.creature);
			}
		}
	}

	/**
	 * Handle touch swipe events
	 */
	private handleTouchSwipe(pointer: Phaser.Input.Pointer, distance: number): void {
		const deltaX = pointer.x - this.touchStartPosition.x;
		const deltaY = pointer.y - this.touchStartPosition.y;
		
		// Determine swipe direction
		if (Math.abs(deltaX) > Math.abs(deltaY)) {
			// Horizontal swipe
			if (deltaX > 0) {
				this.handleSwipeRight();
			} else {
				this.handleSwipeLeft();
			}
		} else {
			// Vertical swipe
			if (deltaY > 0) {
				this.handleSwipeDown();
			} else {
				this.handleSwipeUp();
			}
		}
	}

	/**
	 * Handle swipe gestures
	 */
	private handleSwipeRight(): void {
		// Could be used for UI navigation or camera movement
		console.log('[InputManager] Swipe right detected');
	}

	private handleSwipeLeft(): void {
		// Could be used for UI navigation or camera movement
		console.log('[InputManager] Swipe left detected');
	}

	private handleSwipeUp(): void {
		// Could be used for UI navigation
		console.log('[InputManager] Swipe up detected');
	}

	private handleSwipeDown(): void {
		// Could be used for UI navigation
		console.log('[InputManager] Swipe down detected');
	}

	/**
	 * Update cursor based on current hex state
	 */
	private updateCursor(hex: Hex | null): void {
		const canvases = document.querySelectorAll('canvas');
		let cursor = 'default';
		
		if (hex) {
			if (hex.reachable) {
				cursor = 'pointer';
			} else if (hex.creature && hex.creature !== this.game.activeCreature) {
				cursor = 'help';
			} else if (this.game.activeCreature?.noActionPossible) {
				cursor = 'wait';
			}
		}
		
		canvases.forEach(canvas => {
			(canvas as HTMLCanvasElement).style.cursor = cursor;
		});
	}

	/**
	 * Set up default keyboard shortcuts
	 */
	private setupDefaultShortcuts(): void {
		// Game control shortcuts
		this.addShortcut('Escape', {
			action: () => this.cancelCurrentAction(),
			description: 'Cancel current action'
		});
		
		this.addShortcut('Space', {
			action: () => this.confirmCurrentAction(),
			description: 'Confirm current action'
		});
		
		this.addShortcut('Enter', {
			action: () => this.confirmCurrentAction(),
			description: 'Confirm current action'
		});
		
		// UI shortcuts
		this.addShortcut('Tab', {
			action: () => this.cycleCreatures(),
			description: 'Cycle through creatures'
		});
		
		this.addShortcut('KeyQ', {
			action: () => this.showCreatureQueue(),
			description: 'Show creature queue'
		});
		
		// Ability shortcuts (1-4 keys)
		for (let i = 1; i <= 4; i++) {
			this.addShortcut(`Digit${i}`, {
				action: () => this.selectAbility(i - 1),
				description: `Select ability ${i}`
			});
		}
		
		// Debug shortcuts (Ctrl+Shift combinations)
		this.addShortcut('KeyD', {
			modifiers: { ctrl: true, shift: true },
			action: () => this.toggleDebugMode(),
			description: 'Toggle debug mode'
		});
		
		// Fullscreen toggle
		this.addShortcut('F11', {
			action: (event) => {
				event.preventDefault();
				this.toggleFullscreen();
			},
			description: 'Toggle fullscreen'
		});
		
		this.addShortcut('KeyF', {
			modifiers: { shift: true },
			action: () => this.toggleFullscreen(),
			description: 'Toggle fullscreen'
		});
	}

	/**
	 * Add a keyboard shortcut
	 */
	addShortcut(key: string, config: Partial<KeyboardShortcut>): void {
		const shortcut: KeyboardShortcut = {
			key,
			modifiers: config.modifiers || {},
			action: config.action || (() => {}),
			description: config.description || '',
			enabled: config.enabled !== false
		};
		
		const shortcutKey = this.getShortcutKey({
			code: key,
			ctrlKey: shortcut.modifiers.ctrl || false,
			shiftKey: shortcut.modifiers.shift || false,
			altKey: shortcut.modifiers.alt || false,
			metaKey: shortcut.modifiers.meta || false
		} as KeyboardEvent);
		
		this.shortcuts.set(shortcutKey, shortcut);
	}

	/**
	 * Remove a keyboard shortcut
	 */
	removeShortcut(key: string, modifiers?: KeyboardShortcut['modifiers']): void {
		const shortcutKey = this.getShortcutKey({
			code: key,
			ctrlKey: modifiers?.ctrl || false,
			shiftKey: modifiers?.shift || false,
			altKey: modifiers?.alt || false,
			metaKey: modifiers?.meta || false
		} as KeyboardEvent);
		
		this.shortcuts.delete(shortcutKey);
	}

	/**
	 * Generate a unique key for shortcut mapping
	 */
	private getShortcutKey(event: KeyboardEvent): string {
		const modifiers = [];
		if (event.ctrlKey) modifiers.push('Ctrl');
		if (event.shiftKey) modifiers.push('Shift');
		if (event.altKey) modifiers.push('Alt');
		if (event.metaKey) modifiers.push('Meta');
		
		return [...modifiers, event.code].join('+');
	}

	/**
	 * Shortcut action implementations
	 */
	private cancelCurrentAction(): void {
		if (this.grid && this.grid.lastQueryOpt && this.grid.lastQueryOpt.fnOnCancel) {
			this.grid.lastQueryOpt.fnOnCancel(null, this.grid.lastQueryOpt.args);
		}
	}

	private confirmCurrentAction(): void {
		if (this.inputState.activeHex) {
			this.handleHexDoubleClick(this.inputState.activeHex);
		}
	}

	private cycleCreatures(): void {
		// Use the game manager to cycle to next creature
		if (this.game.gameManager && typeof this.game.gameManager.nextCreature === 'function') {
			this.game.gameManager.nextCreature();
		}
	}

	private showCreatureQueue(): void {
		if (this.game.signals && this.game.signals.ui) {
			this.game.signals.ui.dispatch('toggleQueue');
		}
	}

	private selectAbility(abilityIndex: number): void {
		if (this.game.activeCreature && this.game.activeCreature.abilities) {
			const ability = this.game.activeCreature.abilities[abilityIndex];
			if (ability && typeof ability.use === 'function') {
				ability.use();
			}
		}
	}

	private toggleDebugMode(): void {
		// Toggle debug mode if available
		console.log('[InputManager] Debug mode toggle requested');
	}

	private toggleFullscreen(): void {
		// Use existing fullscreen utility if available
		const fullscreenElement = document.getElementById('fullscreen');
		if (fullscreenElement) {
			fullscreenElement.click();
		}
	}

	/**
	 * Enable input handling
	 */
	enableInput(): void {
		this.inputState.enabled = true;
		console.log('[InputManager] Input enabled');
	}

	/**
	 * Disable input handling
	 */
	disableInput(): void {
		this.inputState.enabled = false;
		this.inputState.activeHex = null;
		this.inputState.hoveredHex = null;
		this.inputState.isDragging = false;
		console.log('[InputManager] Input disabled');
	}

	/**
	 * Set input mode
	 */
	setInputMode(mode: InputState['mode']): void {
		this.inputState.mode = mode;
		console.log(`[InputManager] Input mode set to: ${mode}`);
	}

	/**
	 * Get current input state
	 */
	getInputState(): Readonly<InputState> {
		return { ...this.inputState };
	}

	/**
	 * Configure touch input
	 */
	configureTouchInput(config: Partial<TouchInputConfig>): void {
		this.touchConfig = { ...this.touchConfig, ...config };
	}

	/**
	 * Get list of registered shortcuts
	 */
	getShortcuts(): KeyboardShortcut[] {
		return Array.from(this.shortcuts.values());
	}

	/**
	 * Integration method: Called when a hex query is started
	 * This allows the InputManager to adapt to different input contexts
	 */
	onHexQueryStart(queryOptions: any): void {
		// Adjust input behavior based on query type
		if (queryOptions.isDirectionsQuery) {
			this.setInputMode('game');
		}
		
		console.log('[InputManager] Hex query started');
	}

	/**
	 * Integration method: Called when a hex query ends
	 */
	onHexQueryEnd(): void {
		// Reset input state
		this.inputState.activeHex = null;
		this.inputState.hoveredHex = null;
		
		console.log('[InputManager] Hex query ended');
	}

	/**
	 * Integration method: Called when game state changes
	 */
	onGameStateChange(newState: string): void {
		switch (newState) {
			case 'playing':
				this.setInputMode('game');
				this.enableInput();
				break;
			case 'ended':
				this.disableInput();
				break;
			case 'loading':
				this.setInputMode('disabled');
				break;
			default:
				this.setInputMode('menu');
		}
		
		console.log(`[InputManager] Game state changed to: ${newState}`);
	}

	/**
	 * Get debug information about current input state
	 */
	getDebugInfo(): object {
		return {
			enabled: this.inputState.enabled,
			mode: this.inputState.mode,
			activeHex: this.inputState.activeHex ? `(${this.inputState.activeHex.x}, ${this.inputState.activeHex.y})` : null,
			hoveredHex: this.inputState.hoveredHex ? `(${this.inputState.hoveredHex.x}, ${this.inputState.hoveredHex.y})` : null,
			selectedCreature: this.inputState.selectedCreature ? this.inputState.selectedCreature.name : null,
			shortcutsCount: this.shortcuts.size,
			touchEnabled: this.touchConfig.enabled
		};
	}

	/**
	 * Clean up event listeners and resources
	 */
	destroy(): void {
		// Remove Phaser event listeners
		if (this.pointerInput) {
			this.pointerInput.removeAllListeners();
		}
		
		if (this.keyboardInput) {
			this.keyboardInput.removeAllListeners();
		}
		
		// Clear references
		this.shortcuts.clear();
		this.boundHandlers.clear();
		this.scene = null;
		this.grid = null;
		
		console.log('[InputManager] Destroyed');
	}
}