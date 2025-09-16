import { BufferLoader } from './bufferloader';
import { getUrl } from '../assets';
import { MusicPlayer } from './musicplayer';
import { clamp } from '../utility/math';

export type AudioMode = 'full' | 'sfx' | 'muted';
let currentAudioMode: AudioMode = 'full';

export function getAudioMode(): AudioMode {
	return currentAudioMode;
}

// Phaser 3 integration interface
interface PhaserAudioIntegration {
	scene?: Phaser.Scene;
	phaserSounds: Map<string, Phaser.Sound.BaseSound>;
	usePhaserAudio: boolean;
}

type SoundSysConfig = {
	musicVolume?: number;
	effectsVolume?: number;
	heartbeatVolume?: number;
	announcerVolume?: number;
	paths?: string[];
};

export class SoundSys {
	musicPlayer: MusicPlayer;

	private envHasSound = window && ('AudioContext' in window || 'webkitAudioContext' in window);
	private context: AudioContext;
	private loadedPaths: Record<string, AudioBuffer> = {};

	private musicGainNode: GainNode;
	private effectsGainNode: GainNode;
	private heartbeatGainNode: GainNode;
	private announcerGainNode: GainNode;

	private _musicVol = 1;
	private _effectsVol = 1;
	private _heartbeatVol = 1;
	private _announcerVol = 1;
	private _allEffectsCoeff = 1;

	// Phaser 3 integration properties
	private phaserIntegration: PhaserAudioIntegration = {
		scene: undefined,
		phaserSounds: new Map(),
		usePhaserAudio: false
	};

	// Error handling and retry mechanism
	private loadingErrors: Map<string, number> = new Map();
	private maxRetries = 3;

	constructor(config: SoundSysConfig) {
		this.musicPlayer = new MusicPlayer();

		if (this.envHasSound) {
			try {
				this.context = new (AudioContext || (window as any).webkitAudioContext)();
				this.initializeAudioNodes(config);
			} catch (error) {
				console.error('[SoundSys] Failed to initialize AudioContext:', error);
				this.envHasSound = false;
			}

			if ('paths' in config && config.paths) {
				for (const path of config.paths) {
					this.loadSound(path);
				}
			}
		}
	}

	/**
	 * Initialize audio gain nodes with error handling
	 */
	private initializeAudioNodes(config: SoundSysConfig) {
		try {
			this.musicGainNode = this.context.createGain();
			this.musicGainNode.connect(this.context.destination);
			if ('musicVolume' in config) {
				this.musicVolume = config.musicVolume;
			}

			this.effectsGainNode = this.context.createGain();
			this.effectsGainNode.connect(this.context.destination);
			if ('effectsVolume' in config) {
				this.effectsVolume = config.effectsVolume;
			}

			this.heartbeatGainNode = this.context.createGain();
			this.heartbeatGainNode.connect(this.context.destination);
			if ('heartbeatVolume' in config) {
				this.heartbeatVolume = config.heartbeatVolume;
			}

			this.announcerGainNode = this.context.createGain();
			this.announcerGainNode.connect(this.context.destination);
			if ('announcerVolume' in config) {
				this.announcerVolume = config.announcerVolume;
			}
		} catch (error) {
			console.error('[SoundSys] Failed to initialize audio nodes:', error);
			throw error;
		}
	}

	/**
	 * Initialize Phaser 3 integration
	 * @param scene - The Phaser scene to integrate with
	 * @param usePhaserAudio - Whether to use Phaser's audio system for sound effects
	 */
	initializePhaserIntegration(scene: Phaser.Scene, usePhaserAudio = false) {
		this.phaserIntegration.scene = scene;
		this.phaserIntegration.usePhaserAudio = usePhaserAudio;
		
		console.log('[SoundSys] Phaser 3 integration initialized', {
			sceneKey: scene.scene.key,
			usePhaserAudio
		});

		// Resume AudioContext if it was suspended (required by modern browsers)
		if (this.envHasSound && this.context.state === 'suspended') {
			this.resumeAudioContext();
		}
	}

