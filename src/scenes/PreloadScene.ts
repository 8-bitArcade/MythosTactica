import { Scene } from 'phaser';
import { use as loadAssets } from '../assets';
import Game from '../game';
import { GameManager } from '../services/GameManager';

export class PreloadScene extends Scene {
    private progressBar!: HTMLElement;
    private progressText!: Phaser.GameObjects.Text;
    private game3?: Game;

    constructor() {
        super('PreloadScene');
    }

    init(data?: { game?: Game }) {
        console.log('[PreloadScene] init() called with data:', data);
        
        // If a Game instance is passed, store it
        if (data && data.game) {
            this.game3 = data.game;
            this.game3.currentScene = this;
            console.log('[PreloadScene] Game instance set successfully');
        } else {
            console.error('[PreloadScene] No Game instance provided - this scene requires game data');
        }
    }

    preload() {
        console.log('[PreloadScene] preload() starting...');
        
        // Ensure we have the game instance
        if (!this.game3 || !this.game3.gameManager) {
            console.error('[PreloadScene] Game instance or GameManager not available');
            return;
        }

        // Get the loading bar element from the DOM (correct selector: #barLoader .progress)
        this.progressBar = document.querySelector('#barLoader .progress') as HTMLElement;
        
        // Create progress text
        this.progressText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            'Loading...',
            { 
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // Update progress bar during load
        this.load.on('progress', (value: number) => {
            const percent = Math.round(value * 100);
            console.log(`[PreloadScene] Loading progress: ${percent}%`);
            if (this.progressBar) {
                this.progressBar.style.width = `${percent}%`;
            }
            this.progressText.setText(`${percent}%`);
        });

        // Handle loading completion
        this.load.on('complete', () => {
            console.log('[PreloadScene] Asset loading complete, triggering game start');
            this.completeGameLoading();
        });

        // The GameManager should have already set up the asset loading
        // We just need to trigger it to start
        console.log('[PreloadScene] Starting asset loading...');
        this.loadAssets();
    }

    private loadAssets() {
        // Load assets using the new Phaser 3 system
        loadAssets(this);
        
        // Create a test pattern while we don't have real assets
        this.createTestPattern();
        
        // Load some basic assets for testing
        // this.load.image('logo', 'assets/images/logo.png');
        // this.load.image('test', 'assets/images/test.png');
        
        // Example of loading other asset types:
        // this.load.spritesheet('character', 'assets/sprites/character.png', { 
        //     frameWidth: 32, 
        //     frameHeight: 32 
        // });
        // this.load.audio('background-music', 'assets/audio/background.mp3');
        // this.load.atlas('textures', 'assets/atlas/textures.png', 'assets/atlas/textures.json');
    }

    private createTestPattern() {
        // Create a simple test pattern to verify rendering is working
        const { width, height } = this.cameras.main;
        
        // Add a solid color background
        this.add.rectangle(
            width / 2, 
            height / 2, 
            width, 
            height, 
            0x1a1a2e
        );
        
        // Add a simple grid
        const grid = this.add.graphics({ lineStyle: { width: 1, color: 0x2a2a4a, alpha: 0.5 } });
        for (let x = 0; x < width; x += 50) {
            grid.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y < height; y += 50) {
            grid.lineBetween(0, y, width, y);
        }
    }

    /**
     * Complete the game loading process by calling the proper GameManager method
     * This is called when we know loading is complete
     */
    private completeGameLoading() {
        console.log('[PreloadScene] Completing game loading...');
        
        if (!this.game3 || !this.game3.gameManager) {
            console.error('[PreloadScene] Game instance or GameManager not available for completion');
            return;
        }

        const gameManager = this.game3.gameManager;
        
        // Call the proper GameManager method to finish loading
        // Pass 100 as the progress value since we know loading is complete
        console.log('[PreloadScene] Calling GameManager.loadFinish() with progress 100...');
        gameManager.loadFinish(100);
        
        // Hide the loading screen
        const loadingScreen = document.getElementById('loader');
        if (loadingScreen) {
            loadingScreen.classList.add('hide');
        }
    }

    create() {
        // Add a simple animation to the progress text
        this.tweens.add({
            targets: this.progressText,
            scale: { from: 1, to: 1.1 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // Scene transition is handled by GameManager.loadFinish() when assets complete loading
        // This ensures proper game initialization and transition to MatchScene
    }

    destroy() {
        console.log('[PreloadScene] Scene destroyed, cleaning up');
        // Clean up DOM elements and game objects
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
        }
        if (this.progressText) {
            this.progressText.destroy();
        }
        
        // Ensure loading screen is hidden when scene is destroyed
        const loadingScreen = document.getElementById('loader');
        if (loadingScreen) {
            loadingScreen.classList.add('hide');
        }
    }
}
