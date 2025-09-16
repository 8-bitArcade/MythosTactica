/**
 * Performance Testing Utility for MythosTactica
 * Provides comprehensive performance testing and benchmarking
 */

import Game from '../game';
import { PerformanceManager } from './PerformanceManager';

export interface PerformanceTestConfig {
	duration: number; // Test duration in milliseconds
	iterations: number; // Number of test iterations
	includeStressTest: boolean; // Whether to include stress testing
	testSaveLoad: boolean; // Whether to test save/load performance
	testAnimations: boolean; // Whether to test animation performance
	testMemoryUsage: boolean; // Whether to test memory usage
}

export interface PerformanceTestResult {
	testName: string;
	duration: number;
	averageFPS: number;
	minFPS: number;
	maxFPS: number;
	frameTimeStats: {
		average: number;
		min: number;
		max: number;
		p95: number;
		p99: number;
	};
	memoryStats: {
		initial: number;
		peak: number;
		final: number;
		leaked: number;
	};
	recommendations: string[];
	passed: boolean;
}

export interface ComprehensiveTestReport {
	timestamp: number;
	gameVersion: string;
	systemInfo: {
		userAgent: string;
		hardwareConcurrency: number;
		memory?: any;
	};
	testResults: PerformanceTestResult[];
	overallScore: number;
	summary: {
		totalTests: number;
		passedTests: number;
		failedTests: number;
		criticalIssues: string[];
		recommendations: string[];
	};
}

export class PerformanceTest {
	private game: Game;
	private performanceManager: PerformanceManager;

	constructor(game: Game) {
		this.game = game;
		this.performanceManager = game.performanceManager;
	}

	/**
	 * Run comprehensive performance tests
	 */
	async runComprehensiveTests(config?: Partial<PerformanceTestConfig>): Promise<ComprehensiveTestReport> {
		const testConfig: PerformanceTestConfig = {
			duration: 10000, // 10 seconds per test
			iterations: 3,
			includeStressTest: true,
			testSaveLoad: true,
			testAnimations: true,
			testMemoryUsage: true,
			...config
		};

		console.log('[PerformanceTest] Starting comprehensive performance tests');
		const startTime = Date.now();

		const testResults: PerformanceTestResult[] = [];

		// Basic performance test
		testResults.push(await this.runBasicPerformanceTest(testConfig.duration));

		// Animation performance test
		if (testConfig.testAnimations) {
			testResults.push(await this.runAnimationPerformanceTest(testConfig.duration));
		}

		// Memory usage test
		if (testConfig.testMemoryUsage) {
			testResults.push(await this.runMemoryUsageTest(testConfig.duration));
		}

		// Save/Load performance test
		if (testConfig.testSaveLoad) {
			testResults.push(await this.runSaveLoadPerformanceTest());
		}

		// Stress test
		if (testConfig.includeStressTest) {
			testResults.push(await this.runStressTest(testConfig.duration));
		}

		// Generate comprehensive report
		const report = this.generateComprehensiveReport(testResults, Date.now() - startTime);
		
		console.log('[PerformanceTest] Comprehensive tests completed');
		console.log(`[PerformanceTest] Overall score: ${report.overallScore}/100`);
		
		return report;
	}

	/**
	 * Run basic performance test
	 */
	private async runBasicPerformanceTest(duration: number): Promise<PerformanceTestResult> {
		console.log('[PerformanceTest] Running basic performance test');

		const initialMemory = this.getMemoryUsage();
		const metrics: number[] = [];
		const frameTimes: number[] = [];

		// Enable profiling
		this.performanceManager.setProfiling(true);
		
		const startTime = performance.now();
		let frameCount = 0;
		let lastFrameTime = startTime;

		// Run test for specified duration
		return new Promise((resolve) => {
			const testInterval = setInterval(() => {
				const now = performance.now();
				const frameTime = now - lastFrameTime;
				lastFrameTime = now;
				frameCount++;

				const fps = 1000 / frameTime;
				metrics.push(fps);
				frameTimes.push(frameTime);

				if (now - startTime >= duration) {
					clearInterval(testInterval);

					const finalMemory = this.getMemoryUsage();
					const result = this.analyzeTestResults(
						'Basic Performance Test',
						duration,
						metrics,
						frameTimes,
						initialMemory,
						finalMemory
					);

					resolve(result);
				}
			}, 16); // ~60 FPS
		});
	}