	/**
	 * Resume AudioContext (required by modern browsers after user interaction)
	 */
	async resumeAudioContext() {
		if (this.envHasSound && this.context.state === 'suspended') {
			try {
				await this.context.resume();
				console.log('[SoundSys] AudioContext resumed successfully');
			} catch (error) {
				console.error('[SoundSys] Failed to resume AudioContext:', error);
			}
		}
	}

	get musicVolume() {
		return this._musicVol;
	}
	set musicVolume(level: number) {
		if (this.envHasSound) {
			this._musicVol = clamp(level, 0, 1);
			this.musicGainNode.gain.value = this._musicVol;
		}
	}
	get effectsVolume() {
		return this._effectsVol;
	}
	set effectsVolume(level: number) {
		if (this.envHasSound) {
			this._effectsVol = clamp(level, 0, 1);
			this.effectsGainNode.gain.value = this._effectsVol * this._allEffectsCoeff;
		}
		// Also update Phaser sounds if using Phaser audio
		this.updatePhaserSoundVolumes();
	}

	get heartbeatVolume() {
		return this._heartbeatVol;
	}
	set heartbeatVolume(level: number) {
		if (this.envHasSound) {
			this._heartbeatVol = clamp(level, 0, 1);
			this.heartbeatGainNode.gain.value = this._heartbeatVol * this._allEffectsCoeff;
		}
		// Also update Phaser sounds if using Phaser audio
		this.updatePhaserSoundVolumes();
	}

	get announcerVolume() {
		return this._announcerVol;
	}
	set announcerVolume(level: number) {
		if (this.envHasSound) {
			this._announcerVol = clamp(level, 0, 1);
			this.announcerGainNode.gain.value = this._announcerVol * this._allEffectsCoeff;
		}
		// Also update Phaser sounds if using Phaser audio
		this.updatePhaserSoundVolumes();
	}

	set allEffectsMultiplier(level: number) {
		if (this.envHasSound) {
			this._allEffectsCoeff = clamp(level, 0, 1);
			// NOTE: Trigger all effects volume setters so that
			// volumes are updated with new _allEffectsCoeff value.
			this.effectsVolume = this._effectsVol;
			this.heartbeatVolume = this._heartbeatVol;
			this.announcerVolume = this._announcerVol;
		}
		// Also update Phaser sounds if using Phaser audio
		this.updatePhaserSoundVolumes();
	}

	/**
	 * Update volume for all Phaser sounds when volume settings change
	 */
	private updatePhaserSoundVolumes() {
		if (!this.phaserIntegration.usePhaserAudio) {
			return;
		}

		// Update global volume for Phaser sound manager if available
		if (this.phaserIntegration.scene && this.phaserIntegration.scene.sound) {
			// Set master volume based on current audio mode
			const masterVolume = currentAudioMode === 'muted' ? 0 : 
								currentAudioMode === 'sfx' ? this._allEffectsCoeff :
								this._allEffectsCoeff;
			
			// Phaser 3 uses volume property
			if ('volume' in this.phaserIntegration.scene.sound) {
				(this.phaserIntegration.scene.sound as any).volume = masterVolume;
			}
		}
	}

	playMusic() {
		this.musicPlayer.playRandom();
	}

	stopMusic() {
		this.musicPlayer.stopMusic();
	}

	loadSound(relativePath: string) {
		if (!this.envHasSound) {
			return;
		}

		// Check if already loaded
		if (this.loadedPaths[relativePath]) {
			return;
		}

		// Check retry count
		const retryCount = this.loadingErrors.get(relativePath) || 0;
		if (retryCount >= this.maxRetries) {
			console.warn(`[SoundSys] Max retries reached for ${relativePath}, skipping`);
			return;
		}

		const url = getUrl(relativePath);
		
		// Try Phaser 3 audio loading first if available and enabled
		if (this.phaserIntegration.usePhaserAudio && this.phaserIntegration.scene) {
			this.loadSoundWithPhaser(relativePath, url);
		} else {
			this.loadSoundWithWebAudio(relativePath, url);
		}
	}

