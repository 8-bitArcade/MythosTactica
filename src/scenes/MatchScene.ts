import { Scene } from 'phaser';
import Game from '../game';

export class MatchScene extends Scene {
	private gameInstance: Game;

	constructor() {
		super({ key: 'MatchScene' });
	}
	
	init(data: { game: Game }) {
		this.gameInstance = data.game;
		// Set the current scene reference for backwards compatibility
		this.gameInstance.currentScene = this;
	}

	create() {
		// Set up the main game area
		this.setupGameArea();
		
		// Grid should already be available - just make it visible
		if (this.gameInstance?.grid) {
			this.gameInstance.grid.showGrid(true);
		}
	}

	private setupGameArea() {
		// Create background
		const { width, height } = this.cameras.main;
		this.add.rectangle(width / 2, height / 2, width, height, 0x2a2a2a);
	}
	update(time: number, delta: number) {
		// Simple update - no complex logic needed
	}

	// Camera shake utility method for backwards compatibility with Phaser 2
	cameraShake(intensity: number, duration: number, force?: boolean, direction?: any, internal?: boolean) {
		// Convert Phaser 2 shake parameters to Phaser 3
		const pixelIntensity = intensity * 10;
		this.cameras.main.shake(duration, pixelIntensity);
	}
}