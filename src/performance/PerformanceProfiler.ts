/**
 * Performance Profiler for MythosTactica
 * Provides comprehensive performance monitoring and optimization for Phaser 3 migration
 */

import Game from '../game';

export interface PerformanceMetrics {
	fps: number;
	frameTime: number;
	memoryUsage: {
		used: number;
		total: number;
		percentage: number;
	};
	renderTime: number;
	updateTime: number;
	animationCount: number;
	spriteCount: number;
	tweenCount: number;
	audioChannels: number;
	gameObjectCount: number;
	textureMemory: number;
}

export interface PerformanceReport {
	timestamp: number;
	metrics: PerformanceMetrics;
	bottlenecks: string[];
	recommendations: string[];
	score: number; // 0-100 performance score
}

export class PerformanceProfiler {
	private game: Game;
	private isEnabled: boolean = false;
	private metrics: PerformanceMetrics[] = [];
	private maxMetricsHistory = 60; // Keep 60 frames of history
	private lastFrameTime = 0;
	private frameCount = 0;
	private updateTimeStart = 0;
	private renderTimeStart = 0;
	private performanceObserver?: PerformanceObserver;

	constructor(game: Game) {
		this.game = game;
		this.initializePerformanceObserver();
	}

	/**
	 * Initialize performance observer for detailed metrics
	 */
	private initializePerformanceObserver() {
		if (typeof PerformanceObserver !== 'undefined') {
			try {
				this.performanceObserver = new PerformanceObserver((list) => {
					const entries = list.getEntries();
					// Process performance entries if needed
				});
				this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
			} catch (error) {
				console.warn('[PerformanceProfiler] PerformanceObserver not available:', error);
			}
		}
	}

	/**
	 * Start performance profiling
	 */
	start() {
		this.isEnabled = true;
		this.frameCount = 0;
		this.lastFrameTime = performance.now();
		console.log('[PerformanceProfiler] Performance profiling started');
	}

	/**
	 * Stop performance profiling
	 */
	stop() {
		this.isEnabled = false;
		if (this.performanceObserver) {
			this.performanceObserver.disconnect();
		}
		console.log('[PerformanceProfiler] Performance profiling stopped');
	}

	/**
	 * Mark the start of update cycle
	 */
	markUpdateStart() {
		if (!this.isEnabled) return;
		this.updateTimeStart = performance.now();
	}

	/**
	 * Mark the end of update cycle
	 */
	markUpdateEnd() {
		if (!this.isEnabled) return;
		// Update time is calculated in collectMetrics
	}

	/**
	 * Mark the start of render cycle
	 */
	markRenderStart() {
		if (!this.isEnabled) return;
		this.renderTimeStart = performance.now();
	}

	/**
	 * Mark the end of render cycle
	 */
	markRenderEnd() {
		if (!this.isEnabled) return;
		// Render time is calculated in collectMetrics
	}

	/**
	 * Collect current performance metrics
	 */
	collectMetrics(): PerformanceMetrics {
		const now = performance.now();
		const frameTime = now - this.lastFrameTime;
		this.lastFrameTime = now;
		this.frameCount++;

		// Calculate FPS
		const fps = frameTime > 0 ? 1000 / frameTime : 0;

		// Get memory usage (if available)
		let memoryUsage = { used: 0, total: 0, percentage: 0 };
		if ('memory' in performance) {
			const memory = (performance as any).memory;
			memoryUsage = {
				used: memory.usedJSHeapSize,
				total: memory.totalJSHeapSize,
				percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
			};
		}

		// Calculate timing metrics
		const updateTime = this.updateTimeStart > 0 ? now - this.updateTimeStart : 0;
		const renderTime = this.renderTimeStart > 0 ? now - this.renderTimeStart : 0;

		// Get game-specific metrics
		const animationCount = this.game.animations ? this.game.animations.getActiveAnimationCount() : 0;
		const spriteCount = this.getSpriteCount();
		const tweenCount = this.getTweenCount();
		const audioChannels = this.getAudioChannelCount();
		const gameObjectCount = this.getGameObjectCount();
		const textureMemory = this.getTextureMemoryUsage();

		const metrics: PerformanceMetrics = {
			fps,
			frameTime,
			memoryUsage,
			renderTime,
			updateTime,
			animationCount,
			spriteCount,
			tweenCount,
			audioChannels,
			gameObjectCount,
			textureMemory
		};

		// Store metrics history
		this.metrics.push(metrics);
		if (this.metrics.length > this.maxMetricsHistory) {
			this.metrics.shift();
		}

		return metrics;
	}

	/**
	 * Get current sprite count
	 */
	private getSpriteCount(): number {
		if (!this.game.currentScene) return 0;
		
		let count = 0;
		this.game.currentScene.children.list.forEach(child => {
			if (child.type === 'Sprite' || child.type === 'Image') {
				count++;
			}
		});
		return count;
	}

	/**
	 * Get current tween count
	 */
	private getTweenCount(): number {
		if (!this.game.currentScene || !this.game.currentScene.tweens) return 0;
		return this.game.currentScene.tweens.getTweens().length;
	}

