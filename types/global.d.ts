interface Window {
	// Global debugging object added to `window.AB`.
	AB: any;
}

// Audio file imports
declare module '*.ogg' {
	const content: string;
	export default content;
}
