/* eslint-disable @typescript-eslint/no-var-requires */
// Use .env configuration in webpack.config.js
require('dotenv-defaults').config({
	default: './.env.example',
});

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');

{
	// NOTE: Generate asset lists.
	// Was using Webpack's require.context to generate asset lists, but
	// it appears to have a memory leak that causes the dev server to crash after
	// a few consecutive builds.
	const fs = require('fs');
	const glob = require('glob');
	const toObjString = (paths) =>
		'{' + paths.map((path) => `"${path}":require("${path}")`).join(',') + '}';
	const globOptions = { ignore: ['**/*.js', '**/*.ts', '**/*.md'], posix: true };
	const phaserAutoloadAssets = toObjString(glob.sync('assets/autoload/phaser/**/*.*', globOptions));
	const allAssets = toObjString(glob.sync('assets/**/*.*', globOptions));

	fs.writeFileSync(
		'assets/index.js',
		`// NOTE: Generated at build time by ${path.basename(__filename)}.
// Do not add to this file.
// Any changes to this file will be overwritten when the project is rebuilt.
// ---------------------------------------------------------------------------
// Webpack's require.context would make this unnecessary, 
// however, it has performance issues https://github.com/webpack/webpack/issues/13636
// and it appears to have a memory leak that makes the webpack dev server crash after a few builds. 
// require.context was last tested July 15, 2023.

export const phaserAutoloadAssetPaths=${phaserAutoloadAssets}

export const assetPaths=${allAssets}

`,
	);
}

// Expose mode argument to unify our config options
module.exports = (env, argv) => {
	const production = (argv && argv.mode === 'production') || process.env.NODE_ENV === 'production';
	const enableServiceWorker = process.env.ENABLE_SERVICE_WORKER === 'true' ? true : false;
	return {
		entry: {
			app: ['babel-polyfill', path.resolve(__dirname, 'src', 'script.ts')],
		},
		output: {
			path: path.resolve(__dirname, 'deploy'),
			filename: '[name].[contenthash].bundle.js',
			clean: true, // NOTE: Clean the output folder before each build.
			assetModuleFilename: () => {
				if (production) {
					return 'assets/[contenthash].[ext]';
				}
				return '[path][name].[ext]';
			},
		},
		devtool: production ? 'source-map' : 'inline-source-map',		module: {
			rules: [
				{ test: /\.js$/, use: ['babel-loader'], exclude: /node_modules/ },
				{
					test: /\.ts$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				},
				{
					test: /\.html$/,
					use: ['html-loader'],
				},
				{
					test: /\.less$/,
					use: ['style-loader', 'css-loader', 'less-loader'],
				},
				{
					test: /\.css$/,
					use: ['style-loader', 'css-loader'],
				},
				{
					test: /\.(png|jpg|gif|svg|ogg|ico|cur|woff|woff2)$/,
					type: 'asset/resource',
				},			],
		},
		resolve: {
			alias: {
				assets: path.resolve(__dirname, 'assets/'),
				modules: path.join(__dirname, 'node_modules'),
			},
			extensions: ['.ts', '.js'],
			fallback: {
				fs: false,
			},
		},		devServer: {
			static: process.env.PUBLIC_PATH ? process.env.PUBLIC_PATH : './',
			port: 8080,
			proxy: {
				'/api': '159.65.232.104:7350',
			},
			allowedHosts: ['localhost', '.gitpod.io'],
		},		performance: {
			// Increase asset size limits for music files and other large assets
			maxAssetSize: 5000000, // 5MB
			maxEntrypointSize: 5000000, // 5MB
			// Only show warnings for assets that are actually too large
			assetFilter: function(assetFilename) {
				// Don't warn about music files, images, or fonts
				return !/\.(ogg|mp3|wav|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i.test(assetFilename);
			}
		},
		plugins: [
			new CopyPlugin({
				patterns: [{ from: 'static' }],
			}),			new HtmlWebpackPlugin({
				template: path.resolve(__dirname, 'src', 'index.ejs'),
				favicon: path.resolve(__dirname, 'static', 'favicon.png'),
				production,
				enableServiceWorker,
			}),
			new Dotenv({
				defaults: './.env.example',
			}),
		],
	};
};