	/**
	 * Run animation performance test
	 */
	private async runAnimationPerformanceTest(duration: number): Promise<PerformanceTestResult> {
		console.log('[PerformanceTest] Running animation performance test');

		const initialMemory = this.getMemoryUsage();
		const metrics: number[] = [];
		const frameTimes: number[] = [];

		// Create multiple test animations
		const testAnimations: any[] = [];
		if (this.game.currentScene) {
			for (let i = 0; i < 20; i++) {
				const sprite = this.game.currentScene.add.sprite(
					Math.random() * 800,
					Math.random() * 600,
					'test'
				);
				
				const tween = this.game.currentScene.tweens.add({
					targets: sprite,
					x: Math.random() * 800,
					y: Math.random() * 600,
					duration: 2000,
					ease: 'Power2',
					yoyo: true,
					repeat: -1
				});

				testAnimations.push({ sprite, tween });
			}
		}

		const startTime = performance.now();
		let lastFrameTime = startTime;

		return new Promise((resolve) => {
			const testInterval = setInterval(() => {
				const now = performance.now();
				const frameTime = now - lastFrameTime;
				lastFrameTime = now;

				const fps = 1000 / frameTime;
				metrics.push(fps);
				frameTimes.push(frameTime);

				if (now - startTime >= duration) {
					clearInterval(testInterval);

					// Clean up test animations
					testAnimations.forEach(({ sprite, tween }) => {
						tween.destroy();
						sprite.destroy();
					});

					const finalMemory = this.getMemoryUsage();
					const result = this.analyzeTestResults(
						'Animation Performance Test',
						duration,
						metrics,
						frameTimes,
						initialMemory,
						finalMemory
					);

					resolve(result);
				}
			}, 16);
		});
	}

	/**
	 * Run memory usage test
	 */
	private async runMemoryUsageTest(duration: number): Promise<PerformanceTestResult> {
		console.log('[PerformanceTest] Running memory usage test');

		const initialMemory = this.getMemoryUsage();
		const metrics: number[] = [];
		const frameTimes: number[] = [];
		const memorySnapshots: number[] = [];

		// Create and destroy objects to test memory management
		const objects: any[] = [];

		const startTime = performance.now();
		let lastFrameTime = startTime;

		return new Promise((resolve) => {
			const testInterval = setInterval(() => {
				const now = performance.now();
				const frameTime = now - lastFrameTime;
				lastFrameTime = now;

				// Create some objects
				if (this.game.currentScene) {
					for (let i = 0; i < 5; i++) {
						const obj = this.game.currentScene.add.circle(
							Math.random() * 800,
							Math.random() * 600,
							10,
							0xff0000
						);
						objects.push(obj);
					}

					// Destroy old objects
					if (objects.length > 100) {
						const toDestroy = objects.splice(0, 50);
						toDestroy.forEach(obj => obj.destroy());
					}
				}

				const fps = 1000 / frameTime;
				metrics.push(fps);
				frameTimes.push(frameTime);
				memorySnapshots.push(this.getMemoryUsage());

				if (now - startTime >= duration) {
					clearInterval(testInterval);

					// Clean up remaining objects
					objects.forEach(obj => obj.destroy());

					const finalMemory = this.getMemoryUsage();
					const result = this.analyzeTestResults(
						'Memory Usage Test',
						duration,
						metrics,
						frameTimes,
						initialMemory,
						finalMemory,
						memorySnapshots
					);

					resolve(result);
				}
			}, 16);
		});
	}

