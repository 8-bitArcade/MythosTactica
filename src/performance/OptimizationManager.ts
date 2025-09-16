/**
 * Optimization Manager for MythosTactica
 * Implements Phaser 3 optimization techniques including object pooling and batch rendering
 */

import Game from '../game';
import { Creature } from '../models/Creature';

export interface OptimizationConfig {
	enableObjectPooling: boolean;
	enableBatchRendering: boolean;
	enableSpriteAtlasing: boolean;
	enableCulling: boolean;
	maxConcurrentAnimations: number;
	maxConcurrentTweens: number;
	targetFPS: number;
	memoryThreshold: number;
}

export interface PooledObject {
	isActive: boolean;
	reset(): void;
	destroy(): void;
}

export class ObjectPool<T extends PooledObject> {
	private pool: T[] = [];
	private createFn: () => T;
	private resetFn?: (obj: T) => void;
	private maxSize: number;

	constructor(createFn: () => T, maxSize: number = 100, resetFn?: (obj: T) => void) {
		this.createFn = createFn;
		this.resetFn = resetFn;
		this.maxSize = maxSize;
	}

	/**
	 * Get an object from the pool or create a new one
	 */
	acquire(): T {
		let obj = this.pool.pop();
		
		if (!obj) {
			obj = this.createFn();
		}
		
		obj.isActive = true;
		
		if (this.resetFn) {
			this.resetFn(obj);
		} else if (obj.reset) {
			obj.reset();
		}
		
		return obj;
	}

	/**
	 * Return an object to the pool
	 */
	release(obj: T) {
		if (!obj || !obj.isActive) return;
		
		obj.isActive = false;
		
		if (this.pool.length < this.maxSize) {
			this.pool.push(obj);
		} else {
			// Pool is full, destroy the object
			obj.destroy();
		}
	}

	/**
	 * Clear the entire pool
	 */
	clear() {
		this.pool.forEach(obj => obj.destroy());
		this.pool = [];
	}

	/**
	 * Get pool statistics
	 */
	getStats() {
		return {
			poolSize: this.pool.length,
			maxSize: this.maxSize,
			utilization: (this.maxSize - this.pool.length) / this.maxSize
		};
	}
}

export class OptimizationManager {
	private game: Game;
	private config: OptimizationConfig;
	private objectPools: Map<string, ObjectPool<any>> = new Map();
	private culledObjects: Set<Phaser.GameObjects.GameObject> = new Set();
	private batchGroups: Map<string, Phaser.GameObjects.Group> = new Map();
	private lastOptimizationTime = 0;
	private optimizationInterval = 1000; // Run optimizations every second

	constructor(game: Game, config?: Partial<OptimizationConfig>) {
		this.game = game;
		this.config = {
			enableObjectPooling: true,
			enableBatchRendering: true,
			enableSpriteAtlasing: true,
			enableCulling: true,
			maxConcurrentAnimations: 10,
			maxConcurrentTweens: 20,
			targetFPS: 60,
			memoryThreshold: 80,
			...config
		};

		this.initializeOptimizations();
	}

	/**
	 * Initialize optimization systems
	 */
	private initializeOptimizations() {
		if (this.config.enableObjectPooling) {
			this.initializeObjectPools();
		}

		if (this.config.enableBatchRendering) {
			this.initializeBatchRendering();
		}

		console.log('[OptimizationManager] Optimization systems initialized');
	}

	/**
	 * Initialize object pools for commonly used objects
	 */
	private initializeObjectPools() {
		// Pool for damage text objects
		this.objectPools.set('damageText', new ObjectPool(() => {
			if (!this.game.currentScene) return null;
			
			const text = this.game.currentScene.add.text(0, 0, '', {
				fontSize: '16px',
				color: '#ff0000'
			});
			
			return {
				text,
				isActive: false,
				reset: () => {
					text.setVisible(true);
					text.setAlpha(1);
					text.setText('');
				},
				destroy: () => {
					text.destroy();
				}
			};
		}, 20));

		// Pool for effect sprites
		this.objectPools.set('effectSprite', new ObjectPool(() => {
			if (!this.game.currentScene) return null;
			
			const sprite = this.game.currentScene.add.sprite(0, 0, 'effect');
			
			return {
				sprite,
				isActive: false,
				reset: () => {
					sprite.setVisible(true);
					sprite.setAlpha(1);
					sprite.setScale(1);
					sprite.setRotation(0);
				},
				destroy: () => {
					sprite.destroy();
				}
			};
		}, 30));

		// Pool for particle emitters
		this.objectPools.set('particles', new ObjectPool(() => {
			if (!this.game.currentScene) return null;
			
			const particles = this.game.currentScene.add.particles(0, 0, 'particle', {
				speed: { min: 50, max: 100 },
				scale: { start: 0.5, end: 0 },
				lifespan: 600
			});
			
			return {
				particles,
				isActive: false,
				reset: () => {
					particles.setVisible(true);
					particles.start();
				},
				destroy: () => {
					particles.destroy();
				}
			};
		}, 10));

		console.log('[OptimizationManager] Object pools initialized');
	}

