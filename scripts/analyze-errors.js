#!/usr/bin/env node

/**
 * TypeScript Error Analysis Tool
 * Analyzes TypeScript compilation errors and categorizes them for systematic fixing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TypeScriptErrorAnalyzer {
	constructor() {
		this.errors = [];
		this.categories = {
			'implicit-any': [],
			'missing-property': [],
			'type-mismatch': [],
			'missing-types': [],
			'function-signature': [],
			'other': []
		};
	}

	/**
	 * Run TypeScript compiler and capture errors
	 */
	analyzeErrors() {
		console.log('🔍 Analyzing TypeScript errors...');
		
		try {
			// Run TypeScript compiler and capture output
			execSync('npx tsc --noEmit', { stdio: 'pipe' });
			console.log('✅ No TypeScript errors found!');
			return;
		} catch (error) {
			const output = error.stdout.toString();
			this.parseErrors(output);
		}
	}

	/**
	 * Parse TypeScript compiler output and extract errors
	 */
	parseErrors(output) {
		const lines = output.split('\n');
		let currentError = null;

		for (const line of lines) {
			// Match error pattern: file.ts(line,col): error TSxxxx: message
			const errorMatch = line.match(/^(.+\.ts)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
			
			if (errorMatch) {
				if (currentError) {
					this.categorizeError(currentError);
				}
				
				currentError = {
					file: errorMatch[1],
					line: parseInt(errorMatch[2]),
					column: parseInt(errorMatch[3]),
					code: errorMatch[4],
					message: errorMatch[5],
					fullMessage: line
				};
			} else if (currentError && line.trim()) {
				// Additional context for the error
				currentError.fullMessage += '\n' + line;
			}
		}
		
		if (currentError) {
			this.categorizeError(currentError);
		}
	}

	/**
	 * Categorize errors by type for systematic fixing
	 */
	categorizeError(error) {
		this.errors.push(error);

		if (error.code === 'TS7006' || error.message.includes('implicitly has an \'any\' type')) {
			this.categories['implicit-any'].push(error);
		} else if (error.code === 'TS2339' || error.message.includes('does not exist on type')) {
			this.categories['missing-property'].push(error);
		} else if (error.code === 'TS2322' || error.code === 'TS2345' || error.message.includes('not assignable')) {
			this.categories['type-mismatch'].push(error);
		} else if (error.code === 'TS7016' || error.message.includes('Could not find a declaration file')) {
			this.categories['missing-types'].push(error);
		} else if (error.code === 'TS2769' || error.message.includes('No overload matches')) {
			this.categories['function-signature'].push(error);
		} else {
			this.categories['other'].push(error);
		}
	}

	/**
	 * Generate analysis report
	 */
	generateReport() {
		console.log('\n📊 TypeScript Error Analysis Report');
		console.log('=====================================');
		console.log(`Total Errors: ${this.errors.length}`);
		console.log('');

		// Category breakdown
		Object.entries(this.categories).forEach(([category, errors]) => {
			if (errors.length > 0) {
				console.log(`${category.toUpperCase()}: ${errors.length} errors`);
				
				// Show top 3 files with most errors in this category
				const fileGroups = {};
				errors.forEach(error => {
					const fileName = path.basename(error.file);
					fileGroups[fileName] = (fileGroups[fileName] || 0) + 1;
				});
				
				const topFiles = Object.entries(fileGroups)
					.sort(([,a], [,b]) => b - a)
					.slice(0, 3);
				
				topFiles.forEach(([file, count]) => {
					console.log(`  • ${file}: ${count} errors`);
				});
				console.log('');
			}
		});

		// Priority recommendations
		console.log('🎯 Priority Recommendations:');
		console.log('============================');
		
		if (this.categories['missing-types'].length > 0) {
			console.log('1. Install missing type definitions first');
		}
		
		if (this.categories['implicit-any'].length > 0) {
			console.log('2. Fix implicit any errors (easiest to resolve)');
		}
		
		if (this.categories['missing-property'].length > 0) {
			console.log('3. Create proper interfaces for missing properties');
		}
		
		if (this.categories['type-mismatch'].length > 0) {
			console.log('4. Resolve type mismatches (may require refactoring)');
		}

		// Generate detailed report file
		this.generateDetailedReport();
	}

	/**
	 * Generate detailed report file
	 */
	generateDetailedReport() {
		const report = {
			timestamp: new Date().toISOString(),
			totalErrors: this.errors.length,
			categories: {},
			errors: this.errors
		};

		Object.entries(this.categories).forEach(([category, errors]) => {
			report.categories[category] = {
				count: errors.length,
				files: [...new Set(errors.map(e => e.file))],
				topErrors: errors.slice(0, 5).map(e => ({
					file: e.file,
					line: e.line,
					message: e.message
				}))
			};
		});

		fs.writeFileSync('typescript-errors-report.json', JSON.stringify(report, null, 2));
		console.log('\n📄 Detailed report saved to: typescript-errors-report.json');
	}
}

// Run the analyzer
const analyzer = new TypeScriptErrorAnalyzer();
analyzer.analyzeErrors();
analyzer.generateReport();