	/**
	 * Run save/load performance test
	 */
	private async runSaveLoadPerformanceTest(): Promise<PerformanceTestResult> {
		console.log('[PerformanceTest] Running save/load performance test');

		const initialMemory = this.getMemoryUsage();
		const saveLoadTimes: number[] = [];

		// Test save/load operations
		for (let i = 0; i < 10; i++) {
			const saveStart = performance.now();
			
			try {
				// Create save data
				const saveData = this.performanceManager.createSaveData();
				const saveString = JSON.stringify(saveData);
				
				// Load save data
				await this.performanceManager.loadSaveFile(saveString);
				
				const saveLoadTime = performance.now() - saveStart;
				saveLoadTimes.push(saveLoadTime);
				
			} catch (error) {
				console.error('[PerformanceTest] Save/load test error:', error);
				saveLoadTimes.push(1000); // Penalty for failure
			}
		}

		const finalMemory = this.getMemoryUsage();
		const avgSaveLoadTime = saveLoadTimes.reduce((a, b) => a + b, 0) / saveLoadTimes.length;

		return {
			testName: 'Save/Load Performance Test',
			duration: avgSaveLoadTime * saveLoadTimes.length,
			averageFPS: 60, // Not applicable for save/load
			minFPS: 60,
			maxFPS: 60,
			frameTimeStats: {
				average: avgSaveLoadTime,
				min: Math.min(...saveLoadTimes),
				max: Math.max(...saveLoadTimes),
				p95: this.calculatePercentile(saveLoadTimes, 95),
				p99: this.calculatePercentile(saveLoadTimes, 99)
			},
			memoryStats: {
				initial: initialMemory,
				peak: Math.max(initialMemory, finalMemory),
				final: finalMemory,
				leaked: Math.max(0, finalMemory - initialMemory)
			},
			recommendations: avgSaveLoadTime > 100 ? 
				['Save/load operations are slow, consider optimizing save data format'] : [],
			passed: avgSaveLoadTime < 200 // Pass if average save/load is under 200ms
		};
	}

	/**
	 * Run stress test with many objects
	 */
	private async runStressTest(duration: number): Promise<PerformanceTestResult> {
		console.log('[PerformanceTest] Running stress test');

		const initialMemory = this.getMemoryUsage();
		const metrics: number[] = [];
		const frameTimes: number[] = [];

		// Create many objects to stress the system
		const stressObjects: any[] = [];
		if (this.game.currentScene) {
			for (let i = 0; i < 500; i++) {
				const obj = this.game.currentScene.add.sprite(
					Math.random() * 800,
					Math.random() * 600,
					'test'
				);
				
				// Add random movement
				this.game.currentScene.tweens.add({
					targets: obj,
					x: Math.random() * 800,
					y: Math.random() * 600,
					duration: Math.random() * 3000 + 1000,
					ease: 'Power2',
					yoyo: true,
					repeat: -1
				});

				stressObjects.push(obj);
			}
		}

		const startTime = performance.now();
		let lastFrameTime = startTime;

		return new Promise((resolve) => {
			const testInterval = setInterval(() => {
				const now = performance.now();
				const frameTime = now - lastFrameTime;
				lastFrameTime = now;

				const fps = 1000 / frameTime;
				metrics.push(fps);
				frameTimes.push(frameTime);

				if (now - startTime >= duration) {
					clearInterval(testInterval);

					// Clean up stress objects
					stressObjects.forEach(obj => obj.destroy());

					const finalMemory = this.getMemoryUsage();
					const result = this.analyzeTestResults(
						'Stress Test',
						duration,
						metrics,
						frameTimes,
						initialMemory,
						finalMemory
					);

					resolve(result);
				}
			}, 16);
		});
	}