	/**
	 * Initialize batch rendering groups
	 */
	private initializeBatchRendering() {
		if (!this.game.currentScene) return;

		// Create batch groups for similar objects
		const creatureGroup = this.game.currentScene.add.group();
		const effectGroup = this.game.currentScene.add.group();
		const uiGroup = this.game.currentScene.add.group();

		this.batchGroups.set('creatures', creatureGroup);
		this.batchGroups.set('effects', effectGroup);
		this.batchGroups.set('ui', uiGroup);

		console.log('[OptimizationManager] Batch rendering groups initialized');
	}

	/**
	 * Get an object from a pool
	 */
	getPooledObject<T extends PooledObject>(poolName: string): T | null {
		const pool = this.objectPools.get(poolName);
		return pool ? pool.acquire() : null;
	}

	/**
	 * Return an object to a pool
	 */
	releasePooledObject(poolName: string, obj: PooledObject) {
		const pool = this.objectPools.get(poolName);
		if (pool) {
			pool.release(obj);
		}
	}

	/**
	 * Add object to batch group for optimized rendering
	 */
	addToBatchGroup(groupName: string, object: Phaser.GameObjects.GameObject) {
		const group = this.batchGroups.get(groupName);
		if (group) {
			group.add(object);
		}
	}

	/**
	 * Remove object from batch group
	 */
	removeFromBatchGroup(groupName: string, object: Phaser.GameObjects.GameObject) {
		const group = this.batchGroups.get(groupName);
		if (group) {
			group.remove(object);
		}
	}

	/**
	 * Perform frustum culling to hide off-screen objects
	 */
	performCulling() {
		if (!this.config.enableCulling || !this.game.currentScene) return;

		const camera = this.game.currentScene.cameras.main;
		const worldView = camera.worldView;

		// Cull creatures that are off-screen
		this.game.creatureManager.creatures.forEach(creature => {
			if (!creature || !creature.creatureSprite || !creature.creatureSprite.sprite) return;

			const sprite = creature.creatureSprite.sprite;
			const bounds = sprite.getBounds();

			const isVisible = Phaser.Geom.Rectangle.Overlaps(worldView, bounds);

			if (isVisible && this.culledObjects.has(sprite)) {
				// Object is now visible, remove from culled set
				this.culledObjects.delete(sprite);
				sprite.setVisible(true);
			} else if (!isVisible && !this.culledObjects.has(sprite)) {
				// Object is now off-screen, add to culled set
				this.culledObjects.add(sprite);
				sprite.setVisible(false);
			}
		});
	}

	/**
	 * Optimize animation performance
	 */
	optimizeAnimations() {
		if (!this.game.animations) return;

		const activeCount = this.game.animations.getActiveAnimationCount();
		
		if (activeCount > this.config.maxConcurrentAnimations) {
			console.warn(`[OptimizationManager] Too many concurrent animations: ${activeCount}`);
			
			// Skip some animations to maintain performance
			this.game.animations.skipCurrentAnimations();
		}
	}

	/**
	 * Optimize tween performance
	 */
	optimizeTweens() {
		if (!this.game.currentScene || !this.game.currentScene.tweens) return;

		const activeTweens = this.game.currentScene.tweens.getTweens();
		
		if (activeTweens.length > this.config.maxConcurrentTweens) {
			console.warn(`[OptimizationManager] Too many concurrent tweens: ${activeTweens.length}`);
			
			// Remove oldest tweens that are not critical
			const tweensToRemove = activeTweens
				.slice(0, activeTweens.length - this.config.maxConcurrentTweens)
				.filter(tween => !(tween as any).data || !(tween as any).data.critical);
			
			tweensToRemove.forEach(tween => {
				tween.complete();
			});
		}
	}

	/**
	 * Optimize texture memory usage
	 */
	optimizeTextures() {
		if (!this.game.currentScene) return;

		const textureManager = this.game.currentScene.textures;
		
		// Remove unused textures
		const usedTextures = new Set<string>();
		
		// Collect used textures from active game objects
		this.game.currentScene.children.list.forEach(child => {
			if (child.type === 'Sprite' || child.type === 'Image') {
				const gameObject = child as Phaser.GameObjects.Sprite;
				if (gameObject.texture) {
					usedTextures.add(gameObject.texture.key);
				}
			}
		});

		// Remove unused textures (be careful not to remove essential textures)
		Object.keys(textureManager.list).forEach((key) => {
			if (!usedTextures.has(key) && !this.isEssentialTexture(key)) {
				textureManager.remove(key);
			}
		});
	}

