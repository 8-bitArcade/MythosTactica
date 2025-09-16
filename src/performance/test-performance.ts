/**
 * Performance Test Runner for MythosTactica
 * Comprehensive test suite to verify all performance optimizations are working
 */

import Game from '../game';
import { PerformanceTest } from './PerformanceTest';
import { PerformanceManager } from './PerformanceManager';

export async function runPerformanceTests(game: Game): Promise<void> {
	console.log('🚀 Starting comprehensive performance tests...');
	
	const performanceTest = new PerformanceTest(game);
	const performanceManager = game.performanceManager;

	try {
		// Test 1: Basic Performance
		console.log('📊 Test 1: Basic Performance Test');
		const basicTest = await performanceTest.quickPerformanceCheck();
		console.log(`   FPS: ${basicTest.fps.toFixed(1)}, Status: ${basicTest.status}`);
		
		if (basicTest.fps < 30) {
			console.warn('⚠️  Warning: Basic performance below 30 FPS');
		} else {
			console.log('✅ Basic performance test passed');
		}

		// Test 2: Save/Load Compatibility
		console.log('💾 Test 2: Save/Load Compatibility Test');
		const saveLoadTest = await performanceManager.testSaveLoadCompatibility();
		
		if (saveLoadTest.success) {
			console.log('✅ Save/load compatibility test passed');
		} else {
			console.error('❌ Save/load compatibility test failed:', saveLoadTest.errors);
		}

		// Test 3: Memory Management
		console.log('🧠 Test 3: Memory Management Test');
		const initialMemory = getMemoryUsage();
		
		// Create and destroy objects to test memory management
		const testObjects: any[] = [];
		if (game.currentScene) {
			for (let i = 0; i < 100; i++) {
				const obj = game.currentScene.add.circle(
					Math.random() * 800,
					Math.random() * 600,
					5,
					0xff0000
				);
				testObjects.push(obj);
			}
			
			// Clean up objects
			testObjects.forEach(obj => obj.destroy());
		}
		
		// Force garbage collection if available
		if (typeof (window as any).gc === 'function') {
			(window as any).gc();
		}
		
		const finalMemory = getMemoryUsage();
		const memoryLeak = finalMemory - initialMemory;
		
		if (memoryLeak < initialMemory * 0.1) {
			console.log('✅ Memory management test passed');
		} else {
			console.warn(`⚠️  Warning: Potential memory leak detected (${memoryLeak} bytes)`);
		}

		// Test 4: Animation Performance
		console.log('🎬 Test 4: Animation Performance Test');
		if (game.animations) {
			const animationCount = game.animations.getActiveAnimationCount();
			const animationMetrics = game.animations.getPerformanceMetrics();
			
			console.log(`   Active animations: ${animationCount}`);
			console.log(`   Animation memory: ${animationMetrics.memoryUsage.activeAnimations} bytes`);
			
			if (animationCount < 50) {
				console.log('✅ Animation performance test passed');
			} else {
				console.warn('⚠️  Warning: High animation count detected');
			}
		}

		// Test 5: Optimization Systems
		console.log('⚙️  Test 5: Optimization Systems Test');
		const optimizationStats = performanceManager.getOptimizationStats();
		
		console.log('   Object pools:', Object.keys(optimizationStats.pools).length);
		console.log('   Batch groups:', Object.keys(optimizationStats.batches).length);
		console.log('   Culled objects:', optimizationStats.culledObjects);
		
		if (Object.keys(optimizationStats.pools).length > 0) {
			console.log('✅ Object pooling system active');
		} else {
			console.warn('⚠️  Warning: Object pooling system not active');
		}

		// Test 6: 60 FPS Target
		console.log('🎯 Test 6: 60 FPS Target Test');
		const performanceReport = performanceManager.getPerformanceReport();
		
		if (performanceReport.metrics.fps >= 55) {
			console.log('✅ 60 FPS target achieved');
		} else if (performanceReport.metrics.fps >= 45) {
			console.log('⚠️  Good performance (45+ FPS)');
		} else if (performanceReport.metrics.fps >= 30) {
			console.log('⚠️  Acceptable performance (30+ FPS)');
		} else {
			console.error('❌ Poor performance (<30 FPS)');
		}

		// Test 7: Comprehensive Test Suite
		console.log('🔬 Test 7: Running Comprehensive Test Suite');
		const comprehensiveReport = await performanceTest.runComprehensiveTests({
			duration: 3000, // 3 seconds per test for quick verification
			includeStressTest: true,
			testSaveLoad: true,
			testAnimations: true,
			testMemoryUsage: true
		});

		console.log(`   Overall Score: ${comprehensiveReport.overallScore}/100`);
		console.log(`   Tests Passed: ${comprehensiveReport.summary.passedTests}/${comprehensiveReport.summary.totalTests}`);
		
		if (comprehensiveReport.overallScore >= 70) {
			console.log('✅ Comprehensive test suite passed');
		} else {
			console.warn('⚠️  Warning: Comprehensive test suite shows performance issues');
		}

		// Summary
		console.log('\n📋 Performance Test Summary:');
		console.log('================================');
		console.log(`Basic FPS: ${basicTest.fps.toFixed(1)}`);
		console.log(`Save/Load: ${saveLoadTest.success ? 'PASS' : 'FAIL'}`);
		console.log(`Memory Management: ${memoryLeak < initialMemory * 0.1 ? 'PASS' : 'WARN'}`);
		console.log(`Overall Score: ${comprehensiveReport.overallScore}/100`);
		console.log(`Performance Status: ${performanceManager.getPerformanceStatus().toUpperCase()}`);
		
		if (comprehensiveReport.summary.recommendations.length > 0) {
			console.log('\n💡 Recommendations:');
			comprehensiveReport.summary.recommendations.slice(0, 3).forEach(rec => {
				console.log(`   • ${rec}`);
			});
		}

		console.log('\n🎉 Performance tests completed!');

	} catch (error) {
		console.error('❌ Performance tests failed:', error);
		throw error;
	}
}

