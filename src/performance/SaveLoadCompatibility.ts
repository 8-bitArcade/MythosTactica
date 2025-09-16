/**
 * Save/Load Compatibility Manager for MythosTactica
 * Ensures backward compatibility with existing save files during Phaser 3 migration
 */

import Game from '../game';

export interface SaveFileMetadata {
	version: string;
	timestamp: number;
	gameMode: string;
	playerCount: number;
	checksum: string;
}

export interface LegacySaveData {
	version: string;
	gameState: any;
	creatures: any[];
	players: any[];
	grid: any;
	turn: number;
	metadata: SaveFileMetadata;
}

export interface ModernSaveData {
	version: string;
	gameState: any;
	creatureManager: any;
	playerManager: any;
	grid: any;
	turn: number;
	metadata: SaveFileMetadata;
	// New Phaser 3 specific data
	sceneData: any;
	animationStates: any;
	optimizationSettings: any;
}

export class SaveLoadCompatibility {
	private game: Game;
	private supportedVersions: string[] = ['0.4.0', '0.4.1', '0.4.2', '0.5.0'];
	private migrationHandlers: Map<string, (data: any) => any> = new Map();

	constructor(game: Game) {
		this.game = game;
		this.initializeMigrationHandlers();
	}

	/**
	 * Initialize migration handlers for different versions
	 */
	private initializeMigrationHandlers() {
		// Migration from 0.4.x to 0.5.0 (Phaser 3 migration)
		this.migrationHandlers.set('0.4.0->0.5.0', this.migrateFrom040To050.bind(this));
		this.migrationHandlers.set('0.4.1->0.5.0', this.migrateFrom041To050.bind(this));
		this.migrationHandlers.set('0.4.2->0.5.0', this.migrateFrom042To050.bind(this));
	}

	/**
	 * Check if a save file is compatible
	 */
	isCompatible(saveData: any): boolean {
		if (!saveData || !saveData.version) {
			console.warn('[SaveLoadCompatibility] Save data missing version information');
			return false;
		}

		return this.supportedVersions.includes(saveData.version);
	}

	/**
	 * Get the migration path for a save file
	 */
	private getMigrationPath(fromVersion: string, toVersion: string = '0.5.0'): string[] {
		const path: string[] = [];
		
		// Simple migration path - for now we support direct migration to 0.5.0
		if (fromVersion !== toVersion) {
			path.push(`${fromVersion}->${toVersion}`);
		}
		
		return path;
	}

	/**
	 * Migrate save data to current version
	 */
	migrateSaveData(saveData: LegacySaveData): ModernSaveData {
		const currentVersion = '0.5.0';
		
		if (saveData.version === currentVersion) {
			return saveData as unknown as ModernSaveData;
		}

		console.log(`[SaveLoadCompatibility] Migrating save from ${saveData.version} to ${currentVersion}`);

		let migratedData = { ...saveData };
		const migrationPath = this.getMigrationPath(saveData.version, currentVersion);

		for (const migration of migrationPath) {
			const handler = this.migrationHandlers.get(migration);
			if (handler) {
				migratedData = handler(migratedData);
				console.log(`[SaveLoadCompatibility] Applied migration: ${migration}`);
			} else {
				console.warn(`[SaveLoadCompatibility] No migration handler for: ${migration}`);
			}
		}

		return migratedData as unknown as ModernSaveData;
	}

	/**
	 * Migrate from version 0.4.0 to 0.5.0
	 */
	private migrateFrom040To050(data: LegacySaveData): ModernSaveData {
		console.log('[SaveLoadCompatibility] Migrating from 0.4.0 to 0.5.0');

		const migratedData: ModernSaveData = {
			version: '0.5.0',
			gameState: data.gameState,
			creatureManager: this.migrateCreatureData(data.creatures),
			playerManager: this.migratePlayerData(data.players),
			grid: this.migrateGridData(data.grid),
			turn: data.turn,
			metadata: {
				...data.metadata,
				version: '0.5.0',
				timestamp: Date.now()
			},
			sceneData: this.createDefaultSceneData(),
			animationStates: this.createDefaultAnimationStates(),
			optimizationSettings: this.createDefaultOptimizationSettings()
		};

		return migratedData;
	}

	/**
	 * Migrate from version 0.4.1 to 0.5.0
	 */
	private migrateFrom041To050(data: LegacySaveData): ModernSaveData {
		console.log('[SaveLoadCompatibility] Migrating from 0.4.1 to 0.5.0');
		
		// 0.4.1 to 0.5.0 migration is similar to 0.4.0 but may have additional fields
		const migratedData = this.migrateFrom040To050(data);
		
		// Handle any 0.4.1 specific changes here
		if (data.gameState && data.gameState.enhancedUI) {
			migratedData.gameState.uiEnhancements = data.gameState.enhancedUI;
		}

		return migratedData;
	}

