/**
 * Comprehensive test runner for the Phaser 3 migration
 * Runs all test suites and generates detailed reports
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
	suite: string;
	passed: boolean;
	duration: number;
	coverage?: number;
	errors?: string[];
}

interface TestReport {
	timestamp: string;
	totalTests: number;
	passedTests: number;
	failedTests: number;
	totalDuration: number;
	overallCoverage: number;
	results: TestResult[];
	summary: string;
}

class ComprehensiveTestRunner {
	private testSuites = [
		{
			name: 'jQuery Replacement Utilities',
			pattern: 'jquery-replacement.test.ts',
			description: 'Tests all DOM manipulation and utility functions'
		},
		{
			name: 'Game Loop Integration',
			pattern: 'game-loop.test.ts',
			description: 'Tests phaserUpdate() and phaserRender() integration'
		},
		{
			name: 'UI Regression Tests',
			pattern: 'ui-regression.test.ts',
			description: 'Ensures UI interactions work identically after migration'
		},
		{
			name: 'Performance Tests',
			pattern: 'performance.test.ts',
			description: 'Validates rendering and animation performance'
		},
		{
			name: 'Input Handling Tests',
			pattern: 'input-handling.test.ts',
			description: 'Tests mouse, keyboard, and touch input across devices'
		},
		{
			name: 'Animation System Tests',
			pattern: 'animations.test.ts',
			description: 'Tests Phaser 3 animation system integration'
		}
	];

	private results: TestResult[] = [];

	async runAllTests(): Promise<TestReport> {
		console.log('🚀 Starting Comprehensive Test Suite for Phaser 3 Migration');
		console.log('=' .repeat(60));

		const startTime = Date.now();

		for (const suite of this.testSuites) {
			console.log(`\n📋 Running: ${suite.name}`);
			console.log(`   ${suite.description}`);
			
			const result = await this.runTestSuite(suite);
			this.results.push(result);
			
			const status = result.passed ? '✅ PASSED' : '❌ FAILED';
			const duration = `${result.duration.toFixed(2)}ms`;
			console.log(`   ${status} (${duration})`);
			
			if (!result.passed && result.errors) {
				result.errors.forEach(error => {
					console.log(`   ⚠️  ${error}`);
				});
			}
		}

		const endTime = Date.now();
		const totalDuration = endTime - startTime;

		const report = this.generateReport(totalDuration);
		await this.saveReport(report);
		this.printSummary(report);

		return report;
	}

	private async runTestSuite(suite: { name: string; pattern: string; description: string }): Promise<TestResult> {
		const startTime = performance.now();
		
		try {
			// Run Jest for specific test file
			const command = `npx jest --testPathPattern="${suite.pattern}" --coverage --json --outputFile=test-results-${suite.pattern}.json`;
			
			execSync(command, { 
				stdio: 'pipe',
				cwd: process.cwd()
			});

			const endTime = performance.now();
			const duration = endTime - startTime;

			// Read test results
			const resultsFile = `test-results-${suite.pattern}.json`;
			let testData: any = {};
			
			if (fs.existsSync(resultsFile)) {
				const resultsContent = fs.readFileSync(resultsFile, 'utf8');
				testData = JSON.parse(resultsContent);
				fs.unlinkSync(resultsFile); // Clean up
			}

			return {
				suite: suite.name,
				passed: testData.success || false,
				duration,
				coverage: this.extractCoverage(testData),
				errors: this.extractErrors(testData)
			};

		} catch (error) {
			const endTime = performance.now();
			const duration = endTime - startTime;

			return {
				suite: suite.name,
				passed: false,
				duration,
				errors: [error.message || 'Unknown error occurred']
			};
		}
	}

	private extractCoverage(testData: any): number {
		try {
			if (testData.coverageMap) {
				const coverage = testData.coverageMap;
				let totalStatements = 0;
				let coveredStatements = 0;

				Object.values(coverage).forEach((file: any) => {
					if (file.s) {
						Object.values(file.s).forEach((count: any) => {
							totalStatements++;
							if (count > 0) coveredStatements++;
						});
					}
				});

				return totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
			}
		} catch (error) {
			console.warn('Could not extract coverage data:', error.message);
		}
		return 0;
	}

	private extractErrors(testData: any): string[] {
		const errors: string[] = [];
		
		try {
			if (testData.testResults) {
				testData.testResults.forEach((result: any) => {
					if (result.message) {
						errors.push(result.message);
					}
				});
			}
		} catch (error) {
			errors.push('Could not extract error details');
		}

		return errors;
	}

	private generateReport(totalDuration: number): TestReport {
		const passedTests = this.results.filter(r => r.passed).length;
		const failedTests = this.results.length - passedTests;
		const overallCoverage = this.results.reduce((sum, r) => sum + (r.coverage || 0), 0) / this.results.length;

		let summary = `Comprehensive Test Results:\n`;
		summary += `Total Test Suites: ${this.results.length}\n`;
		summary += `Passed: ${passedTests}\n`;
		summary += `Failed: ${failedTests}\n`;
		summary += `Success Rate: ${((passedTests / this.results.length) * 100).toFixed(1)}%\n`;
		summary += `Total Duration: ${totalDuration.toFixed(2)}ms\n`;
		summary += `Average Coverage: ${overallCoverage.toFixed(1)}%\n`;

		if (failedTests === 0) {
			summary += `\n🎉 All tests passed! The Phaser 3 migration is ready.`;
		} else {
			summary += `\n⚠️  ${failedTests} test suite(s) failed. Review the errors above.`;
		}

		return {
			timestamp: new Date().toISOString(),
			totalTests: this.results.length,
			passedTests,
			failedTests,
			totalDuration,
			overallCoverage,
			results: this.results,
			summary
		};
	}

	private async saveReport(report: TestReport): Promise<void> {
		const reportDir = path.join(process.cwd(), 'test-reports');
		
		if (!fs.existsSync(reportDir)) {
			fs.mkdirSync(reportDir, { recursive: true });
		}

		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const reportFile = path.join(reportDir, `comprehensive-test-report-${timestamp}.json`);
		
		fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
		console.log(`\n📄 Detailed report saved to: ${reportFile}`);
	}

	private printSummary(report: TestReport): void {
		console.log('\n' + '='.repeat(60));
		console.log('📊 COMPREHENSIVE TEST SUMMARY');
		console.log('='.repeat(60));
		console.log(report.summary);
		console.log('='.repeat(60));

		// Print detailed results
		console.log('\n📋 Detailed Results:');
		report.results.forEach(result => {
			const status = result.passed ? '✅' : '❌';
			const coverage = result.coverage ? ` (${result.coverage.toFixed(1)}% coverage)` : '';
			console.log(`${status} ${result.suite}: ${result.duration.toFixed(2)}ms${coverage}`);
		});

		// Performance analysis
		const slowTests = report.results.filter(r => r.duration > 1000);
		if (slowTests.length > 0) {
			console.log('\n⚠️  Slow Test Suites (>1000ms):');
			slowTests.forEach(test => {
				console.log(`   ${test.suite}: ${test.duration.toFixed(2)}ms`);
			});
		}

		// Coverage analysis
		const lowCoverageTests = report.results.filter(r => r.coverage && r.coverage < 80);
		if (lowCoverageTests.length > 0) {
			console.log('\n⚠️  Low Coverage Test Suites (<80%):');
			lowCoverageTests.forEach(test => {
				console.log(`   ${test.suite}: ${test.coverage?.toFixed(1)}%`);
			});
		}
	}
}

// CLI interface
if (require.main === module) {
	const runner = new ComprehensiveTestRunner();
	
	runner.runAllTests()
		.then(report => {
			const exitCode = report.failedTests > 0 ? 1 : 0;
			process.exit(exitCode);
		})
		.catch(error => {
			console.error('❌ Test runner failed:', error);
			process.exit(1);
		});
}

export { ComprehensiveTestRunner, TestResult, TestReport };