/**
 * Get current memory usage
 */
function getMemoryUsage(): number {
	if ('memory' in performance) {
		return (performance as any).memory.usedJSHeapSize;
	}
	return 0;
}

/**
 * Run quick performance verification
 */
export async function verifyPerformanceOptimizations(game: Game): Promise<boolean> {
	console.log('🔍 Verifying performance optimizations...');
	
	try {
		// Check if performance manager is initialized
		if (!game.performanceManager) {
			console.error('❌ Performance manager not initialized');
			return false;
		}

		// Check if optimizations are enabled
		const optimizationStats = game.performanceManager.getOptimizationStats();
		if (!optimizationStats.config.enableOptimizations) {
			console.warn('⚠️  Performance optimizations are disabled');
		}

		// Check FPS
		const report = game.performanceManager.getPerformanceReport();
		if (report.metrics.fps < 30) {
			console.warn('⚠️  FPS below 30, performance may be poor');
		}

		// Check memory usage
		if (report.metrics.memoryUsage.percentage > 80) {
			console.warn('⚠️  Memory usage above 80%');
		}

		// Check if save/load compatibility works
		const saveLoadTest = await game.performanceManager.testSaveLoadCompatibility();
		if (!saveLoadTest.success) {
			console.error('❌ Save/load compatibility issues detected');
			return false;
		}

		console.log('✅ Performance optimizations verified successfully');
		return true;

	} catch (error) {
		console.error('❌ Performance verification failed:', error);
		return false;
	}
}

// Export test functions for global access
if (typeof window !== 'undefined') {
	(window as any).runPerformanceTests = runPerformanceTests;
	(window as any).verifyPerformanceOptimizations = verifyPerformanceOptimizations;
}