	/**
	 * Migrate from version 0.4.2 to 0.5.0
	 */
	private migrateFrom042To050(data: LegacySaveData): ModernSaveData {
		console.log('[SaveLoadCompatibility] Migrating from 0.4.2 to 0.5.0');
		
		const migratedData = this.migrateFrom041To050(data);
		
		// Handle any 0.4.2 specific changes here
		if (data.gameState && data.gameState.audioSettings) {
			migratedData.gameState.soundSettings = data.gameState.audioSettings;
		}

		return migratedData;
	}

	/**
	 * Migrate creature data from legacy format
	 */
	private migrateCreatureData(legacyCreatures: any[]): any {
		const migratedCreatures = legacyCreatures.map(creature => {
			// Convert legacy creature format to new CreatureManager format
			return {
				...creature,
				// Add new Phaser 3 specific properties
				creatureSprite: {
					spriteKey: creature.type || 'default',
					animations: creature.animations || [],
					position: {
						x: creature.x || 0,
						y: creature.y || 0
					}
				},
				// Ensure all required properties exist
				id: creature.id || 0,
				team: creature.team || 0,
				stats: creature.stats || {},
				abilities: creature.abilities || []
			};
		});

		return {
			creatures: migratedCreatures,
			nextId: Math.max(...migratedCreatures.map(c => c.id), 0) + 1
		};
	}

	/**
	 * Migrate player data from legacy format
	 */
	private migratePlayerData(legacyPlayers: any[]): any {
		const migratedPlayers = legacyPlayers.map(player => {
			return {
				...player,
				// Add new PlayerManager specific properties
				id: player.id || 0,
				name: player.name || `Player ${player.id}`,
				team: player.team || player.id,
				// Ensure abilities array exists
				abilities: player.abilities || []
			};
		});

		return {
			players: migratedPlayers,
			activePlayerId: legacyPlayers.findIndex(p => p.active) || 0
		};
	}

	/**
	 * Migrate grid data from legacy format
	 */
	private migrateGridData(legacyGrid: any): any {
		return {
			...legacyGrid,
			// Add Phaser 3 specific grid properties
			renderOptimizations: {
				enableBatching: true,
				enableCulling: true
			},
			// Ensure hex data is properly formatted
			hexes: legacyGrid.hexes || []
		};
	}

	/**
	 * Create default scene data for new save format
	 */
	private createDefaultSceneData(): any {
		return {
			currentScene: 'MatchScene',
			sceneStack: ['MenuScene', 'PreloadScene', 'MatchScene'],
			sceneData: {}
		};
	}

	/**
	 * Create default animation states for new save format
	 */
	private createDefaultAnimationStates(): any {
		return {
			activeAnimations: [],
			animationQueue: [],
			animationSettings: {
				enableOptimizations: true,
				maxConcurrentAnimations: 10
			}
		};
	}

	/**
	 * Create default optimization settings for new save format
	 */
	private createDefaultOptimizationSettings(): any {
		return {
			enableObjectPooling: true,
			enableBatchRendering: true,
			enableCulling: true,
			targetFPS: 60,
			memoryThreshold: 80
		};
	}

	/**
	 * Validate migrated save data
	 */
	validateMigratedData(data: ModernSaveData): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		// Check required fields
		if (!data.version) {
			errors.push('Missing version field');
		}

		if (!data.gameState) {
			errors.push('Missing gameState field');
		}

		if (!data.creatureManager || !data.creatureManager.creatures) {
			errors.push('Missing or invalid creatureManager data');
		}

		if (!data.playerManager || !data.playerManager.players) {
			errors.push('Missing or invalid playerManager data');
		}

		if (!data.grid) {
			errors.push('Missing grid data');
		}

		if (typeof data.turn !== 'number') {
			errors.push('Invalid turn data');
		}

		// Validate creature data
		if (data.creatureManager && data.creatureManager.creatures) {
			data.creatureManager.creatures.forEach((creature, index) => {
				if (!creature.id && creature.id !== 0) {
					errors.push(`Creature ${index} missing id`);
				}
				if (!creature.stats) {
					errors.push(`Creature ${index} missing stats`);
				}
			});
		}

		// Validate player data
		if (data.playerManager && data.playerManager.players) {
			data.playerManager.players.forEach((player, index) => {
				if (!player.id && player.id !== 0) {
					errors.push(`Player ${index} missing id`);
				}
			});
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}

	/**
	 * Create a backup of the original save data
	 */
	createBackup(saveData: LegacySaveData): string {
		const backup = {
			...saveData,
			backupTimestamp: Date.now(),
			originalVersion: saveData.version
		};

		return JSON.stringify(backup, null, 2);
	}

