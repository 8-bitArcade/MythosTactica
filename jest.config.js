module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	roots: ['<rootDir>/src'],
	testMatch: [
		'**/__tests__/**/*.+(ts|tsx|js)',
		'**/*.(test|spec).+(ts|tsx|js)'
	],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest'
	},
	collectCoverageFrom: [
		'src/**/*.{ts,tsx}',
		'!src/**/*.d.ts',
		'!src/**/__tests__/**',
		'!src/**/__mocks__/**',
		'!src/**/index.ts'
	],
	coverageDirectory: 'coverage',
	coverageReporters: [
		'text',
		'lcov',
		'html',
		'json'
	],
	coverageThreshold: {
		global: {
			branches: 70,
			functions: 75,
			lines: 80,
			statements: 80
		}
	},
	setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
	moduleNameMapping: {
		'^@/(.*)$': '<rootDir>/src/$1'
	},
	testTimeout: 10000,
	verbose: true,
	errorOnDeprecated: true
};