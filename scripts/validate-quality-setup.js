#!/usr/bin/env node

/**
 * Code Quality Setup Validation Script
 * Validates that all code quality tools are properly configured
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
	'.eslintrc.json',
	'.prettierrc',
	'tsconfig.json',
	'tsconfig.build.json',
	'tsconfig.test.json',
	'jest.config.js',
	'.husky/pre-commit',
	'.github/workflows/code-quality.yml',
	'src/setupTests.ts'
];

const requiredPackages = [
	'@typescript-eslint/eslint-plugin',
	'@typescript-eslint/parser',
	'eslint',
	'prettier',
	'husky',
	'lint-staged',
	'jest',
	'typescript'
];

console.log('🔍 Validating Code Quality Setup...\n');

// Check required files
console.log('📁 Checking required configuration files:');
let missingFiles = [];
requiredFiles.forEach(file => {
	if (fs.existsSync(file)) {
		console.log(`✅ ${file}`);
	} else {
		console.log(`❌ ${file} - MISSING`);
		missingFiles.push(file);
	}
});

// Check package.json for required dependencies
console.log('\n📦 Checking required packages:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
let missingPackages = [];

requiredPackages.forEach(pkg => {
	if (allDeps[pkg]) {
		console.log(`✅ ${pkg} (${allDeps[pkg]})`);
	} else {
		console.log(`❌ ${pkg} - MISSING`);
		missingPackages.push(pkg);
	}
});

// Check npm scripts
console.log('\n🔧 Checking npm scripts:');
const requiredScripts = [
	'lint',
	'lint-fix',
	'format',
	'format-check',
	'type-check',
	'quality-check',
	'quality-fix',
	'test',
	'jest'
];

let missingScripts = [];
requiredScripts.forEach(script => {
	if (packageJson.scripts && packageJson.scripts[script]) {
		console.log(`✅ ${script}`);
	} else {
		console.log(`❌ ${script} - MISSING`);
		missingScripts.push(script);
	}
});

// Summary
console.log('\n📊 Validation Summary:');
const totalIssues = missingFiles.length + missingPackages.length + missingScripts.length;

if (totalIssues === 0) {
	console.log('🎉 All code quality tools are properly configured!');
	console.log('\n🚀 You can now run:');
	console.log('  npm run quality-check  - Check code quality');
	console.log('  npm run quality-fix    - Fix code quality issues');
	console.log('  npm run test           - Run tests with coverage');
	process.exit(0);
} else {
	console.log(`⚠️  Found ${totalIssues} configuration issues:`);
	if (missingFiles.length > 0) {
		console.log(`   - ${missingFiles.length} missing files`);
	}
	if (missingPackages.length > 0) {
		console.log(`   - ${missingPackages.length} missing packages`);
	}
	if (missingScripts.length > 0) {
		console.log(`   - ${missingScripts.length} missing scripts`);
	}
	console.log('\nPlease fix these issues before proceeding.');
	process.exit(1);
}