	/**
	 * Analyze test results and generate report
	 */
	private analyzeTestResults(
		testName: string,
		duration: number,
		fpsMetrics: number[],
		frameTimes: number[],
		initialMemory: number,
		finalMemory: number,
		memorySnapshots?: number[]
	): PerformanceTestResult {
		const avgFPS = fpsMetrics.reduce((a, b) => a + b, 0) / fpsMetrics.length;
		const minFPS = Math.min(...fpsMetrics);
		const maxFPS = Math.max(...fpsMetrics);

		const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
		const minFrameTime = Math.min(...frameTimes);
		const maxFrameTime = Math.max(...frameTimes);

		const peakMemory = memorySnapshots ? Math.max(...memorySnapshots) : Math.max(initialMemory, finalMemory);
		const memoryLeak = Math.max(0, finalMemory - initialMemory);

		const recommendations: string[] = [];
		
		if (avgFPS < 30) {
			recommendations.push('Critical: Average FPS below 30');
		} else if (avgFPS < 50) {
			recommendations.push('Warning: Average FPS below 50');
		}

		if (minFPS < 20) {
			recommendations.push('Critical: Minimum FPS below 20');
		}

		if (avgFrameTime > 33.33) {
			recommendations.push('High frame times detected, consider optimizations');
		}

		if (memoryLeak > initialMemory * 0.1) {
			recommendations.push('Potential memory leak detected');
		}

		const passed = avgFPS >= 30 && minFPS >= 20 && memoryLeak < initialMemory * 0.2;

		return {
			testName,
			duration,
			averageFPS: avgFPS,
			minFPS,
			maxFPS,
			frameTimeStats: {
				average: avgFrameTime,
				min: minFrameTime,
				max: maxFrameTime,
				p95: this.calculatePercentile(frameTimes, 95),
				p99: this.calculatePercentile(frameTimes, 99)
			},
			memoryStats: {
				initial: initialMemory,
				peak: peakMemory,
				final: finalMemory,
				leaked: memoryLeak
			},
			recommendations,
			passed
		};
	}

	/**
	 * Generate comprehensive test report
	 */
	private generateComprehensiveReport(
		testResults: PerformanceTestResult[],
		totalDuration: number
	): ComprehensiveTestReport {
		const passedTests = testResults.filter(r => r.passed).length;
		const failedTests = testResults.length - passedTests;

		const criticalIssues: string[] = [];
		const allRecommendations: string[] = [];

		testResults.forEach(result => {
			result.recommendations.forEach(rec => {
				if (rec.includes('Critical')) {
					criticalIssues.push(`${result.testName}: ${rec}`);
				}
				allRecommendations.push(rec);
			});
		});

		// Calculate overall score
		const avgFPS = testResults.reduce((sum, r) => sum + r.averageFPS, 0) / testResults.length;
		const passRate = passedTests / testResults.length;
		const overallScore = Math.round((avgFPS / 60) * 50 + passRate * 50);

		return {
			timestamp: Date.now(),
			gameVersion: '0.5.0',
			systemInfo: {
				userAgent: navigator.userAgent,
				hardwareConcurrency: navigator.hardwareConcurrency,
				memory: (performance as any).memory ? {
					jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
					totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
					usedJSHeapSize: (performance as any).memory.usedJSHeapSize
				} : null
			},
			testResults,
			overallScore,
			summary: {
				totalTests: testResults.length,
				passedTests,
				failedTests,
				criticalIssues,
				recommendations: [...new Set(allRecommendations)]
			}
		};
	}

	/**
	 * Get current memory usage
	 */
	private getMemoryUsage(): number {
		if ('memory' in performance) {
			return (performance as any).memory.usedJSHeapSize;
		}
		return 0;
	}

	/**
	 * Calculate percentile of an array
	 */
	private calculatePercentile(arr: number[], percentile: number): number {
		const sorted = [...arr].sort((a, b) => a - b);
		const index = Math.ceil((percentile / 100) * sorted.length) - 1;
		return sorted[index] || 0;
	}

	/**
	 * Export test results to JSON
	 */
	exportResults(report: ComprehensiveTestReport): string {
		return JSON.stringify(report, null, 2);
	}

	/**
	 * Quick performance check
	 */
	async quickPerformanceCheck(): Promise<{
		fps: number;
		status: string;
		recommendations: string[];
	}> {
		const testResult = await this.runBasicPerformanceTest(3000); // 3 second test
		
		let status = 'good';
		if (testResult.averageFPS < 30) status = 'critical';
		else if (testResult.averageFPS < 45) status = 'poor';
		else if (testResult.averageFPS < 55) status = 'fair';

		return {
			fps: testResult.averageFPS,
			status,
			recommendations: testResult.recommendations
		};
	}
}