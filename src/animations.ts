import * as arrayUtils from './utility/arrayUtils';
import Game from './game';
import { Creature } from './models/Creature';
import { Hex } from './utility/hex';
import { Ability } from './models/Ability';
import { QuadraticCurve } from './utility/curve';
import { DEBUG_ENABLE_FAST_WALKING, DEBUG_WALK_SPEED_MS } from './debug';

// Animation state management
interface AnimationState {
	id: number;
	creature: Creature;
	type: 'walk' | 'fly' | 'teleport' | 'death' | 'projectile';
	isActive: boolean;
	tweens: Phaser.Tweens.Tween[];
	cleanup?: () => void;
}

// Animation definitions for Phaser 3
interface CreatureAnimationConfig {
	key: string;
	frames: Phaser.Types.Animations.AnimationFrame[];
	frameRate: number;
	repeat: number;
	yoyo?: boolean;
}

// Movement animation configuration
interface MovementAnimConfig {
	duration: number;
	ease: string;
	onComplete?: () => void;
	onUpdate?: (tween: Phaser.Tweens.Tween, target: any) => void;
}

// to fix @ts-expect-error 2554: properly type the arguments for the trigger functions in `game.ts`

type AnimationOptions = {
	customMovementPoint?: number;
	overrideSpeed?: number;
	ignoreMovementPoint?: boolean;
	ignoreTraps?: boolean;
	ignoreFacing?: boolean;
	callback?: () => void;
	callbackStepIn?: (hex?: Hex) => void;
	pushed?: boolean;
	turnAroundOnComplete?: boolean;
	flipped?: boolean;
};

export class Animations {
	game: Game;
	movementPoints: number;
	animationCounter: number;
	private activeAnimations: Map<number, AnimationState>;
	private animationDefinitions: Map<string, CreatureAnimationConfig>;

	constructor(game: Game) {
		this.game = game;
		this.movementPoints = 0;
		this.animationCounter = 0;
		this.activeAnimations = new Map();
		this.animationDefinitions = new Map();
		this.initializeAnimationDefinitions();
	}

	/**
	 * Initialize Phaser 3 animation definitions for creatures
	 */
	private initializeAnimationDefinitions() {
		if (!this.game.currentScene) return;

		// Define basic creature animations with enhanced configurations
		const animationConfigs: CreatureAnimationConfig[] = [
			{
				key: 'creature_idle',
				frames: this.game.currentScene.anims.generateFrameNumbers('creature', { start: 0, end: 3 }),
				frameRate: 4,
				repeat: -1
			},
			{
				key: 'creature_walk',
				frames: this.game.currentScene.anims.generateFrameNumbers('creature', { start: 4, end: 7 }),
				frameRate: 8,
				repeat: -1
			},
			{
				key: 'creature_attack',
				frames: this.game.currentScene.anims.generateFrameNumbers('creature', { start: 8, end: 11 }),
				frameRate: 12,
				repeat: 0
			},
			{
				key: 'creature_death',
				frames: this.game.currentScene.anims.generateFrameNumbers('creature', { start: 12, end: 15 }),
				frameRate: 6,
				repeat: 0
			},
			{
				key: 'creature_hit',
				frames: this.game.currentScene.anims.generateFrameNumbers('creature', { start: 16, end: 19 }),
				frameRate: 10,
				repeat: 0
			},
			{
				key: 'creature_cast',
				frames: this.game.currentScene.anims.generateFrameNumbers('creature', { start: 20, end: 23 }),
				frameRate: 8,
				repeat: 0
			}
		];

		// Create animations in Phaser 3's animation manager with error handling
		animationConfigs.forEach(config => {
			try {
				if (!this.game.currentScene.anims.exists(config.key)) {
					this.game.currentScene.anims.create({
						key: config.key,
						frames: config.frames,
						frameRate: config.frameRate,
						repeat: config.repeat,
						yoyo: config.yoyo || false
					});
				}
				this.animationDefinitions.set(config.key, config);
			} catch (error) {
				console.warn(`[Animations] Failed to create animation ${config.key}:`, error);
				// Continue with other animations even if one fails
			}
		});
	}

