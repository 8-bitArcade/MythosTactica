/**
 * Performance Monitor UI for MythosTactica
 * Provides real-time performance monitoring and controls
 */

import Game from '../game';
import { PerformanceManager } from './PerformanceManager';
import { PerformanceTest } from './PerformanceTest';

class PerformanceMonitor {
	private game: Game;
	private performanceManager: PerformanceManager;
	private performanceTest: PerformanceTest;
	private isVisible = false;
	private container?: HTMLElement;
	private updateInterval?: NodeJS.Timeout;

	constructor(game: Game) {
		this.game = game;
		this.performanceManager = game.performanceManager;
		this.performanceTest = new PerformanceTest(game);
	}

	/**
	 * Create and show the performance monitor UI
	 */
	show(): void {
		if (this.isVisible) return;

		this.createUI();
		this.startUpdating();
		this.isVisible = true;
	}

	/**
	 * Hide the performance monitor UI
	 */
	hide(): void {
		if (!this.isVisible) return;

		this.stopUpdating();
		if (this.container) {
			this.container.remove();
			this.container = undefined;
		}
		this.isVisible = false;
	}

	/**
	 * Toggle the performance monitor UI
	 */
	toggle(): void {
		if (this.isVisible) {
			this.hide();
		} else {
			this.show();
		}
	}

	/**
	 * Create the performance monitor UI
	 */
	private createUI(): void {
		// Create container
		this.container = document.createElement('div');
		this.container.id = 'performance-monitor';
		this.container.style.cssText = `
			position: fixed;
			top: 10px;
			right: 10px;
			width: 300px;
			background: rgba(0, 0, 0, 0.8);
			color: white;
			padding: 10px;
			border-radius: 5px;
			font-family: monospace;
			font-size: 12px;
			z-index: 10000;
			max-height: 80vh;
			overflow-y: auto;
		`;

		// Create content
		this.container.innerHTML = `
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
				<h3 style="margin: 0; color: #00ff00;">Performance Monitor</h3>
				<button id="perf-close" style="background: #ff0000; color: white; border: none; padding: 2px 6px; cursor: pointer;">×</button>
			</div>
			
			<div id="perf-metrics">
				<div>FPS: <span id="fps-value">--</span></div>
				<div>Frame Time: <span id="frame-time-value">--</span>ms</div>
				<div>Memory: <span id="memory-value">--</span>MB</div>
				<div>Status: <span id="status-value">--</span></div>
			</div>
			
			<div style="margin: 10px 0;">
				<div>Animations: <span id="animation-count">--</span></div>
				<div>Tweens: <span id="tween-count">--</span></div>
				<div>Sprites: <span id="sprite-count">--</span></div>
			</div>
			
			<div style="margin: 10px 0;">
				<button id="run-quick-test" style="background: #0066cc; color: white; border: none; padding: 5px 10px; cursor: pointer; margin-right: 5px;">Quick Test</button>
				<button id="run-full-test" style="background: #cc6600; color: white; border: none; padding: 5px 10px; cursor: pointer;">Full Test</button>
			</div>
			
			<div style="margin: 10px 0;">
				<label><input type="checkbox" id="enable-profiling" checked> Profiling</label><br>
				<label><input type="checkbox" id="enable-optimizations" checked> Optimizations</label><br>
				<label><input type="checkbox" id="auto-optimize" checked> Auto Optimize</label>
			</div>
			
			<div id="recommendations" style="margin-top: 10px; font-size: 11px; color: #ffff00;">
				<div><strong>Recommendations:</strong></div>
				<div id="rec-list">No recommendations</div>
			</div>
			
			<div id="test-results" style="margin-top: 10px; font-size: 11px; color: #cccccc; display: none;">
				<div><strong>Test Results:</strong></div>
				<div id="test-output"></div>
			</div>
		`;

		// Add event listeners
		this.container.querySelector('#perf-close')?.addEventListener('click', () => this.hide());
		
		this.container.querySelector('#run-quick-test')?.addEventListener('click', () => this.runQuickTest());
		this.container.querySelector('#run-full-test')?.addEventListener('click', () => this.runFullTest());
		
		this.container.querySelector('#enable-profiling')?.addEventListener('change', (e) => {
			const enabled = (e.target as HTMLInputElement).checked;
			this.performanceManager.setProfiling(enabled);
		});
		
		this.container.querySelector('#enable-optimizations')?.addEventListener('change', (e) => {
			const enabled = (e.target as HTMLInputElement).checked;
			this.performanceManager.setOptimizations(enabled);
		});

		// Add to document
		document.body.appendChild(this.container);
	}

	/**
	 * Start updating the performance monitor
	 */
	private startUpdating(): void {
		this.updateInterval = setInterval(() => {
			this.updateMetrics();
		}, 1000); // Update every second
	}

