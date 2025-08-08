import { Scene } from 'phaser';

export class BootScene extends Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load any assets needed for the loading screen here
        this.load.image('logo', 'assets/images/logo.png');
    }

    create() {
        console.log('BootScene: create');
        // Start the next scene
        this.scene.start('PreloadScene');
    }
}