	/**
	 * Get audio channel count
	 */
	private getAudioChannelCount(): number {
		if (!this.game.soundsys) return 0;
		// This would need to be implemented in the sound system
		return 0;
	}

	/**
	 * Get total game object count
	 */
	private getGameObjectCount(): number {
		if (!this.game.currentScene) return 0;
		return this.game.currentScene.children.length;
	}

	/**
	 * Estimate texture memory usage
	 */
	private getTextureMemoryUsage(): number {
		if (!this.game.currentScene) return 0;
		
		let totalMemory = 0;
		const textures = this.game.currentScene.textures;
		
		// Rough estimation based on texture dimensions
		Object.keys(textures.list).forEach((key) => {
			const texture = textures.list[key];
			if (texture.source && texture.source[0]) {
				const source = texture.source[0];
				const bytes = source.width * source.height * 4; // RGBA
				totalMemory += bytes;
			}
		});
		
		return totalMemory;
	}

	/**
	 * Generate performance report with analysis
	 */
	generateReport(): PerformanceReport {
		if (this.metrics.length === 0) {
			return {
				timestamp: Date.now(),
				metrics: this.collectMetrics(),
				bottlenecks: ['No metrics collected yet'],
				recommendations: ['Start profiling to collect metrics'],
				score: 0
			};
		}

		const currentMetrics = this.metrics[this.metrics.length - 1];
		const avgMetrics = this.calculateAverageMetrics();
		const bottlenecks = this.identifyBottlenecks(currentMetrics, avgMetrics);
		const recommendations = this.generateRecommendations(bottlenecks, currentMetrics);
		const score = this.calculatePerformanceScore(currentMetrics);

		return {
			timestamp: Date.now(),
			metrics: currentMetrics,
			bottlenecks,
			recommendations,
			score
		};
	}

	/**
	 * Calculate average metrics over history
	 */
	private calculateAverageMetrics(): PerformanceMetrics {
		if (this.metrics.length === 0) {
			return this.collectMetrics();
		}

		const sums = this.metrics.reduce((acc, metrics) => ({
			fps: acc.fps + metrics.fps,
			frameTime: acc.frameTime + metrics.frameTime,
			memoryUsage: {
				used: acc.memoryUsage.used + metrics.memoryUsage.used,
				total: acc.memoryUsage.total + metrics.memoryUsage.total,
				percentage: acc.memoryUsage.percentage + metrics.memoryUsage.percentage
			},
			renderTime: acc.renderTime + metrics.renderTime,
			updateTime: acc.updateTime + metrics.updateTime,
			animationCount: acc.animationCount + metrics.animationCount,
			spriteCount: acc.spriteCount + metrics.spriteCount,
			tweenCount: acc.tweenCount + metrics.tweenCount,
			audioChannels: acc.audioChannels + metrics.audioChannels,
			gameObjectCount: acc.gameObjectCount + metrics.gameObjectCount,
			textureMemory: acc.textureMemory + metrics.textureMemory
		}), {
			fps: 0, frameTime: 0, memoryUsage: { used: 0, total: 0, percentage: 0 },
			renderTime: 0, updateTime: 0, animationCount: 0, spriteCount: 0,
			tweenCount: 0, audioChannels: 0, gameObjectCount: 0, textureMemory: 0
		});

		const count = this.metrics.length;
		return {
			fps: sums.fps / count,
			frameTime: sums.frameTime / count,
			memoryUsage: {
				used: sums.memoryUsage.used / count,
				total: sums.memoryUsage.total / count,
				percentage: sums.memoryUsage.percentage / count
			},
			renderTime: sums.renderTime / count,
			updateTime: sums.updateTime / count,
			animationCount: sums.animationCount / count,
			spriteCount: sums.spriteCount / count,
			tweenCount: sums.tweenCount / count,
			audioChannels: sums.audioChannels / count,
			gameObjectCount: sums.gameObjectCount / count,
			textureMemory: sums.textureMemory / count
		};
	}

	/**
	 * Identify performance bottlenecks
	 */
	private identifyBottlenecks(current: PerformanceMetrics, average: PerformanceMetrics): string[] {
		const bottlenecks: string[] = [];

		// FPS bottlenecks
		if (current.fps < 30) {
			bottlenecks.push('Critical: FPS below 30');
		} else if (current.fps < 50) {
			bottlenecks.push('Warning: FPS below 50');
		}

		// Frame time bottlenecks
		if (current.frameTime > 33.33) { // 30 FPS threshold
			bottlenecks.push('High frame time detected');
		}

		// Memory bottlenecks
		if (current.memoryUsage.percentage > 80) {
			bottlenecks.push('Critical: Memory usage above 80%');
		} else if (current.memoryUsage.percentage > 60) {
			bottlenecks.push('Warning: Memory usage above 60%');
		}

		// Render time bottlenecks
		if (current.renderTime > 16) { // More than 16ms for 60fps
			bottlenecks.push('High render time detected');
		}

		// Update time bottlenecks
		if (current.updateTime > 10) {
			bottlenecks.push('High update time detected');
		}

		// Animation bottlenecks
		if (current.animationCount > 20) {
			bottlenecks.push('High animation count');
		}

		// Sprite bottlenecks
		if (current.spriteCount > 100) {
			bottlenecks.push('High sprite count');
		}

		// Tween bottlenecks
		if (current.tweenCount > 50) {
			bottlenecks.push('High tween count');
		}

		// Game object bottlenecks
		if (current.gameObjectCount > 200) {
			bottlenecks.push('High game object count');
		}

		// Texture memory bottlenecks
		if (current.textureMemory > 100 * 1024 * 1024) { // 100MB
			bottlenecks.push('High texture memory usage');
		}

		return bottlenecks;
	}