	/**
	 * Stop updating the performance monitor
	 */
	private stopUpdating(): void {
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
			this.updateInterval = undefined;
		}
	}

	/**
	 * Update the performance metrics display
	 */
	private updateMetrics(): void {
		if (!this.container) return;

		try {
			const report = this.performanceManager.getPerformanceReport();
			const status = this.performanceManager.getPerformanceStatus();

			// Update basic metrics
			this.updateElement('#fps-value', report.metrics.fps.toFixed(1));
			this.updateElement('#frame-time-value', report.metrics.frameTime.toFixed(1));
			this.updateElement('#memory-value', (report.metrics.memoryUsage.used / 1024 / 1024).toFixed(1));
			this.updateElement('#status-value', status, this.getStatusColor(status));

			// Update detailed metrics
			this.updateElement('#animation-count', report.metrics.animationCount.toString());
			this.updateElement('#tween-count', report.metrics.tweenCount.toString());
			this.updateElement('#sprite-count', report.metrics.spriteCount.toString());

			// Update recommendations
			const recList = this.container.querySelector('#rec-list');
			if (recList) {
				if (report.recommendations.length > 0) {
					recList.innerHTML = report.recommendations.slice(0, 3).map(rec => `• ${rec}`).join('<br>');
				} else {
					recList.innerHTML = 'No recommendations';
				}
			}

		} catch (error) {
			console.error('[PerformanceMonitor] Error updating metrics:', error);
		}
	}

	/**
	 * Update a specific element's content and color
	 */
	private updateElement(selector: string, content: string, color?: string): void {
		const element = this.container?.querySelector(selector);
		if (element) {
			element.textContent = content;
			if (color) {
				(element as HTMLElement).style.color = color;
			}
		}
	}

	/**
	 * Get color for performance status
	 */
	private getStatusColor(status: string): string {
		switch (status) {
			case 'excellent': return '#00ff00';
			case 'good': return '#88ff00';
			case 'fair': return '#ffff00';
			case 'poor': return '#ff8800';
			case 'critical': return '#ff0000';
			default: return '#ffffff';
		}
	}

	/**
	 * Run quick performance test
	 */
	private async runQuickTest(): Promise<void> {
		const button = this.container?.querySelector('#run-quick-test') as HTMLButtonElement;
		if (button) {
			button.disabled = true;
			button.textContent = 'Testing...';
		}

		try {
			const result = await this.performanceTest.quickPerformanceCheck();
			this.showTestResults({
				testName: 'Quick Test',
				fps: result.fps,
				status: result.status,
				recommendations: result.recommendations
			});
		} catch (error) {
			console.error('[PerformanceMonitor] Quick test failed:', error);
		} finally {
			if (button) {
				button.disabled = false;
				button.textContent = 'Quick Test';
			}
		}
	}

	/**
	 * Run full performance test
	 */
	private async runFullTest(): Promise<void> {
		const button = this.container?.querySelector('#run-full-test') as HTMLButtonElement;
		if (button) {
			button.disabled = true;
			button.textContent = 'Testing...';
		}

		try {
			const report = await this.performanceTest.runComprehensiveTests({
				duration: 5000, // 5 seconds per test
				includeStressTest: true,
				testSaveLoad: true,
				testAnimations: true,
				testMemoryUsage: true
			});

			this.showTestResults({
				testName: 'Comprehensive Test',
				score: report.overallScore,
				passed: report.summary.passedTests,
				failed: report.summary.failedTests,
				recommendations: report.summary.recommendations.slice(0, 5)
			});

			// Optionally export results
			console.log('[PerformanceMonitor] Full test results:', report);
			
		} catch (error) {
			console.error('[PerformanceMonitor] Full test failed:', error);
		} finally {
			if (button) {
				button.disabled = false;
				button.textContent = 'Full Test';
			}
		}
	}

	/**
	 * Show test results in the UI
	 */
	private showTestResults(results: any): void {
		const testResults = this.container?.querySelector('#test-results');
		const testOutput = this.container?.querySelector('#test-output');
		
		if (testResults && testOutput) {
			(testResults as HTMLElement).style.display = 'block';
			
			let output = `<strong>${results.testName} Results:</strong><br>`;
			
			if (results.fps) {
				output += `FPS: ${results.fps.toFixed(1)}<br>`;
			}
			
			if (results.status) {
				output += `Status: ${results.status}<br>`;
			}
			
			if (results.score) {
				output += `Score: ${results.score}/100<br>`;
			}
			
			if (results.passed !== undefined && results.failed !== undefined) {
				output += `Tests: ${results.passed} passed, ${results.failed} failed<br>`;
			}
			
			if (results.recommendations && results.recommendations.length > 0) {
				output += `<br><strong>Recommendations:</strong><br>`;
				output += results.recommendations.map((rec: string) => `• ${rec}`).join('<br>');
			}
			
			testOutput.innerHTML = output;
		}
	}

	/**
	 * Export current performance data
	 */
	exportData(): string {
		return this.performanceManager.exportPerformanceData();
	}

	/**
	 * Check if the monitor is visible
	 */
	isMonitorVisible(): boolean {
		return this.isVisible;
	}
}

// Global function to toggle performance monitor (for debugging)
declare global {
	interface Window {
		togglePerformanceMonitor?: () => void;
		exportPerformanceData?: () => void;
	}
}

// Add global functions for easy access in development
if (typeof window !== 'undefined') {
	let globalMonitor: PerformanceMonitor | null = null;
	
	window.togglePerformanceMonitor = () => {
		if (globalMonitor) {
			globalMonitor.toggle();
		} else {
			console.warn('Performance monitor not initialized');
		}
	};
	
	window.exportPerformanceData = () => {
		if (globalMonitor) {
			const data = globalMonitor.exportData();
			console.log('Performance data:', data);
			
			// Create download link
			const blob = new Blob([data], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `performance-data-${Date.now()}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} else {
			console.warn('Performance monitor not initialized');
		}
	};

	// Initialize global monitor when game is available
	const initGlobalMonitor = () => {
		const gameElement = document.querySelector('#combatwrapper');
		if (gameElement && (window as any).G) {
			globalMonitor = new PerformanceMonitor((window as any).G);
			console.log('Performance monitor initialized. Use togglePerformanceMonitor() to show/hide.');
		}
	};

	// Try to initialize immediately or wait for game
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initGlobalMonitor);
	} else {
		setTimeout(initGlobalMonitor, 1000);
	}
}

// Export the class
export { PerformanceMonitor };