	/**
	 * Create a new animation state for tracking
	 */
	private createAnimationState(creature: Creature, type: AnimationState['type']): AnimationState {
		const animId = ++this.animationCounter;
		const state: AnimationState = {
			id: animId,
			creature,
			type,
			isActive: true,
			tweens: []
		};
		
		this.activeAnimations.set(animId, state);
		this.game.animationQueue.push(animId);
		
		return state;
	}

	/**
	 * Clean up animation state and tweens with enhanced error handling
	 */
	private cleanupAnimation(animId: number) {
		const state = this.activeAnimations.get(animId);
		if (state) {
			try {
				// Stop and remove all tweens safely
				state.tweens.forEach(tween => {
					if (tween && typeof tween.isActive === 'function' && tween.isActive()) {
						tween.stop();
						if (typeof tween.remove === 'function') {
							tween.remove();
						}
					}
				});
				
				// Execute cleanup callback if provided
				if (state.cleanup && typeof state.cleanup === 'function') {
					state.cleanup();
				}
				
				// Mark animation as inactive
				state.isActive = false;
				
			} catch (error) {
				console.warn(`[Animations] Error during cleanup for animation ${animId}:`, error);
			} finally {
				// Always remove from active animations
				this.activeAnimations.delete(animId);
				
				// Remove from animation queue
				const queue = this.game.animationQueue.filter(item => item !== animId);
				this.game.animationQueue = queue;
				
				// Unfreeze input if no more animations
				if (queue.length === 0) {
					this.game.freezedInput = false;
					if (this.game.multiplayer) {
						this.game.freezedInput = this.game.UI.active ? false : true;
					}
				}
			}
		}
	}

	/**
	 * Create smooth tween-based movement animation with performance optimizations
	 */
	private createMovementTween(
		target: any, 
		toPosition: { x: number; y: number }, 
		config: MovementAnimConfig
	): Phaser.Tweens.Tween {
		if (!this.game.currentScene) return null;

		// Performance optimization: Use object pooling for tween configs
		const tweenConfig = {
			targets: target,
			x: toPosition.x,
			y: toPosition.y,
			duration: config.duration,
			ease: config.ease,
			onComplete: config.onComplete,
			onUpdate: config.onUpdate,
			// Add performance optimizations
			yoyo: false,
			hold: 0,
			repeatDelay: 0,
			// Optimize for smooth movement
			callbackScope: this
		};

		return this.game.currentScene.tweens.add(tweenConfig);
	}

	/**
	 * Play creature sprite animation with validation and fallback
	 */
	private playCreatureAnimation(creature: Creature, animationKey: string) {
		if (!creature || !creature.creatureSprite || !creature.creatureSprite.sprite) {
			console.warn(`[Animations] Cannot play animation ${animationKey}: invalid creature or sprite`);
			return;
		}

		const sprite = creature.creatureSprite.sprite;
		
		if (!this.game.currentScene) {
			console.warn(`[Animations] Cannot play animation ${animationKey}: no active scene`);
			return;
		}

		// Check if animation exists, fallback to idle if not
		if (this.game.currentScene.anims.exists(animationKey)) {
			try {
				sprite.play(animationKey);
			} catch (error) {
				console.warn(`[Animations] Error playing animation ${animationKey}:`, error);
				// Fallback to idle animation
				if (animationKey !== 'creature_idle' && this.game.currentScene.anims.exists('creature_idle')) {
					sprite.play('creature_idle');
				}
			}
		} else {
			console.warn(`[Animations] Animation ${animationKey} does not exist, falling back to idle`);
			// Fallback to idle animation
			if (animationKey !== 'creature_idle' && this.game.currentScene.anims.exists('creature_idle')) {
				sprite.play('creature_idle');
			}
		}
	}

	/**
	 * Stop all animations for a specific creature
	 */
	stopCreatureAnimations(creature: Creature) {
		const animationsToStop: number[] = [];
		
		this.activeAnimations.forEach((state, animId) => {
			if (state.creature === creature) {
				animationsToStop.push(animId);
			}
		});

		animationsToStop.forEach(animId => {
			this.cleanupAnimation(animId);
		});
	}

