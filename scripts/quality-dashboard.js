#!/usr/bin/env node

/**
 * Code Quality Dashboard
 * Provides comprehensive code quality metrics and recommendations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CodeQualityDashboard {
	constructor() {
		this.metrics = {
			typescript: { errors: 0, warnings: 0 },
			eslint: { errors: 0, warnings: 0 },
			prettier: { issues: 0 },
			tests: { passed: 0, failed: 0, coverage: 0 },
			build: { success: false, time: 0 }
		};
	}

	/**
	 * Run all quality checks
	 */
	async runQualityChecks() {
		console.log('🚀 Running Code Quality Dashboard...\n');

		await this.checkTypeScript();
		await this.checkESLint();
		await this.checkPrettier();
		await this.checkTests();
		await this.checkBuild();
		
		this.generateDashboard();
	}

	/**
	 * Check TypeScript compilation
	 */
	async checkTypeScript() {
		console.log('📝 Checking TypeScript...');
		
		try {
			execSync('npx tsc --noEmit', { stdio: 'pipe' });
			this.metrics.typescript = { errors: 0, warnings: 0 };
			console.log('✅ TypeScript: No errors');
		} catch (error) {
			const output = error.stdout.toString();
			const errorCount = (output.match(/error TS\d+:/g) || []).length;
			this.metrics.typescript = { errors: errorCount, warnings: 0 };
			console.log(`❌ TypeScript: ${errorCount} errors`);
		}
	}

	/**
	 * Check ESLint
	 */
	async checkESLint() {
		console.log('🔍 Checking ESLint...');
		
		try {
			const output = execSync('npm run lint', { stdio: 'pipe' }).toString();
			this.metrics.eslint = { errors: 0, warnings: 0 };
			console.log('✅ ESLint: No issues');
		} catch (error) {
			const output = error.stdout.toString();
			const errorCount = (output.match(/\d+ error/g) || []).length;
			const warningCount = (output.match(/\d+ warning/g) || []).length;
			this.metrics.eslint = { errors: errorCount, warnings: warningCount };
			console.log(`❌ ESLint: ${errorCount} errors, ${warningCount} warnings`);
		}
	}

	/**
	 * Check Prettier formatting
	 */
	async checkPrettier() {
		console.log('💅 Checking Prettier...');
		
		try {
			execSync('npm run format-check', { stdio: 'pipe' });
			this.metrics.prettier = { issues: 0 };
			console.log('✅ Prettier: All files formatted correctly');
		} catch (error) {
			const output = error.stdout.toString();
			const issueCount = (output.match(/\[warn\]/g) || []).length;
			this.metrics.prettier = { issues: issueCount };
			console.log(`❌ Prettier: ${issueCount} formatting issues`);
		}
	}

	/**
	 * Check tests
	 */
	async checkTests() {
		console.log('🧪 Checking Tests...');
		
		try {
			const output = execSync('npm run jest -- --passWithNoTests', { stdio: 'pipe' }).toString();
			// Parse Jest output for test results
			const passedMatch = output.match(/(\d+) passed/);
			const failedMatch = output.match(/(\d+) failed/);
			const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
			
			this.metrics.tests = {
				passed: passedMatch ? parseInt(passedMatch[1]) : 0,
				failed: failedMatch ? parseInt(failedMatch[1]) : 0,
				coverage: coverageMatch ? parseFloat(coverageMatch[1]) : 0
			};
			
			console.log(`✅ Tests: ${this.metrics.tests.passed} passed, ${this.metrics.tests.failed} failed`);
		} catch (error) {
			this.metrics.tests = { passed: 0, failed: 1, coverage: 0 };
			console.log('❌ Tests: Failed to run');
		}
	}

	/**
	 * Check build
	 */
	async checkBuild() {
		console.log('🏗️  Checking Build...');
		
		const startTime = Date.now();
		try {
			execSync('npm run build', { stdio: 'pipe' });
			const buildTime = Date.now() - startTime;
			this.metrics.build = { success: true, time: buildTime };
			console.log(`✅ Build: Successful (${buildTime}ms)`);
		} catch (error) {
			const buildTime = Date.now() - startTime;
			this.metrics.build = { success: false, time: buildTime };
			console.log(`❌ Build: Failed (${buildTime}ms)`);
		}
	}

	/**
	 * Generate quality dashboard
	 */
	generateDashboard() {
		console.log('\n📊 Code Quality Dashboard');
		console.log('==========================');
		
		// Calculate overall score
		const score = this.calculateQualityScore();
		const grade = this.getQualityGrade(score);
		
		console.log(`Overall Quality Score: ${score}/100 (${grade})`);
		console.log('');
		
		// Detailed metrics
		console.log('📈 Detailed Metrics:');
		console.log(`TypeScript Errors: ${this.metrics.typescript.errors}`);
		console.log(`ESLint Issues: ${this.metrics.eslint.errors + this.metrics.eslint.warnings}`);
		console.log(`Prettier Issues: ${this.metrics.prettier.issues}`);
		console.log(`Test Coverage: ${this.metrics.tests.coverage.toFixed(1)}%`);
		console.log(`Build Status: ${this.metrics.build.success ? 'Success' : 'Failed'}`);
		console.log('');
		
		// Recommendations
		this.generateRecommendations();
		
		// Save report
		this.saveReport(score, grade);
	}

	/**
	 * Calculate overall quality score
	 */
	calculateQualityScore() {
		let score = 100;
		
		// TypeScript errors (40% weight)
		score -= Math.min(this.metrics.typescript.errors * 2, 40);
		
		// ESLint issues (20% weight)
		score -= Math.min((this.metrics.eslint.errors * 2 + this.metrics.eslint.warnings), 20);
		
		// Prettier issues (10% weight)
		score -= Math.min(this.metrics.prettier.issues, 10);
		
		// Test coverage (20% weight)
		score -= Math.max(0, (80 - this.metrics.tests.coverage) * 0.25);
		
		// Build success (10% weight)
		if (!this.metrics.build.success) {
			score -= 10;
		}
		
		return Math.max(0, Math.round(score));
	}

	/**
	 * Get quality grade based on score
	 */
	getQualityGrade(score) {
		if (score >= 90) return 'A';
		if (score >= 80) return 'B';
		if (score >= 70) return 'C';
		if (score >= 60) return 'D';
		return 'F';
	}

	/**
	 * Generate improvement recommendations
	 */
	generateRecommendations() {
		console.log('💡 Recommendations:');
		
		if (this.metrics.typescript.errors > 0) {
			console.log(`• Fix ${this.metrics.typescript.errors} TypeScript errors (highest priority)`);
		}
		
		if (this.metrics.eslint.errors > 0) {
			console.log(`• Resolve ${this.metrics.eslint.errors} ESLint errors`);
		}
		
		if (this.metrics.eslint.warnings > 0) {
			console.log(`• Address ${this.metrics.eslint.warnings} ESLint warnings`);
		}
		
		if (this.metrics.prettier.issues > 0) {
			console.log(`• Fix ${this.metrics.prettier.issues} formatting issues with 'npm run format'`);
		}
		
		if (this.metrics.tests.coverage < 80) {
			console.log(`• Increase test coverage from ${this.metrics.tests.coverage.toFixed(1)}% to 80%`);
		}
		
		if (!this.metrics.build.success) {
			console.log('• Fix build errors before proceeding');
		}
		
		console.log('');
	}

	/**
	 * Save quality report
	 */
	saveReport(score, grade) {
		const report = {
			timestamp: new Date().toISOString(),
			score,
			grade,
			metrics: this.metrics,
			recommendations: this.generateRecommendationsList()
		};
		
		fs.writeFileSync('code-quality-report.json', JSON.stringify(report, null, 2));
		console.log('📄 Quality report saved to: code-quality-report.json');
	}

	/**
	 * Generate recommendations list
	 */
	generateRecommendationsList() {
		const recommendations = [];
		
		if (this.metrics.typescript.errors > 0) {
			recommendations.push({
				priority: 'high',
				category: 'typescript',
				action: `Fix ${this.metrics.typescript.errors} TypeScript errors`,
				command: 'npm run type-check'
			});
		}
		
		if (this.metrics.eslint.errors > 0) {
			recommendations.push({
				priority: 'high',
				category: 'eslint',
				action: `Resolve ${this.metrics.eslint.errors} ESLint errors`,
				command: 'npm run lint-fix'
			});
		}
		
		if (this.metrics.prettier.issues > 0) {
			recommendations.push({
				priority: 'medium',
				category: 'formatting',
				action: `Fix ${this.metrics.prettier.issues} formatting issues`,
				command: 'npm run format'
			});
		}
		
		return recommendations;
	}
}

// Run the dashboard
const dashboard = new CodeQualityDashboard();
dashboard.runQualityChecks().catch(console.error);