	/**
	 * Generate optimization recommendations
	 */
	private generateRecommendations(bottlenecks: string[], metrics: PerformanceMetrics): string[] {
		const recommendations: string[] = [];

		bottlenecks.forEach(bottleneck => {
			switch (true) {
				case bottleneck.includes('FPS'):
					recommendations.push('Enable object pooling for frequently created/destroyed objects');
					recommendations.push('Reduce sprite count by using sprite atlases');
					recommendations.push('Optimize animation frame rates');
					break;

				case bottleneck.includes('Memory'):
					recommendations.push('Implement texture compression');
					recommendations.push('Clean up unused game objects');
					recommendations.push('Use object pooling to reduce garbage collection');
					break;

				case bottleneck.includes('render time'):
					recommendations.push('Enable batch rendering for similar sprites');
					recommendations.push('Reduce draw calls by using sprite sheets');
					recommendations.push('Cull off-screen objects');
					break;

				case bottleneck.includes('update time'):
					recommendations.push('Optimize game logic in update loops');
					recommendations.push('Reduce frequency of expensive calculations');
					recommendations.push('Use spatial partitioning for collision detection');
					break;

				case bottleneck.includes('animation'):
					recommendations.push('Limit concurrent animations');
					recommendations.push('Use simpler easing functions');
					recommendations.push('Pool animation objects');
					break;

				case bottleneck.includes('sprite'):
					recommendations.push('Use sprite atlases to reduce texture switches');
					recommendations.push('Implement sprite culling');
					recommendations.push('Consider using particle systems for effects');
					break;

				case bottleneck.includes('tween'):
					recommendations.push('Limit concurrent tweens');
					recommendations.push('Clean up completed tweens promptly');
					recommendations.push('Use timeline-based animations where possible');
					break;

				case bottleneck.includes('texture'):
					recommendations.push('Compress textures using appropriate formats');
					recommendations.push('Use mipmaps for scaled textures');
					recommendations.push('Implement texture streaming');
					break;
			}
		});

		// Remove duplicates
		return [...new Set(recommendations)];
	}

	/**
	 * Calculate overall performance score (0-100)
	 */
	private calculatePerformanceScore(metrics: PerformanceMetrics): number {
		let score = 100;

		// FPS score (40% weight)
		const fpsScore = Math.min(metrics.fps / 60, 1) * 40;
		score = fpsScore;

		// Memory score (20% weight)
		const memoryScore = Math.max(0, (100 - metrics.memoryUsage.percentage) / 100) * 20;
		score += memoryScore;

		// Frame time score (20% weight)
		const frameTimeScore = Math.max(0, (33.33 - metrics.frameTime) / 33.33) * 20;
		score += frameTimeScore;

		// Render time score (10% weight)
		const renderTimeScore = Math.max(0, (16 - metrics.renderTime) / 16) * 10;
		score += renderTimeScore;

		// Update time score (10% weight)
		const updateTimeScore = Math.max(0, (10 - metrics.updateTime) / 10) * 10;
		score += updateTimeScore;

		return Math.max(0, Math.min(100, score));
	}

	/**
	 * Get performance metrics history
	 */
	getMetricsHistory(): PerformanceMetrics[] {
		return [...this.metrics];
	}

	/**
	 * Clear metrics history
	 */
	clearHistory() {
		this.metrics = [];
		this.frameCount = 0;
	}

	/**
	 * Export performance data for analysis
	 */
	exportData(): string {
		const report = this.generateReport();
		const data = {
			report,
			history: this.metrics,
			timestamp: Date.now(),
			gameVersion: '0.5.0',
			userAgent: navigator.userAgent
		};
		return JSON.stringify(data, null, 2);
	}

	/**
	 * Check if performance is acceptable for gameplay
	 */
	isPerformanceAcceptable(): boolean {
		const report = this.generateReport();
		return report.score >= 60 && report.metrics.fps >= 30;
	}

	/**
	 * Get real-time performance status
	 */
	getPerformanceStatus(): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
		const score = this.calculatePerformanceScore(this.collectMetrics());
		
		if (score >= 90) return 'excellent';
		if (score >= 75) return 'good';
		if (score >= 60) return 'fair';
		if (score >= 40) return 'poor';
		return 'critical';
	}
}