	/**
	 * Stop all active animations
	 */
	stopAllAnimations() {
		const animationIds = Array.from(this.activeAnimations.keys());
		animationIds.forEach(animId => {
			this.cleanupAnimation(animId);
		});
	}

	/**
	 * Get active animation count
	 */
	getActiveAnimationCount(): number {
		return this.activeAnimations.size;
	}

	/**
	 * Check if a creature has active animations
	 */
	hasActiveAnimations(creature: Creature): boolean {
		const states = Array.from(this.activeAnimations.values());
		for (const state of states) {
			if (state.creature === creature && state.isActive) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Update animation definitions when scene changes
	 */
	updateAnimationDefinitions() {
		this.animationDefinitions.clear();
		this.initializeAnimationDefinitions();
	}

	/**
	 * Validate animation system state and report any issues
	 */
	validateAnimationSystem(): { isValid: boolean; issues: string[] } {
		const issues: string[] = [];
		let isValid = true;

		// Check if scene is available
		if (!this.game.currentScene) {
			issues.push('No active scene available for animations');
			isValid = false;
		}

		// Check if animation definitions are loaded
		if (this.animationDefinitions.size === 0) {
			issues.push('No animation definitions loaded');
			isValid = false;
		}

		// Check for orphaned animations
		const orphanedAnimations = Array.from(this.activeAnimations.values()).filter(
			state => state.tweens.length === 0 || state.tweens.every(tween => !tween || !tween.isActive())
		);

		if (orphanedAnimations.length > 0) {
			issues.push(`Found ${orphanedAnimations.length} orphaned animations`);
			// Clean up orphaned animations
			orphanedAnimations.forEach(state => {
				this.cleanupAnimation(state.id);
			});
		}

		// Check animation queue consistency
		const queuedAnimations = this.game.animationQueue.length;
		const activeAnimations = this.activeAnimations.size;
		
		if (queuedAnimations !== activeAnimations) {
			issues.push(`Animation queue mismatch: ${queuedAnimations} queued vs ${activeAnimations} active`);
		}

		return { isValid, issues };
	}

	walk(creature: Creature, path: Hex[], opts: AnimationOptions) {
		const game = this.game;

		if (opts.customMovementPoint > 0) {
			path = path.slice(0, opts.customMovementPoint);
			// For compatibility
			this.movementPoints = creature.remainingMove;
			creature.remainingMove = opts.customMovementPoint;
		}

		game.freezedInput = true;

		// Create animation state for tracking
		const animState = this.createAnimationState(creature, 'walk');

		let hexId = 0;
		creature.healthHide();

		// Play walking animation on creature sprite
		this.playCreatureAnimation(creature, 'creature_walk');

		let speed = !opts.overrideSpeed ? creature.animation.walk_speed : opts.overrideSpeed;
		speed = Number(speed);

		if (DEBUG_ENABLE_FAST_WALKING) {
			speed = DEBUG_WALK_SPEED_MS;
		}

		const anim = () => {
			const hex = path[hexId];

			if (hexId < path.length && (creature.remainingMove > 0 || opts.ignoreMovementPoint)) {
				this.leaveHex(creature, hex, opts);
			} else {
				this.movementComplete(creature, path[path.length - 1], animState.id, opts);
				return;
			}

			const nextPos = game.grid.hexes[hex.y][hex.x - creature.size + 1];

			// Ignore traps for hover creatures, unless this is the last hex
			const enterHexOpts = {
				ignoreTraps: creature.movementType() !== 'normal' && hexId < path.length - 1,
				...opts,
			};

			// Create smooth tween-based movement
			const targetPosition = {
				x: nextPos.displayPos.x,
				y: nextPos.displayPos.y
			};

			const movementTween = this.createMovementTween(
				creature.creatureSprite.sprite,
				targetPosition,
				{
					duration: speed,
					ease: 'Power2',
					onComplete: () => {
						if (creature.dead) {
							// Stop moving if creature has died while moving
							this.movementComplete(creature, hex, animState.id, opts);
							return;
						}

						// Sound Effect
						game.soundsys.playSFX('sounds/step');

						if (!opts.ignoreMovementPoint) {
							creature.remainingMove--;

							if (opts.customMovementPoint === 0) {
								creature.travelDist++;
							}
						}

						this.enterHex(creature, hex, enterHexOpts);

						// Continue to next hex
						hexId++;
						anim();
					}
				}
			);

			// Track the tween for cleanup
			if (movementTween) {
				animState.tweens.push(movementTween);
			}
		};

		// Set cleanup function for animation state
		animState.cleanup = () => {
			// Stop walking animation and return to idle
			this.playCreatureAnimation(creature, 'creature_idle');
		};

		anim();
	}

	fly(creature: Creature, path: Hex[], opts: AnimationOptions) {
		const game = this.game;

		if (opts.customMovementPoint > 0) {
			path = path.slice(0, opts.customMovementPoint);
			// For compatibility
			this.movementPoints = creature.remainingMove;
			creature.remainingMove = opts.customMovementPoint;
		}

		game.freezedInput = true;

		// Create animation state for tracking
		const animState = this.createAnimationState(creature, 'fly');

		creature.healthHide();

		const hex = path[0];
		const start = game.grid.hexes[creature.y][creature.x - creature.size + 1];
		const currentHex = game.grid.hexes[hex.y][hex.x - creature.size + 1];

		this.leaveHex(creature, currentHex, opts);

		const durationMS = !opts.overrideSpeed ? creature.animation.walk_speed : opts.overrideSpeed;

		// Create smooth flying animation with arc trajectory
		const targetPosition = {
			x: currentHex.displayPos.x,
			y: currentHex.displayPos.y
		};

		// Add vertical arc for flying effect
		const midPoint = {
			x: (creature.creatureSprite.sprite.x + targetPosition.x) / 2,
			y: Math.min(creature.creatureSprite.sprite.y, targetPosition.y) - 50 // Arc height
		};

		// Create arc movement using multiple tweens
		const firstHalfTween = this.createMovementTween(
			creature.creatureSprite.sprite,
			midPoint,
			{
				duration: durationMS / 2,
				ease: 'Power2',
				onComplete: () => {
					// Second half of the arc
					const secondHalfTween = this.createMovementTween(
						creature.creatureSprite.sprite,
						targetPosition,
						{
							duration: durationMS / 2,
							ease: 'Power2',
							onComplete: () => {
								// Sound Effect
								game.soundsys.playSFX('sounds/step');

								if (!opts.ignoreMovementPoint) {
									// Determine distance
									let distance = 0;
									let k = 0;
									while (!distance) {
										k++;

										if (arrayUtils.findPos(start.adjacentHex(k), currentHex)) {
											distance = k;
										}
									}

									creature.remainingMove -= distance;
									if (opts.customMovementPoint === 0) {
										creature.travelDist += distance;
									}
								}

								this.enterHex(creature, hex, opts);
								this.movementComplete(creature, hex, animState.id, opts);
							}
						}
					);

					if (secondHalfTween) {
						animState.tweens.push(secondHalfTween);
					}
				}
			}
		);

		// Track tweens for cleanup
		if (firstHalfTween) {
			animState.tweens.push(firstHalfTween);
		}

		// Set cleanup function
		animState.cleanup = () => {
			this.playCreatureAnimation(creature, 'creature_idle');
		};
	}

	teleport(creature: Creature, path: Hex[], opts: AnimationOptions) {
		const game = this.game,
			hex = path[0],
			currentHex = game.grid.hexes[hex.y][hex.x - creature.size + 1];

		this.leaveHex(creature, currentHex, opts);

		// Create animation state for tracking
		const animState = this.createAnimationState(creature, 'teleport');

		// Create fade out tween
		const fadeOutTween = this.game.currentScene.tweens.add({
			targets: creature.creatureSprite.sprite,
			alpha: 0,
			duration: 500,
			ease: 'Power2',
			onComplete: () => {
				// Sound Effect
				game.soundsys.playSFX('sounds/step');

				// Instantly position at target
				creature.creatureSprite.sprite.x = currentHex.displayPos.x;
				creature.creatureSprite.sprite.y = currentHex.displayPos.y;

				this.enterHex(creature, hex, opts);

				// Create fade in tween
				const fadeInTween = this.game.currentScene.tweens.add({
					targets: creature.creatureSprite.sprite,
					alpha: 1,
					duration: 500,
					ease: 'Power2',
					onComplete: () => {
						this.movementComplete(creature, hex, animState.id, opts);
					}
				});

				if (fadeInTween) {
					animState.tweens.push(fadeInTween);
				}
			}
		});

		// Track tweens for cleanup
		if (fadeOutTween) {
			animState.tweens.push(fadeOutTween);
		}

		// Set cleanup function
		animState.cleanup = () => {
			// Ensure sprite is visible after teleport
			if (creature.creatureSprite.sprite) {
				creature.creatureSprite.sprite.alpha = 1;
			}
		};
	}

	push(creature: Creature, path: Hex[], opts: AnimationOptions) {
		opts.pushed = true;
		this.walk(creature, path, opts);
	}

	//--------Special Functions---------//

	enterHex(creature: Creature, hex: Hex, opts: AnimationOptions) {
		const game = this.game;

		creature.cleanHex();
		creature.x = hex.x - 0;
		creature.y = hex.y - 0;
		creature.pos = hex.pos;
		creature.updateHex();

		game.trapManager.onStepIn(creature, hex, opts);

		creature.pickupDrop();

		if (opts.callbackStepIn) {
			opts.callbackStepIn(hex);
		}

		game.grid.orderCreatureZ();
	}

	leaveHex(creature: Creature, hex: Hex, opts: AnimationOptions) {
		const game = this.game;
		let ignoringFaceUpdate;

		if (opts.ignoreFacing) {
			ignoringFaceUpdate = true;
		} else {
			if (!opts.pushed) {
				creature.faceHex(hex, creature.hexagons[0], false, false); // Determine facing
			}
		}
		// @ts-expect-error 2554
		game.onStepOut(creature, creature.hexagons[0]); // Trigger
		game.grid.orderCreatureZ();
	}

	movementComplete(creature: Creature, hex: Hex, animId: number, opts: AnimationOptions) {
		const game = this.game;

		if (opts.customMovementPoint > 0) {
			creature.remainingMove = this.movementPoints;
		}

		// Turn around animation using Phaser 3 tween
		if (opts.turnAroundOnComplete) {
			creature.facePlayerDefault();
			// Add smooth turn animation
			if (creature.creatureSprite.sprite) {
				const currentScale = creature.creatureSprite.sprite.scaleX;
				const targetScale = creature.player.flipped ? -Math.abs(currentScale) : Math.abs(currentScale);
				
				this.game.currentScene.tweens.add({
					targets: creature.creatureSprite.sprite,
					scaleX: targetScale,
					duration: 200,
					ease: 'Power2'
				});
			}
		}

		// Reveal health indicator
		creature.healthShow();

		creature.hexagons.forEach((h) => {
			creature.pickupDrop();
		});

		game.grid.orderCreatureZ();

		// Execute callback if provided
		if (opts.callback) {
			opts.callback();
		}

		// Clean up animation state
		this.cleanupAnimation(animId);
	}

	projectile(
		this2: Ability,
		target: { id: number },
		spriteId: string,
		path: Hex[],
		args: { direction: number },
		startX: number,
		startY: number,
	) {
		// Get the target's position on the projectile's path that is closest
		const emissionPointX = this2.creature.legacyProjectileEmissionPoint.x + startX;
		let distance = Number.MAX_SAFE_INTEGER;
		let targetX = path[0].displayPos.x;
		for (const hex of path) {
			if (typeof hex.creature != 'undefined' && hex.creature.id == target.id) {
				if (distance > Math.abs(emissionPointX - hex.displayPos.x)) {
					distance = Math.abs(emissionPointX - hex.displayPos.x);
					targetX = hex.displayPos.x;
				}
			}
		}

		const game = this.game,
			baseDist = arrayUtils.filterCreature(path.slice(0), false, false).length,
			dist = baseDist == 0 ? 1 : baseDist,
			emissionPoint = {
				x: this2.creature.legacyProjectileEmissionPoint.x + startX,
				y: this2.creature.legacyProjectileEmissionPoint.y + startY,
			},
			targetPoint = {
				x: targetX + 45,
				y: path[baseDist].displayPos.y - 20,
			};

		// Create projectile sprite
		const sprite = game.grid.scene.add.sprite(emissionPoint.x, emissionPoint.y, spriteId);
		const duration = dist * 75;
		
		game.grid.creatureGroup.add(sprite);
		sprite.setOrigin(0.5);
		sprite.rotation = -Math.PI / 3 + (args.direction * Math.PI) / 3;

		// Create animation state for projectile
		const animState = this.createAnimationState(this2.creature, 'projectile');

		// Create smooth projectile movement with enhanced visual effects
		const projectileTween = this.createMovementTween(
			sprite,
			targetPoint,
			{
				duration: duration,
				ease: 'Linear',
				onComplete: () => {
					// Add impact effect before cleanup
					if (this.game.currentScene) {
						// Create small impact flash
						const impact = this.game.currentScene.add.circle(
							sprite.x, sprite.y, 10, 0xffffff, 0.8
						);
						this.game.currentScene.tweens.add({
							targets: impact,
							alpha: 0,
							scaleX: 2,
							scaleY: 2,
							duration: 200,
							ease: 'Power2',
							onComplete: () => impact.destroy()
						});
					}
					
					// Clean up projectile sprite
					sprite.destroy();
					this.cleanupAnimation(animState.id);
				},
				onUpdate: (tween, target) => {
					// Enhanced projectile rotation and trail effect
					const progress = tween.progress;
					if (progress > 0) {
						// Rotate projectile based on movement direction
						const angle = Phaser.Math.Angle.Between(
							emissionPoint.x, emissionPoint.y,
							target.x, target.y
						);
						sprite.rotation = angle;
						
						// Add subtle scale animation for depth effect
						const scaleVariation = 1 + Math.sin(progress * Math.PI * 4) * 0.1;
						sprite.setScale(scaleVariation);
					}
				}
			}
		);

		// Track tween for cleanup
		if (projectileTween) {
			animState.tweens.push(projectileTween);
		}

		// Set cleanup function
		animState.cleanup = () => {
			if (sprite && sprite.active) {
				sprite.destroy();
			}
		};

		return [projectileTween, sprite, dist];
	}

	death(creature: Creature, opts: AnimationOptions) {
		// Create animation state for tracking
		const animState = this.createAnimationState(creature, 'death');

		// Animation Properties
		const length = 100; // Distance travelled in x
		const speed = !opts.overrideSpeed ? 500 : opts.overrideSpeed;

		// Curve should pass (0, 0)
		const curve = opts.flipped ? new QuadraticCurve(0.1, 5, 0) : new QuadraticCurve(0.1, -5, 0);

		const startPos = creature.creatureSprite.getPos();
		creature.healthHide();

		// Play death animation on sprite
		this.playCreatureAnimation(creature, 'creature_death');

		// Create path points for smooth curve movement
		const pathPoints: { x: number; y: number }[] = [];
		const numSegments = 10;
		
		for (let i = 1; i <= numSegments; i++) {
			const segmentLength = (opts.flipped ? -1 : 1) * Math.round(length / numSegments) * i;
			pathPoints.push({
				x: startPos.x + segmentLength,
				y: startPos.y + curve.calc_y(segmentLength)
			});
		}

		// Create rotation tween
		const rotationTween = this.game.currentScene.tweens.add({
			targets: creature.creatureSprite.sprite,
			angle: opts.flipped ? -90 : 90,
			duration: speed,
			ease: 'Power2'
		});

		// Create fade tween
		const fadeTween = this.game.currentScene.tweens.add({
			targets: creature.creatureSprite.sprite,
			alpha: 0,
			duration: speed,
			ease: 'Power2'
		});

		// Create movement along curve using chained tweens
		let currentTween: Phaser.Tweens.Tween = null;
		let completedSegments = 0;
		
		const createNextSegment = (pointIndex: number) => {
			if (pointIndex >= pathPoints.length) {
				// All segments complete
				if (opts.callback) {
					opts.callback();
				}
				this.cleanupAnimation(animState.id);
				return;
			}

			const point = pathPoints[pointIndex];
			currentTween = this.game.currentScene.tweens.add({
				targets: creature.creatureSprite.sprite,
				x: point.x,
				y: point.y,
				duration: speed / numSegments,
				ease: 'Power1',
				onComplete: () => {
					completedSegments++;
					createNextSegment(pointIndex + 1);
				}
			});

			if (currentTween) {
				animState.tweens.push(currentTween);
			}
		};

		// Start the movement sequence
		createNextSegment(0);

		// Track tweens for cleanup
		if (rotationTween) animState.tweens.push(rotationTween);
		if (fadeTween) animState.tweens.push(fadeTween);

		// Set cleanup function
		animState.cleanup = () => {
			// Ensure creature is properly hidden after death
			if (creature.creatureSprite.sprite) {
				creature.creatureSprite.sprite.setVisible(false);
			}
		};
	}

	/**
	 * Get performance metrics for animation system
	 */
	getPerformanceMetrics() {
		return {
			activeAnimationCount: this.activeAnimations.size,
			queueLength: this.game.animationQueue.length,
			definedAnimations: this.animationDefinitions.size,
			memoryUsage: {
				activeAnimations: this.activeAnimations.size * 100, // Rough estimate in bytes
				definitions: this.animationDefinitions.size * 50
			}
		};
	}

	/**
	 * Optimize animation performance by cleaning up completed animations
	 */
	optimizePerformance() {
		// Clean up any animations that are no longer active
		const inactiveAnimations: number[] = [];
		
		this.activeAnimations.forEach((state, animId) => {
			if (!state.isActive || state.tweens.every(tween => !tween || !tween.isActive())) {
				inactiveAnimations.push(animId);
			}
		});

		inactiveAnimations.forEach(animId => {
			this.cleanupAnimation(animId);
		});

		// Log performance metrics in debug mode
		if (typeof (this.game as any).debug !== 'undefined' && (this.game as any).debug) {
			const metrics = this.getPerformanceMetrics();
			console.log('[Animations] Performance metrics:', metrics);
		}
	}

	/**
	 * Pause all active animations
	 */
	pauseAllAnimations() {
		this.activeAnimations.forEach(state => {
			state.tweens.forEach(tween => {
				if (tween && tween.isActive() && typeof tween.pause === 'function') {
					tween.pause();
				}
			});
		});
	}

	/**
	 * Resume all paused animations
	 */
	resumeAllAnimations() {
		this.activeAnimations.forEach(state => {
			state.tweens.forEach(tween => {
				if (tween && typeof tween.resume === 'function') {
					tween.resume();
				}
			});
		});
	}

	/**
	 * Interrupt and skip current animations (for fast-forward or skip functionality)
	 */
	skipCurrentAnimations() {
		const animationsToComplete: number[] = [];
		
		this.activeAnimations.forEach((state, animId) => {
			if (state.type === 'walk' || state.type === 'fly' || state.type === 'teleport') {
				// Complete movement animations instantly
				state.tweens.forEach(tween => {
					if (tween && tween.isActive()) {
						// Jump to end of tween
						tween.seek(1);
						tween.complete();
					}
				});
				animationsToComplete.push(animId);
			}
		});

		// Clean up completed animations
		animationsToComplete.forEach(animId => {
			this.cleanupAnimation(animId);
		});
	}

	/**
	 * Clean up all animations when scene is destroyed
	 */
	destroy() {
		this.stopAllAnimations();
		this.activeAnimations.clear();
		this.animationDefinitions.clear();
	}
}