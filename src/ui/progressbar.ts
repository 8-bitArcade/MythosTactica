
import { $ } from '../script';

type ProgressBarOptions = {
	height: number;
	width: number;
	color: string;
	$bar: HTMLElement | null;
};

export class ProgressBar {
	$bar: HTMLElement | null;
	$preview: HTMLElement | null;
	$current: HTMLElement | null;
	width: number;
	height: number;
	color: string;
	constructor(opts: Partial<ProgressBarOptions>) {
		const defaultOpts: ProgressBarOptions = {
			height: 316,
			width: 7,
			color: 'red',
			$bar: null,
		};

		opts = Object.assign({}, defaultOpts, opts);
		// Replace jQuery extend with Object.assign
		Object.assign(this, opts);

		// Create and append previewbar element
		const previewDiv = document.createElement('div');
		previewDiv.className = 'previewbar';
		this.$bar?.appendChild(previewDiv);
		this.$preview = previewDiv;

		// Create and append currentbar element
		const currentDiv = document.createElement('div');
		currentDiv.className = 'currentbar';
		this.$bar?.appendChild(currentDiv);
		this.$current = currentDiv;

		this.setSize(1);
	}
	/**
	 * @param{number} percentage - Size between 0 and 1
	 */
	setSize(percentage: number) {
		$.css(this.$bar, {
			width: this.width + 'px',
			height: (this.height * percentage) + 'px',
			border: 'solid 1px',
			'border-color': 'transparent',
		});

		$.css(this.$current, {
			width: this.width + 'px',
			height: (this.height * percentage) + 'px',
			'background-color': this.color,
			'background-image': 'none',
		});
	}
	/**
	 * @param{number} percentage - size between 0 and 1
	 */
	animSize(percentage: number) {
		// Use CSS transitions instead of jQuery transition
		$.css(this.$bar, {
			transition: 'all 500ms linear',
			width: this.width + 'px',
			height: (this.height * percentage) + 'px',
		});

		$.css(this.$current, {
			transition: 'all 500ms linear',
			width: this.width + 'px',
			height: (this.height * percentage) + 'px',
			'background-color': this.color,
			'background-image': 'none',
		});
	}
	/**
	 * @param{number} percentage - size between 0 and 1
	 */
	previewSize(percentage: number) {
		$.css(this.$preview, {
			width: this.width + 'px',
			height: (this.height * percentage) + 'px',
			'background-image': 'none',
		});
	}
	// Sets element's background-image with horizontal 2px stripe pattern
	setStripePattern(element: HTMLElement | null) {
		$.css(element, {
			'background-image':
				'linear-gradient(0deg, #000000 25%,' +
				this.color +
				' 25%,' +
				this.color +
				' 50%, #000000 50%, #000000 75%,' +
				this.color +
				' 75%,' +
				this.color +
				' 100%)',

			'background-size': '8.00px 8.00px',
		});
	}

	// When enough progress is available to use
	setAvailableStyle() {
		this.setStripePattern(this.$preview);
	}
	// When not enough progress is available to use
	setUnavailableStyle() {
		// Border only added to surround the black preview bar indicating missing progress
		$.css(this.$bar, {
			'border-color': this.color,
		});

		$.css(this.$preview, {
			'background-image': 'none',
			'background-color': 'black',
		});

		this.setStripePattern(this.$current);
	}
}
