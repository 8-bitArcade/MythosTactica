import { Scene } from 'phaser';
import Game from '../game';
import { getGameConfig } from '../script';

export class MenuScene extends Scene {
    private game3?: Game;

    constructor() {
        super('MenuScene');
    }

    init(data?: { game?: Game }) {
        console.log('[MenuScene] init() called with data:', data);
        
        if (data && data.game) {
            this.game3 = data.game;
            this.game3.currentScene = this;
            console.log('[MenuScene] Game instance set successfully');
        }
    }

    create() {
        console.log('[MenuScene] create() called - setting up menu');
        
        // Create a simple background
        this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x1a1a2e
        );

        // Add title text
        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 100,
            'MythosTactica',
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // Add instructions
        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'Configure your game settings in the form above,\nthen click Start to begin!',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#cccccc',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Set up start button listener
        this.setupStartButton();
        
        // Make sure the game setup form is visible
        this.showGameSetupForm();
    }

    private setupStartButton() {
        // Listen for the start button click from the DOM
        const startButton = document.getElementById('startButton');
        const startMatchButton = document.getElementById('startMatchButton');
        
        if (startButton) {
            startButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.startGame();
                return false;
            });
        }
        
        if (startMatchButton) {
            startMatchButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.startGame();
                return false;
            });
        }

        // Also listen for form submission
        const gameSetupForm = document.getElementById('gameSetup') as HTMLFormElement;
        if (gameSetupForm) {
            gameSetupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.startGame();
                return false;
            });
        }
    }

    private startGame() {
        console.log('[MenuScene] Start button clicked, beginning game...');
        
        if (!this.game3 || !this.game3.gameManager) {
            console.error('[MenuScene] Game instance or GameManager not available');
            return;
        }

        // Get the game configuration from the form
        const config = getGameConfig();
        console.log('[MenuScene] Game config:', config);

        // Hide the game setup form
        this.hideGameSetupForm();
        
        // Start the loading process
        this.game3.gameManager.loadGame(config);
        
        // Transition to PreloadScene
        console.log('[MenuScene] Transitioning to PreloadScene...');
        this.scene.start('PreloadScene', { game: this.game3 });
    }

    private showGameSetupForm() {
        // Show the game setup container
        const gameSetupContainer = document.getElementById('gameSetupContainer');
        const gameSetup = document.getElementById('gameSetup');
        
        if (gameSetupContainer) {
            gameSetupContainer.style.display = 'block';
        }
        
        if (gameSetup) {
            gameSetup.style.display = 'block';
        }

        // Hide the loader
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hide');
        }

        // Hide combat wrapper
        const combatWrapper = document.getElementById('combatwrapper');
        if (combatWrapper) {
            combatWrapper.style.display = 'none';
        }
    }

    private hideGameSetupForm() {
        // Hide the game setup container
        const gameSetupContainer = document.getElementById('gameSetupContainer');
        if (gameSetupContainer) {
            gameSetupContainer.style.display = 'none';
        }

        // Show the loader
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.remove('hide');
        }
    }
}
