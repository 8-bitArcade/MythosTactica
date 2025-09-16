/**
 * Audio system integration test utilities
 */

import { SoundSys, getAudioMode, setAudioMode } from './soundsys';

export class AudioSystemTester {
	private soundSys: SoundSys;
	private testResults: { [key: string]: boolean } = {};

	constructor(soundSys: SoundSys) {
		this.soundSys = soundSys;
	}

	/**
	 * Run comprehensive audio system tests
	 */
	async runTests(): Promise<{ success: boolean; results: any; diagnostics: any }> {
		console.log('[AudioSystemTester] Starting audio system tests...');

		// Test 1: Basic initialization
		this.testResults.initialization = this.testInitialization();

		// Test 2: Volume controls
		this.testResults.volumeControls = this.testVolumeControls();

		// Test 3: Audio mode switching
		this.testResults.audioModes = this.testAudioModes();

		// Test 4: Sound loading
		this.testResults.soundLoading = await this.testSoundLoading();

		// Test 5: Phaser integration
		this.testResults.phaserIntegration = this.testPhaserIntegration();

		// Get diagnostics
		const diagnostics = this.soundSys.getDiagnostics();

		// Overall success
		const success = Object.values(this.testResults).every(result => result);

		console.log('[AudioSystemTester] Tests completed:', {
			success,
			results: this.testResults,
			diagnostics
		});

		return { success, results: this.testResults, diagnostics };
	}

	private testInitialization(): boolean {
		try {
			const diagnostics = this.soundSys.getDiagnostics();
			return diagnostics.envHasSound && diagnostics.contextState !== 'unavailable';
		} catch (error) {
			console.error('[AudioSystemTester] Initialization test failed:', error);
			return false;
		}
	}

	private testVolumeControls(): boolean {
		try {
			// Test effects volume
			const originalEffectsVol = this.soundSys.effectsVolume;
			this.soundSys.effectsVolume = 0.5;
			const effectsTest = this.soundSys.effectsVolume === 0.5;
			this.soundSys.effectsVolume = originalEffectsVol;

			// Test music volume
			const originalMusicVol = this.soundSys.musicVolume;
			this.soundSys.musicVolume = 0.7;
			const musicTest = this.soundSys.musicVolume === 0.7;
			this.soundSys.musicVolume = originalMusicVol;

			// Test all effects multiplier
			const originalMultiplier = this.soundSys['_allEffectsCoeff'];
			this.soundSys.allEffectsMultiplier = 0.3;
			const multiplierTest = this.soundSys['_allEffectsCoeff'] === 0.3;
			this.soundSys.allEffectsMultiplier = originalMultiplier;

			return effectsTest && musicTest && multiplierTest;
		} catch (error) {
			console.error('[AudioSystemTester] Volume controls test failed:', error);
			return false;
		}
	}

	private testAudioModes(): boolean {
		try {
			const originalMode = getAudioMode();

			// Test muted mode
			setAudioMode('muted', this.soundSys, null);
			const mutedTest = getAudioMode() === 'muted' && this.soundSys.effectsVolume === 0;

			// Test sfx mode
			setAudioMode('sfx', this.soundSys, null);
			const sfxTest = getAudioMode() === 'sfx' && this.soundSys.musicVolume === 0;

			// Test full mode
			setAudioMode('full', this.soundSys, null);
			const fullTest = getAudioMode() === 'full' && this.soundSys.musicVolume === 1;

			// Restore original mode
			setAudioMode(originalMode, this.soundSys, null);

			return mutedTest && sfxTest && fullTest;
		} catch (error) {
			console.error('[AudioSystemTester] Audio modes test failed:', error);
			return false;
		}
	}

	private async testSoundLoading(): Promise<boolean> {
		try {
			// Test loading a simple sound
			const testSoundPath = 'sounds/step';
			this.soundSys.loadSound(testSoundPath);

			// Wait a bit for loading to complete
			await new Promise(resolve => setTimeout(resolve, 2000));

			const playableSounds = this.soundSys.playableSounds;
			return playableSounds.includes(testSoundPath);
		} catch (error) {
			console.error('[AudioSystemTester] Sound loading test failed:', error);
			return false;
		}
	}

	private testPhaserIntegration(): boolean {
		try {
			const diagnostics = this.soundSys.getDiagnostics();
			// Test passes if Phaser integration is properly configured (even if not enabled)
			return diagnostics.phaserIntegration !== undefined;
		} catch (error) {
			console.error('[AudioSystemTester] Phaser integration test failed:', error);
			return false;
		}
	}

	/**
	 * Test audio playback (requires user interaction in modern browsers)
	 */
	async testPlayback(): Promise<boolean> {
		try {
			// Try to play a test sound
			const testSound = this.soundSys.playSFX('sounds/step');
			
			// Check if we got a valid sound object back
			return testSound !== null && typeof testSound === 'object';
		} catch (error) {
			console.error('[AudioSystemTester] Playback test failed:', error);
			return false;
		}
	}
}

/**
 * Quick test function for console use
 */
export async function testAudioSystem(soundSys: SoundSys): Promise<void> {
	const tester = new AudioSystemTester(soundSys);
	const results = await tester.runTests();
	
	console.log('=== Audio System Test Results ===');
	console.log('Overall Success:', results.success);
	console.log('Individual Tests:', results.results);
	console.log('System Diagnostics:', results.diagnostics);
	
	if (!results.success) {
		console.warn('Some audio tests failed. Check the results above for details.');
	}
}