/**
 * Main Performance Manager for MythosTactica
 * Coordinates all performance optimization systems
 */

import Game from '../game';
import { PerformanceProfiler, PerformanceReport } from './PerformanceProfiler';
import { OptimizationManager, OptimizationConfig } from './OptimizationManager';
import { SaveLoadCompatibility } from './SaveLoadCompatibility';

export interface PerformanceConfig {
	enableProfiling: boolean;
	enableOptimizations: boolean;
	targetFPS: number;
	memoryThreshold: number;
	autoOptimize: boolean;
	emergencyThreshold: number;
}

export class PerformanceManager {
	private game: Game;
	private profiler: PerformanceProfiler;
	private optimizer: OptimizationManager;
	private saveLoadManager: SaveLoadCompatibility;
	private config: PerformanceConfig;
	private isInitialized = false;
	private performanceCheckInterval?: NodeJS.Timeout;

	constructor(game: Game, config?: Partial<PerformanceConfig>) {
		this.game = game;
		this.config = {
			enableProfiling: true,
			enableOptimizations: true,
			targetFPS: 60,
			memoryThreshold: 80,
			autoOptimize: true,
			emergencyThreshold: 30,
			...config
		};

		this.profiler = new PerformanceProfiler(game);
		this.optimizer = new OptimizationManager(game, {
			targetFPS: this.config.targetFPS,
			memoryThreshold: this.config.memoryThreshold
		});
		this.saveLoadManager = new SaveLoadCompatibility(game);
	}

	/**
	 * Initialize the performance management system
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized) {
			console.warn('[PerformanceManager] Already initialized');
			return;
		}

		console.log('[PerformanceManager] Initializing performance management system');

		try {
			// Start profiling if enabled
			if (this.config.enableProfiling) {
				this.profiler.start();
			}

			// Test save/load compatibility
			const compatibilityTest = await this.saveLoadManager.testCompatibility();
			if (!compatibilityTest.success) {
				console.warn('[PerformanceManager] Save/load compatibility issues:', compatibilityTest.errors);
			}

			// Set up automatic performance monitoring
			if (this.config.autoOptimize) {
				this.startPerformanceMonitoring();
			}

			this.isInitialized = true;
			console.log('[PerformanceManager] Performance management system initialized successfully');

		} catch (error) {
			console.error('[PerformanceManager] Failed to initialize:', error);
			throw error;
		}
	}

	/**
	 * Start automatic performance monitoring
	 */
	private startPerformanceMonitoring(): void {
		// Check performance every 5 seconds
		this.performanceCheckInterval = setInterval(() => {
			this.checkPerformanceAndOptimize();
		}, 5000);
	}

	/**
	 * Stop automatic performance monitoring
	 */
	private stopPerformanceMonitoring(): void {
		if (this.performanceCheckInterval) {
			clearInterval(this.performanceCheckInterval);
			this.performanceCheckInterval = undefined;
		}
	}

	/**
	 * Check performance and apply optimizations if needed
	 */
	private checkPerformanceAndOptimize(): void {
		if (!this.config.enableOptimizations) return;

		const report = this.profiler.generateReport();
		
		// Apply emergency optimizations if performance is critical
		if (report.metrics.fps < this.config.emergencyThreshold) {
			console.warn('[PerformanceManager] Critical performance detected, applying emergency optimizations');
			this.optimizer.applyEmergencyOptimizations();
		}
		// Apply regular optimizations if performance is below target
		else if (report.metrics.fps < this.config.targetFPS * 0.8) {
			console.log('[PerformanceManager] Performance below target, applying optimizations');
			this.optimizer.optimize();
		}

		// Log performance status periodically
		if (Math.random() < 0.1) { // 10% chance to log
			const status = this.profiler.getPerformanceStatus();
			console.log(`[PerformanceManager] Performance status: ${status} (${report.metrics.fps.toFixed(1)} FPS)`);
		}
	}

	/**
	 * Update performance systems (called from game loop)
	 */
	update(): void {
		if (!this.isInitialized) return;

		// Mark update cycle for profiling
		this.profiler.markUpdateStart();
		
		// Collect metrics
		if (this.config.enableProfiling) {
			this.profiler.collectMetrics();
		}

		// Run optimizations periodically
		if (this.config.enableOptimizations) {
			this.optimizer.optimize();
		}

		this.profiler.markUpdateEnd();
	}

	/**
	 * Render performance systems (called from render loop)
	 */
	render(): void {
		if (!this.isInitialized) return;

		this.profiler.markRenderStart();
		// Render-specific optimizations would go here
		this.profiler.markRenderEnd();
	}

	/**
	 * Get current performance report
	 */
	getPerformanceReport(): PerformanceReport {
		return this.profiler.generateReport();
	}

