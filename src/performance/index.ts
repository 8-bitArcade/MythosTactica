/**
 * Performance Module Index
 * Exports all performance-related classes and utilities
 */

export { PerformanceProfiler, PerformanceMetrics, PerformanceReport } from './PerformanceProfiler';
export { OptimizationManager, OptimizationConfig, ObjectPool } from './OptimizationManager';
export { SaveLoadCompatibility, SaveFileMetadata, LegacySaveData, ModernSaveData } from './SaveLoadCompatibility';
export { PerformanceManager, PerformanceConfig } from './PerformanceManager';
export { PerformanceTest, PerformanceTestConfig, PerformanceTestResult, ComprehensiveTestReport } from './PerformanceTest';
export { PerformanceMonitor } from './PerformanceMonitor';

// Performance utilities
export const PerformanceUtils = {
	/**
	 * Check if the browser supports performance monitoring
	 */
	isPerformanceSupported(): boolean {
		return typeof performance !== 'undefined' && 
			   typeof performance.now === 'function';
	},

	/**
	 * Check if memory monitoring is supported
	 */
	isMemoryMonitoringSupported(): boolean {
		return 'memory' in performance;
	},

	/**
	 * Get basic system information
	 */
	getSystemInfo() {
		return {
			userAgent: navigator.userAgent,
			hardwareConcurrency: navigator.hardwareConcurrency || 1,
			memory: this.isMemoryMonitoringSupported() ? {
				jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
				totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
				usedJSHeapSize: (performance as any).memory.usedJSHeapSize
			} : null,
			platform: navigator.platform,
			language: navigator.language,
			cookieEnabled: navigator.cookieEnabled,
			onLine: navigator.onLine
		};
	},

	/**
	 * Format bytes to human readable format
	 */
	formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	},

	/**
	 * Calculate FPS from frame time
	 */
	calculateFPS(frameTime: number): number {
		return frameTime > 0 ? 1000 / frameTime : 0;
	},

	/**
	 * Get performance grade based on FPS
	 */
	getPerformanceGrade(fps: number): 'A' | 'B' | 'C' | 'D' | 'F' {
		if (fps >= 55) return 'A';
		if (fps >= 45) return 'B';
		if (fps >= 30) return 'C';
		if (fps >= 20) return 'D';
		return 'F';
	},

	/**
	 * Debounce function for performance optimization
	 */
	debounce<T extends (...args: any[]) => any>(
		func: T,
		wait: number
	): (...args: Parameters<T>) => void {
		let timeout: NodeJS.Timeout;
		return (...args: Parameters<T>) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => func.apply(this, args), wait);
		};
	},

	/**
	 * Throttle function for performance optimization
	 */
	throttle<T extends (...args: any[]) => any>(
		func: T,
		limit: number
	): (...args: Parameters<T>) => void {
		let inThrottle: boolean;
		return (...args: Parameters<T>) => {
			if (!inThrottle) {
				func.apply(this, args);
				inThrottle = true;
				setTimeout(() => inThrottle = false, limit);
			}
		};
	}
};

// Performance constants
export const PerformanceConstants = {
	TARGET_FPS: 60,
	MIN_ACCEPTABLE_FPS: 30,
	CRITICAL_FPS_THRESHOLD: 20,
	MAX_FRAME_TIME: 16.67, // 60 FPS in milliseconds
	MEMORY_WARNING_THRESHOLD: 0.8, // 80% of available memory
	MEMORY_CRITICAL_THRESHOLD: 0.9, // 90% of available memory
	OPTIMIZATION_INTERVAL: 1000, // Run optimizations every second
	PROFILING_HISTORY_SIZE: 60, // Keep 60 frames of history
	MAX_CONCURRENT_ANIMATIONS: 10,
	MAX_CONCURRENT_TWEENS: 20,
	OBJECT_POOL_DEFAULT_SIZE: 50
};

// Performance presets
export const PerformancePresets = {
	HIGH_PERFORMANCE: {
		enableProfiling: true,
		enableOptimizations: true,
		targetFPS: 60,
		memoryThreshold: 70,
		autoOptimize: true,
		emergencyThreshold: 25,
		enableObjectPooling: true,
		enableBatchRendering: true,
		enableCulling: true,
		maxConcurrentAnimations: 15,
		maxConcurrentTweens: 30
	},
	
	BALANCED: {
		enableProfiling: true,
		enableOptimizations: true,
		targetFPS: 45,
		memoryThreshold: 80,
		autoOptimize: true,
		emergencyThreshold: 20,
		enableObjectPooling: true,
		enableBatchRendering: true,
		enableCulling: true,
		maxConcurrentAnimations: 10,
		maxConcurrentTweens: 20
	},
	
	COMPATIBILITY: {
		enableProfiling: false,
		enableOptimizations: true,
		targetFPS: 30,
		memoryThreshold: 90,
		autoOptimize: true,
		emergencyThreshold: 15,
		enableObjectPooling: true,
		enableBatchRendering: false,
		enableCulling: false,
		maxConcurrentAnimations: 5,
		maxConcurrentTweens: 10
	}
};