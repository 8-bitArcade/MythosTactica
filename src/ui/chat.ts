import * as str from '../utility/string';
import { $ } from '../script';

interface ChatMessage {
	message: string;
	amount: number;
	time: string | null;
	class: string;
	DOMObject: HTMLElement;
}

interface SuppressedMessage {
	pattern: RegExp;
	times: number;
}

export class Chat {
	game: any;
	$chat: HTMLElement;
	$content: HTMLElement;
	messages: ChatMessage[];
	isOpen: boolean;
	messagesToSuppress: SuppressedMessage[];

	/**
	 * Chat/Log Functions
	 * @constructor
	 */
	constructor(game: any) {
		this.game = game;
		this.$chat = $.get('#chat') as HTMLElement;
		this.$content = $.get('#chatcontent') as HTMLElement;
		
		$.on(this.$chat, 'click', () => {
			this.toggle();
		});
		
		$.on(this.$chat, 'mouseenter', () => {
			this.peekOpen();
		});
		
		$.on(this.$chat, 'mouseleave', () => {
			this.peekClose();
		});

		this.messages = [];
		this.isOpen = false;
		this.messagesToSuppress = [];

		const elements = $.get('#combatwrapper, #toppanel, #dash, #endscreen');
		$.on(elements, 'click', () => {
			this.hide();
		});

		// Events
		this.game.signals.ui.add(this._handleUiEvent, this);
	}

	/**
	 * Handle events on the "ui" channel.
	 *
	 * @param {string} message Event name.
	 * @param {object} payload Event payload.
	 */
	_handleUiEvent(message, payload) {
		if (
			message === 'toggleDash' ||
			message === 'toggleScore' ||
			message === 'toggleMusicPlayer' ||
			message === 'toggleMetaPowers' ||
			message === 'closeInterfaceScreens'
		) {
			this.hide();
		}
	}
	show() {
		$.addClass(this.$chat, 'focus');
		this.isOpen = true;
	}

	hide() {
		$.removeClass(this.$chat, 'focus');
		this.isOpen = false;
	}

	toggle() {
		$.toggleClass(this.$chat, 'focus');
		if ($.hasClass(this.$chat, 'peek')) {
			$.removeClass(this.$chat, 'peek');
		}
		// Scroll to bottom - using native DOM API since we don't have jQuery parent/height methods
		if (this.$content.parentElement) {
			this.$content.parentElement.scrollTop = this.$content.scrollHeight;
		}
		this.isOpen = !this.isOpen;
	}

	peekOpen() {
		if (!$.hasClass(this.$chat, 'focus')) {
			$.addClass(this.$chat, 'peek');
			if (this.$content.parentElement) {
				this.$content.parentElement.scrollTop = this.$content.scrollHeight;
			}
			this.isOpen = !this.isOpen;
		}
	}

	peekClose() {
		if ($.hasClass(this.$chat, 'peek')) {
			$.removeClass(this.$chat, 'peek');
		}
	}	getCurrentTime() {
		// Use PlayerManager's startMatchTime property and add defensive check
		const startMatchTime = this.game.playerManager?.startMatchTime;
		if (!startMatchTime) {
			// Fallback to current time if startMatchTime is not available
			return '00:00:00';
		}
		
		const currentTime = new Date(Date.now() - startMatchTime.getTime());
		return (
			str.zfill(currentTime.getUTCHours(), 2) +
			':' +
			str.zfill(currentTime.getMinutes(), 2) +
			':' +
			str.zfill(currentTime.getSeconds(), 2)
		);
	}

	createHTMLTemplate(msg, amount, msgTime = null, ifOuter = true, htmlClass = '') {
		const timeTemplate = msgTime ? '<i>' + msgTime + '</i> ' : '',
			amountTemplate = amount > 1 ? ' [ ' + amount + 'x ]' : '';

		if (ifOuter) {
			return "<p class='" + htmlClass + "'>" + timeTemplate + msg + amountTemplate + '</p>';
		} else {
			return timeTemplate + msg + amountTemplate;
		}
	}

	addMsg(msg, htmlClass, ifNoTimestamp = false) {
		const messagesNo = this.messages.length;
		const currentTime = ifNoTimestamp ? null : this.getCurrentTime();

		const suppressedMessageIndex = this.messagesToSuppress.findIndex((message) =>
			message.pattern.test(msg),
		);
		if (suppressedMessageIndex > -1) {
			const message = this.messagesToSuppress[suppressedMessageIndex];
			message.times = message.times - 1;

			if (message.times <= 0) {
				this.messagesToSuppress.splice(suppressedMessageIndex, 1);
			}

			return;
		}
		// Check if the last message was the same as the current one
		if (this.messages[messagesNo - 1] && this.messages[messagesNo - 1].message === msg) {
			const lastMessage = this.messages[messagesNo - 1];
			lastMessage.amount++;
			lastMessage.time = currentTime;
			$.html(lastMessage.DOMObject, this.createHTMLTemplate(msg, lastMessage.amount, currentTime, false));
		} else {
			// Create new DOM element
			const newElement = document.createElement('div');
			newElement.innerHTML = this.createHTMLTemplate(msg, 1, currentTime, true, htmlClass);
			const messageElement = newElement.firstElementChild as HTMLElement;
			
			this.messages.push({
				message: msg,
				amount: 1,
				time: currentTime,
				class: htmlClass,
				DOMObject: messageElement,
			});

			// Append the last message's DOM object
			this.$content.appendChild(this.messages[this.messages.length - 1].DOMObject);
		}

		// Scroll to bottom
		if (this.$content.parentElement) {
			this.$content.parentElement.scrollTop = this.$content.scrollHeight;
		}
	}

	/**
	 * Suppress a message from being output to the chat log.
	 *
	 * @param {RegExp} pattern If the chat log message matches this pattern, it will be suppressed.
	 * @param {number} times Suppress the message this many times.
	 */
	suppressMessage(pattern, times = 1) {
		this.messagesToSuppress.push({
			pattern,
			times,
		});
	}
}