	/**
	 * Load and migrate a save file
	 */
	async loadSaveFile(saveData: string | LegacySaveData): Promise<ModernSaveData> {
		let parsedData: LegacySaveData;

		// Parse save data if it's a string
		if (typeof saveData === 'string') {
			try {
				parsedData = JSON.parse(saveData);
			} catch (error) {
				throw new Error(`Failed to parse save data: ${error.message}`);
			}
		} else {
			parsedData = saveData;
		}

		// Check compatibility
		if (!this.isCompatible(parsedData)) {
			throw new Error(`Unsupported save file version: ${parsedData.version}`);
		}

		// Create backup
		const backup = this.createBackup(parsedData);
		console.log('[SaveLoadCompatibility] Created backup of original save data');

		// Migrate data
		const migratedData = this.migrateSaveData(parsedData);

		// Validate migrated data
		const validation = this.validateMigratedData(migratedData);
		if (!validation.isValid) {
			console.error('[SaveLoadCompatibility] Migration validation failed:', validation.errors);
			throw new Error(`Save file migration failed: ${validation.errors.join(', ')}`);
		}

		console.log('[SaveLoadCompatibility] Save file successfully migrated and validated');
		return migratedData;
	}

	/**
	 * Save data in the current format
	 */
	createSaveData(): ModernSaveData {
		const saveData: ModernSaveData = {
			version: '0.5.0',
			gameState: {
				state: this.game.gameState,
				turn: this.game.turn,
				pauseTime: this.game.pauseTime,
				timePool: this.game.timePool
			},
			creatureManager: {
				creatures: this.game.creatureManager.creatures.map(creature => {
					if (!creature) return null;
					return {
						id: creature.id,
						name: creature.name,
						type: creature.type,
						team: creature.team,
						x: creature.x,
						y: creature.y,
						stats: creature.stats,
						health: creature.health,
						energy: creature.energy,
						abilities: creature.abilities.map(ability => ({
							id: ability.id,
							used: ability.used,
							upgraded: ability.upgraded
						})),
						effects: creature.effects,
						dead: creature.dead
					};
				}).filter(Boolean),
				nextId: this.game.creatureManager.creatures.length
			},
			playerManager: {
				players: this.game.playerManager.players.map(player => ({
					id: player.id,
					name: player.name,
					team: (player as any).team,
					plasma: player.plasma,
					flipped: player.flipped,
					abilities: (player as any).abilities || []
				})),
				activePlayerId: this.game.playerManager.activePlayer?.id || 0
			},
			grid: {
				// Save essential grid state
				hexes: this.game.grid?.hexes || []
			},
			turn: this.game.turn,
			metadata: {
				version: '0.5.0',
				timestamp: Date.now(),
				gameMode: this.game.playerMode ? `${this.game.playerMode}P` : 'Unknown',
				playerCount: this.game.playerMode || 0,
				checksum: this.generateChecksum()
			},
			sceneData: {
				currentScene: this.game.currentScene?.scene.key || 'MatchScene'
			},
			animationStates: {
				activeAnimations: this.game.animations?.getActiveAnimationCount() || 0,
				animationQueue: this.game.animationQueue || []
			},
			optimizationSettings: {
				enableObjectPooling: true,
				enableBatchRendering: true,
				enableCulling: true,
				targetFPS: 60,
				memoryThreshold: 80
			}
		};

		return saveData;
	}

	/**
	 * Generate a checksum for save data integrity
	 */
	private generateChecksum(): string {
		// Simple checksum based on game state
		const data = `${this.game.turn}-${this.game.gameState}-${this.game.creatureManager.creatures.length}`;
		let hash = 0;
		for (let i = 0; i < data.length; i++) {
			const char = data.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return hash.toString(16);
	}

	/**
	 * Test save/load compatibility
	 */
	async testCompatibility(): Promise<{ success: boolean; errors: string[] }> {
		const errors: string[] = [];

		try {
			// Create a test save
			const testSave = this.createSaveData();
			console.log('[SaveLoadCompatibility] Created test save data');

			// Convert to string and back
			const saveString = JSON.stringify(testSave);
			const loadedSave = await this.loadSaveFile(saveString);

			// Validate the loaded save
			const validation = this.validateMigratedData(loadedSave);
			if (!validation.isValid) {
				errors.push(...validation.errors);
			}

			// Test legacy save migration (simulate 0.4.0 save)
			const legacySave: LegacySaveData = {
				version: '0.4.0',
				gameState: { state: 'playing' },
				creatures: [],
				players: [],
				grid: { hexes: [] },
				turn: 1,
				metadata: {
					version: '0.4.0',
					timestamp: Date.now(),
					gameMode: '2P',
					playerCount: 2,
					checksum: 'test'
				}
			};

			const migratedLegacy = await this.loadSaveFile(legacySave);
			const legacyValidation = this.validateMigratedData(migratedLegacy);
			if (!legacyValidation.isValid) {
				errors.push(...legacyValidation.errors.map(e => `Legacy migration: ${e}`));
			}

		} catch (error) {
			errors.push(`Test failed: ${error.message}`);
		}

		const success = errors.length === 0;
		
		if (success) {
			console.log('[SaveLoadCompatibility] Compatibility test passed');
		} else {
			console.error('[SaveLoadCompatibility] Compatibility test failed:', errors);
		}

		return { success, errors };
	}
}