	/**
	 * Get performance status
	 */
	getPerformanceStatus(): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
		return this.profiler.getPerformanceStatus();
	}

	/**
	 * Check if performance is acceptable for gameplay
	 */
	isPerformanceAcceptable(): boolean {
		return this.profiler.isPerformanceAcceptable();
	}

	/**
	 * Enable/disable profiling
	 */
	setProfiling(enabled: boolean): void {
		this.config.enableProfiling = enabled;
		
		if (enabled) {
			this.profiler.start();
		} else {
			this.profiler.stop();
		}
	}

	/**
	 * Enable/disable optimizations
	 */
	setOptimizations(enabled: boolean): void {
		this.config.enableOptimizations = enabled;
		
		if (enabled && this.config.autoOptimize) {
			this.startPerformanceMonitoring();
		} else {
			this.stopPerformanceMonitoring();
		}
	}

	/**
	 * Set target FPS
	 */
	setTargetFPS(fps: number): void {
		this.config.targetFPS = fps;
		// Update target FPS in optimizer config
		(this.optimizer as any).config.targetFPS = fps;
	}

	/**
	 * Apply specific optimization
	 */
	applyOptimization(optimization: string, enabled: boolean): void {
		this.optimizer.setOptimization(optimization as keyof OptimizationConfig, enabled);
	}

	/**
	 * Get optimization statistics
	 */
	getOptimizationStats(): any {
		return this.optimizer.getOptimizationStats();
	}

	/**
	 * Export performance data for analysis
	 */
	exportPerformanceData(): string {
		const report = this.profiler.generateReport();
		const optimizationStats = this.optimizer.getOptimizationStats();
		
		const exportData = {
			timestamp: Date.now(),
			performanceReport: report,
			optimizationStats,
			config: this.config,
			gameVersion: '0.5.0',
			userAgent: navigator.userAgent,
			hardwareConcurrency: navigator.hardwareConcurrency,
			memory: (performance as any).memory ? {
				usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
				totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
				jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
			} : null
		};

		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * Load save file with compatibility handling
	 */
	async loadSaveFile(saveData: string | any): Promise<any> {
		return this.saveLoadManager.loadSaveFile(saveData);
	}

	/**
	 * Create save data in current format
	 */
	createSaveData(): any {
		return this.saveLoadManager.createSaveData();
	}

	/**
	 * Test save/load compatibility
	 */
	async testSaveLoadCompatibility(): Promise<{ success: boolean; errors: string[] }> {
		return this.saveLoadManager.testCompatibility();
	}

	/**
	 * Reset all performance systems
	 */
	reset(): void {
		console.log('[PerformanceManager] Resetting performance systems');
		
		this.profiler.clearHistory();
		this.optimizer.reset();
		
		if (this.config.enableProfiling) {
			this.profiler.start();
		}
	}

	/**
	 * Get performance recommendations
	 */
	getPerformanceRecommendations(): string[] {
		const report = this.profiler.generateReport();
		return report.recommendations;
	}

	/**
	 * Run comprehensive performance test
	 */
	async runPerformanceTest(duration: number = 10000): Promise<{
		averageFPS: number;
		minFPS: number;
		maxFPS: number;
		averageFrameTime: number;
		memoryUsage: any;
		recommendations: string[];
	}> {
		console.log(`[PerformanceManager] Running performance test for ${duration}ms`);
		
		// Clear existing metrics
		this.profiler.clearHistory();
		
		// Start profiling
		const wasProfilingEnabled = this.config.enableProfiling;
		this.setProfiling(true);
		
		// Wait for test duration
		await new Promise(resolve => setTimeout(resolve, duration));
		
		// Collect results
		const metrics = this.profiler.getMetricsHistory();
		const report = this.profiler.generateReport();
		
		// Calculate statistics
		const fpsList = metrics.map(m => m.fps);
		const frameTimeList = metrics.map(m => m.frameTime);
		
		const results = {
			averageFPS: fpsList.reduce((a, b) => a + b, 0) / fpsList.length,
			minFPS: Math.min(...fpsList),
			maxFPS: Math.max(...fpsList),
			averageFrameTime: frameTimeList.reduce((a, b) => a + b, 0) / frameTimeList.length,
			memoryUsage: report.metrics.memoryUsage,
			recommendations: report.recommendations
		};
		
		// Restore original profiling state
		this.setProfiling(wasProfilingEnabled);
		
		console.log('[PerformanceManager] Performance test completed:', results);
		return results;
	}

	/**
	 * Destroy the performance manager
	 */
	destroy(): void {
		console.log('[PerformanceManager] Destroying performance management system');
		
		this.stopPerformanceMonitoring();
		this.profiler.stop();
		this.optimizer.destroy();
		
		this.isInitialized = false;
	}
}