	/**
	 * Load sound using Phaser 3's audio system
	 */
	private loadSoundWithPhaser(relativePath: string, url: string) {
		const scene = this.phaserIntegration.scene;
		if (!scene) return;

		try {
			// Generate a unique key for Phaser's cache
			const soundKey = `sound_${relativePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
			
			// Load the audio file through Phaser
			scene.load.audio(soundKey, url);
			
			scene.load.once(`filecomplete-audio-${soundKey}`, () => {
				console.log(`[SoundSys] Successfully loaded ${relativePath} via Phaser`);
				// Store reference for later playback
				this.phaserIntegration.phaserSounds.set(relativePath, scene.sound.add(soundKey));
			});

			scene.load.once(`loaderror`, (file) => {
				if (file.key === soundKey) {
					this.handleLoadError(relativePath, `Phaser load error: ${file.src}`);
				}
			});

			// Start loading if not already in progress
			if (!scene.load.isLoading()) {
				scene.load.start();
			}
		} catch (error) {
			console.error(`[SoundSys] Error loading ${relativePath} with Phaser:`, error);
			this.handleLoadError(relativePath, error.message);
		}
	}

	/**
	 * Load sound using Web Audio API (fallback method)
	 */
	private loadSoundWithWebAudio(relativePath: string, url: string) {
		try {
			const bufferLoader = new BufferLoader(this.context, [url], (arraybuffer: AudioBuffer[]) => {
				if (arraybuffer && arraybuffer[0]) {
					this.loadedPaths[relativePath] = arraybuffer[0];
					console.log(`[SoundSys] Successfully loaded ${relativePath} via Web Audio`);
					// Clear any previous errors
					this.loadingErrors.delete(relativePath);
				} else {
					this.handleLoadError(relativePath, 'Empty audio buffer received');
				}
			});

			bufferLoader.load();
		} catch (error) {
			console.error(`[SoundSys] Error loading ${relativePath} with Web Audio:`, error);
			this.handleLoadError(relativePath, error.message);
		}
	}

	/**
	 * Handle loading errors with retry mechanism
	 */
	private handleLoadError(relativePath: string, errorMessage: string) {
		const retryCount = (this.loadingErrors.get(relativePath) || 0) + 1;
		this.loadingErrors.set(relativePath, retryCount);
		
		console.error(`[SoundSys] Failed to load ${relativePath} (attempt ${retryCount}/${this.maxRetries}):`, errorMessage);
		
		if (retryCount < this.maxRetries) {
			// Retry after a delay
			setTimeout(() => {
				console.log(`[SoundSys] Retrying load for ${relativePath}`);
				this.loadSound(relativePath);
			}, 1000 * retryCount); // Exponential backoff
		}
	}

	private playSound(sound: AudioBuffer, node: GainNode): SoundSysAudioBufferSourceNode {
		if (!this.envHasSound) {
			return new NullAudioBufferSourceNode();
		}

		const source = this.context.createBufferSource();
		source.buffer = sound;
		source.connect(node);
		source.start(0);

		return source;
	}

	playSFX(relativePath: string): SoundSysAudioBufferSourceNode {
		// Resume AudioContext if needed
		this.resumeAudioContext();

		// Try Phaser audio first if available
		if (this.phaserIntegration.usePhaserAudio && this.phaserIntegration.phaserSounds.has(relativePath)) {
			return this.playPhaserSound(relativePath, this._effectsVol * this._allEffectsCoeff);
		}

		// Fallback to Web Audio
		if (this.envHasSound && this.loadedPaths.hasOwnProperty(relativePath)) {
			return this.playSound(this.loadedPaths[relativePath], this.effectsGainNode);
		}

		// If sound not loaded, try to load it now
		if (!this.loadedPaths.hasOwnProperty(relativePath)) {
			console.warn(`[SoundSys] Sound not loaded: ${relativePath}, attempting to load now`);
			this.loadSound(relativePath);
		}

		return new NullAudioBufferSourceNode();
	}

	playHeartBeat(relativePath: string): SoundSysAudioBufferSourceNode {
		// Resume AudioContext if needed
		this.resumeAudioContext();

		// Try Phaser audio first if available
		if (this.phaserIntegration.usePhaserAudio && this.phaserIntegration.phaserSounds.has(relativePath)) {
			return this.playPhaserSound(relativePath, this._heartbeatVol * this._allEffectsCoeff);
		}

		// Fallback to Web Audio
		if (this.envHasSound && this.loadedPaths.hasOwnProperty(relativePath)) {
			return this.playSound(this.loadedPaths[relativePath], this.heartbeatGainNode);
		}

		// If sound not loaded, try to load it now
		if (!this.loadedPaths.hasOwnProperty(relativePath)) {
			console.warn(`[SoundSys] Sound not loaded: ${relativePath}, attempting to load now`);
			this.loadSound(relativePath);
		}

		return new NullAudioBufferSourceNode();
	}

	playShout(shoutName: string): SoundSysAudioBufferSourceNode {
		const SHOUT_PATH_PREFIX = 'units/shouts/';
		const path = SHOUT_PATH_PREFIX + shoutName;

		// Resume AudioContext if needed
		this.resumeAudioContext();

		// Try Phaser audio first if available
		if (this.phaserIntegration.usePhaserAudio && this.phaserIntegration.phaserSounds.has(path)) {
			return this.playPhaserSound(path, this._announcerVol * this._allEffectsCoeff);
		}

		// Fallback to Web Audio
		if (this.envHasSound && this.loadedPaths.hasOwnProperty(path)) {
			return this.playSound(this.loadedPaths[path], this.announcerGainNode);
		}

		// If sound not loaded, try to load it now
		if (!this.loadedPaths.hasOwnProperty(path)) {
			console.warn(`[SoundSys] Sound not loaded: ${path}, attempting to load now`);
			this.loadSound(path);
		}

		return new NullAudioBufferSourceNode();
	}

	/**
	 * Play sound using Phaser 3's audio system
	 */
	private playPhaserSound(relativePath: string, volume: number): SoundSysAudioBufferSourceNode {
		const phaserSound = this.phaserIntegration.phaserSounds.get(relativePath);
		if (!phaserSound) {
			return new NullAudioBufferSourceNode();
		}

		try {
			// Set volume and play - Phaser 3 uses volume property, not setVolume method
			if ('volume' in phaserSound) {
				(phaserSound as any).volume = volume;
			}
			phaserSound.play();

			// Return a wrapper that implements the expected interface
			return new PhaserAudioWrapper(phaserSound);
		} catch (error) {
			console.error(`[SoundSys] Error playing Phaser sound ${relativePath}:`, error);
			return new NullAudioBufferSourceNode();
		}
	}

	get playableSounds() {
		const webAudioSounds = Object.keys(this.loadedPaths);
		const phaserSounds = Array.from(this.phaserIntegration.phaserSounds.keys());
		return [...webAudioSounds, ...phaserSounds];
	}

	/**
	 * Get diagnostic information about the audio system
	 */
	getDiagnostics() {
		return {
			envHasSound: this.envHasSound,
			contextState: this.envHasSound ? this.context.state : 'unavailable',
			loadedWebAudioSounds: Object.keys(this.loadedPaths).length,
			loadedPhaserSounds: this.phaserIntegration.phaserSounds.size,
			loadingErrors: Array.from(this.loadingErrors.entries()),
			currentAudioMode,
			volumes: {
				music: this._musicVol,
				effects: this._effectsVol,
				heartbeat: this._heartbeatVol,
				announcer: this._announcerVol,
				allEffectsCoeff: this._allEffectsCoeff
			},
			phaserIntegration: {
				hasScene: !!this.phaserIntegration.scene,
				sceneKey: this.phaserIntegration.scene?.scene.key,
				usePhaserAudio: this.phaserIntegration.usePhaserAudio
			}
		};
	}

	/**
	 * Test audio system functionality
	 */
	async testAudioSystem(): Promise<{ success: boolean; errors: string[] }> {
		const errors: string[] = [];

		// Test AudioContext
		if (!this.envHasSound) {
			errors.push('AudioContext not available');
		} else if (this.context.state === 'suspended') {
			try {
				await this.resumeAudioContext();
				if (this.context.state === 'suspended') {
					errors.push('AudioContext remains suspended after resume attempt');
				}
			} catch (error) {
				errors.push(`Failed to resume AudioContext: ${error.message}`);
			}
		}

		// Test volume controls
		try {
			const originalVolume = this._effectsVol;
			this.effectsVolume = 0.5;
			if (this._effectsVol !== 0.5) {
				errors.push('Volume control not working properly');
			}
			this.effectsVolume = originalVolume;
		} catch (error) {
			errors.push(`Volume control error: ${error.message}`);
		}

		// Test Phaser integration if enabled
		if (this.phaserIntegration.usePhaserAudio && !this.phaserIntegration.scene) {
			errors.push('Phaser audio enabled but no scene available');
		}

		return {
			success: errors.length === 0,
			errors
		};
	}

	/**
	 * Clean up resources
	 */
	dispose() {
		// Stop all Phaser sounds
		this.phaserIntegration.phaserSounds.forEach(sound => {
			if (sound.isPlaying) {
				sound.stop();
			}
		});
		this.phaserIntegration.phaserSounds.clear();

		// Close AudioContext
		if (this.envHasSound && this.context) {
			this.context.close().catch(error => {
				console.warn('[SoundSys] Error closing AudioContext:', error);
			});
		}

		// Clear loaded sounds
		this.loadedPaths = {};
		this.loadingErrors.clear();

		console.log('[SoundSys] Resources disposed');
	}
}

class NullAudioBufferSourceNode {
	play() {
		// pass
	}
	pause() {
		// pass
	}
}

/**
 * Wrapper class to make Phaser sounds compatible with Web Audio API interface
 */
class PhaserAudioWrapper {
	private phaserSound: Phaser.Sound.BaseSound;

	constructor(phaserSound: Phaser.Sound.BaseSound) {
		this.phaserSound = phaserSound;
	}

	play() {
		if (!this.phaserSound.isPlaying) {
			this.phaserSound.play();
		}
	}

	pause() {
		if (this.phaserSound.isPlaying) {
			this.phaserSound.pause();
		}
	}

	stop() {
		this.phaserSound.stop();
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNullAudioBufferSourcNode(o: any) {
	if (!o) return false;
	return o instanceof NullAudioBufferSourceNode;
}

type SoundSysAudioBufferSourceNode = AudioBufferSourceNode | NullAudioBufferSourceNode;

export function setAudioMode(mode: AudioMode, soundSysInstance: SoundSys, uiInstance: any): void {
	currentAudioMode = mode;

	if (mode === 'muted') {
		soundSysInstance.musicVolume = 0;
		soundSysInstance.effectsVolume = 0;
		soundSysInstance.heartbeatVolume = 0;
		soundSysInstance.announcerVolume = 0;
		soundSysInstance.stopMusic();
	} else if (mode === 'sfx') {
		soundSysInstance.musicVolume = 0;
		soundSysInstance.effectsVolume = 1;
		soundSysInstance.heartbeatVolume = 1;
		soundSysInstance.announcerVolume = 1;
		soundSysInstance.stopMusic();
	} else if (mode === 'full') {
		soundSysInstance.musicVolume = 1;
		soundSysInstance.effectsVolume = 1;
		soundSysInstance.heartbeatVolume = 1;
		soundSysInstance.announcerVolume = 1;
		soundSysInstance.playMusic();
	}
	if (uiInstance) {
		uiInstance.updateAudioIcon(mode);
	}
}
export function cycleAudioMode(soundSysInstance: SoundSys, uiInstance: any): AudioMode {
	let newMode: AudioMode;

	if (currentAudioMode === 'full') {
		newMode = 'sfx';
	} else if (currentAudioMode === 'sfx') {
		newMode = 'muted';
	} else {
		newMode = 'full';
	}

	setAudioMode(newMode, soundSysInstance, uiInstance);
	return newMode;
}
