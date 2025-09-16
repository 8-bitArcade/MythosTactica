export class BufferLoader {
	context: AudioContext;
	urlList: string[];
	onload: (bufferList: AudioBuffer[]) => void;
	bufferList: AudioBuffer[];
	loadCount: number;

	constructor(context: AudioContext, urlList: string[], callback: (bufferList: AudioBuffer[]) => void) {
		this.context = context;
		this.urlList = urlList;
		this.onload = callback;
		this.bufferList = [];
		this.loadCount = 0;
	}

	loadBuffer(url: string, index: number) {
		// Load buffer asynchronously
		const request = new XMLHttpRequest();

		request.open('GET', url, true);
		request.responseType = 'arraybuffer';
		request.timeout = 10000; // 10 second timeout

		request.onload = () => {
			if (request.status !== 200) {
				console.error(`[BufferLoader] HTTP error ${request.status} loading ${url}`);
				this.handleLoadError(url, index, `HTTP ${request.status}`);
				return;
			}

			if (!request.response || request.response.byteLength === 0) {
				console.error(`[BufferLoader] Empty response for ${url}`);
				this.handleLoadError(url, index, 'Empty response');
				return;
			}

			// Asynchronously decode the audio file data in request.response
			this.context.decodeAudioData(
				request.response,
				(buffer) => {
					if (!buffer) {
						console.error(`[BufferLoader] Failed to decode audio data for ${url}`);
						this.handleLoadError(url, index, 'Decode failed');
						return;
					}

					console.log(`[BufferLoader] Successfully loaded and decoded ${url}`);
					this.bufferList[index] = buffer;
					if (++this.loadCount == this.urlList.length) {
						this.onload(this.bufferList);
					}
				},
				(error) => {
					console.error(`[BufferLoader] decodeAudioData error for ${url}:`, error);
					this.handleLoadError(url, index, `Decode error: ${error.message || error}`);
				},
			);
		};

		request.onerror = () => {
			console.error(`[BufferLoader] Network error loading ${url}`);
			this.handleLoadError(url, index, 'Network error');
		};

		request.ontimeout = () => {
			console.error(`[BufferLoader] Timeout loading ${url}`);
			this.handleLoadError(url, index, 'Timeout');
		};

		try {
			request.send();
		} catch (error) {
			console.error(`[BufferLoader] Exception sending request for ${url}:`, error);
			this.handleLoadError(url, index, `Send error: ${error.message}`);
		}
	}

	private handleLoadError(url: string, index: number, errorMessage: string) {
		console.error(`[BufferLoader] Failed to load ${url}: ${errorMessage}`);
		
		// Continue with null buffer to prevent hanging
		this.bufferList[index] = null;
		if (++this.loadCount == this.urlList.length) {
			this.onload(this.bufferList);
		}
	}

	load() {
		for (let i = 0, len = this.urlList.length; i < len; ++i) {
			this.loadBuffer(this.urlList[i], i);
		}
	}
}