	/**
	 * Check if a texture is essential and should not be removed
	 */
	private isEssentialTexture(key: string): boolean {
		const essentialTextures = [
			'hex', 'creature', 'ui', 'background', 'grid',
			'__DEFAULT', '__MISSING', '__WHITE'
		];
		
		return essentialTextures.some(essential => key.includes(essential));
	}

	/**
	 * Optimize game object count by cleaning up inactive objects
	 */
	optimizeGameObjects() {
		if (!this.game.currentScene) return;

		const objectsToDestroy: Phaser.GameObjects.GameObject[] = [];

		this.game.currentScene.children.list.forEach(child => {
			// Mark invisible, inactive objects for destruction
			if (!(child as any).visible && !(child as any).active && this.canDestroyObject(child)) {
				objectsToDestroy.push(child);
			}
		});

		objectsToDestroy.forEach(obj => {
			obj.destroy();
		});

		if (objectsToDestroy.length > 0) {
			console.log(`[OptimizationManager] Cleaned up ${objectsToDestroy.length} inactive objects`);
		}
	}

	/**
	 * Check if an object can be safely destroyed
	 */
	private canDestroyObject(obj: Phaser.GameObjects.GameObject): boolean {
		// Don't destroy essential game objects
		if (obj.name && obj.name.includes('essential')) return false;
		if (obj.getData && obj.getData('persistent')) return false;
		
		// Don't destroy objects that are part of the UI or grid
		if (obj.parentContainer && (
			obj.parentContainer.name === 'ui' || 
			obj.parentContainer.name === 'grid'
		)) return false;
		
		return true;
	}

	/**
	 * Run all optimization routines
	 */
	optimize() {
		const now = performance.now();
		
		if (now - this.lastOptimizationTime < this.optimizationInterval) {
			return; // Don't optimize too frequently
		}

		this.lastOptimizationTime = now;

		try {
			if (this.config.enableCulling) {
				this.performCulling();
			}

			this.optimizeAnimations();
			this.optimizeTweens();
			this.optimizeTextures();
			this.optimizeGameObjects();

			// Force garbage collection if available (development only)
			if (typeof (window as any).gc === 'function' && process.env.NODE_ENV === 'development') {
				(window as any).gc();
			}

		} catch (error) {
			console.error('[OptimizationManager] Error during optimization:', error);
		}
	}

	/**
	 * Enable/disable specific optimizations
	 */
	setOptimization(optimization: keyof OptimizationConfig, enabled: boolean) {
		this.config[optimization] = enabled as any;
		console.log(`[OptimizationManager] ${optimization} ${enabled ? 'enabled' : 'disabled'}`);
	}

	/**
	 * Get optimization statistics
	 */
	getOptimizationStats() {
		const poolStats = {};
		this.objectPools.forEach((pool, name) => {
			poolStats[name] = pool.getStats();
		});

		const batchStats = {};
		this.batchGroups.forEach((group, name) => {
			batchStats[name] = {
				objectCount: group.children.size,
				active: group.active
			};
		});

		return {
			config: this.config,
			pools: poolStats,
			batches: batchStats,
			culledObjects: this.culledObjects.size,
			lastOptimization: this.lastOptimizationTime
		};
	}

	/**
	 * Apply emergency optimizations when performance is critical
	 */
	applyEmergencyOptimizations() {
		console.warn('[OptimizationManager] Applying emergency optimizations');

		// Reduce animation quality
		if (this.game.animations) {
			this.game.animations.skipCurrentAnimations();
		}

		// Reduce concurrent tweens aggressively
		if (this.game.currentScene && this.game.currentScene.tweens) {
			const tweens = this.game.currentScene.tweens.getTweens();
			tweens.slice(0, Math.floor(tweens.length / 2)).forEach(tween => {
				tween.complete();
			});
		}

		// Increase culling aggressiveness
		this.performCulling();

		// Clean up all non-essential objects
		this.optimizeGameObjects();

		// Clear object pools to free memory
		this.objectPools.forEach(pool => {
			const stats = pool.getStats();
			if (stats.utilization < 0.5) {
				pool.clear();
			}
		});
	}

	/**
	 * Reset all optimizations to default state
	 */
	reset() {
		// Clear all pools
		this.objectPools.forEach(pool => pool.clear());
		this.objectPools.clear();

		// Clear batch groups
		this.batchGroups.forEach(group => group.clear());
		this.batchGroups.clear();

		// Clear culled objects
		this.culledObjects.clear();

		// Reinitialize
		this.initializeOptimizations();

		console.log('[OptimizationManager] Optimizations reset');
	}

	/**
	 * Destroy the optimization manager
	 */
	destroy() {
		this.reset();
		console.log('[OptimizationManager] Optimization manager destroyed');
	}
}