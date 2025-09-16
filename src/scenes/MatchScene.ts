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
		
		// Update animation definitions for the new scene
		if (this.gameInstance.animations) {
			this.gameInstance.animations.updateAnimationDefinitions();
		}
	}

	create() {
		// Set up the main game area
		this.setupGameArea();
		
		// Initialize audio system with Phaser 3 integration
		if (this.gameInstance?.soundsys) {
			this.gameInstance.soundsys.initializePhaserIntegration(this, false); // Use Web Audio by default
			
			// Test audio system
			this.gameInstance.soundsys.testAudioSystem().then(result => {
				if (!result.success) {
					console.warn('[MatchScene] Audio system test failed:', result.errors);
				} else {
					console.log('[MatchScene] Audio system test passed');
				}
			});

			// Run comprehensive audio tests in development
			if (process.env.NODE_ENV === 'development') {
				import('../sound/audio-test').then(({ AudioSystemTester }) => {
					const tester = new AudioSystemTester(this.gameInstance.soundsys);
					tester.runTests().then(results => {
						console.log('[MatchScene] Comprehensive audio tests completed:', results);
					});
				});
			}
		}
		
		// Grid should already be available - just make it visible
		if (this.gameInstance?.grid) {
			this.gameInstance.grid.showGrid(true);
		}
		
		// Initialize InputManager if not already done
		if (this.gameInstance?.inputManager && !this.gameInstance.inputManager.getInputState().enabled) {
			this.gameInstance.inputManager.initialize(this);
			this.gameInstance.inputManager.setInputMode('game');
		}
	}

	private setupGameArea() {
		// Create background
		const { width, height } = this.cameras.main;
		this.add.rectangle(width / 2, height / 2, width, height, 0x2a2a2a);
	}
	update(time: number, delta: number) {
		// Connect to game loop integration
		if (this.gameInstance) {
			// Call game update logic
			this.gameInstance.phaserUpdate();
			
			// Call game render logic
			this.gameInstance.phaserRender();
			
			// Optimize animation performance periodically (every 60 frames at 60fps = 1 second)
			if (this.gameInstance.animations && time % 1000 < delta) {
				this.gameInstance.animations.optimizePerformance();
			}

			// Check performance and apply optimizations if needed
			if (this.gameInstance.performanceManager && time % 5000 < delta) {
				const status = this.gameInstance.performanceManager.getPerformanceStatus();
				if (status === 'poor' || status === 'critical') {
					console.warn(`[MatchScene] Performance status: ${status}, applying optimizations`);
				}
			}
		}
	}

	// Camera shake utility method for backwards compatibility with Phaser 2
	cameraShake(intensity: number, duration: number, force?: boolean, direction?: any, internal?: boolean) {
		// Convert Phaser 2 shake parameters to Phaser 3
		const pixelIntensity = intensity * 10;
		this.cameras.main.shake(duration, pixelIntensity);
	}
}