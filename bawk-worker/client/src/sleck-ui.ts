type SleckMessage = {
	author: "you" | "stephanie";
	hearted?: boolean;
	id: number;
	text: string;
};

type SleckConversationMessage = {
	role: "assistant" | "user";
	content: string;
};

type SleckApiResponse = {
	message: string;
	hearted: boolean;
	ended: boolean;
	history: SleckConversationMessage[];
};

type SleckUiOptions = {
	closeOnEscape?: boolean;
	maxUserMessages?: number;
	onClose?: () => void;
};

const SLECK_BACKGROUND_URL = "/assets/images/sleck-background.webp";
const STEPHANIE_AVATAR_URL = "/assets/images/stephanie.webp";
const SLECK_RECEIVED_SOUND_URL = "/assets/sounds/sleck-received.mp3";
const SLECK_HEART_SOUND_URL = "/assets/sounds/sleck-heart.mp3";
const INITIAL_STEPHANIE_MESSAGE = "Hey! I was just thinking about you. What are you doing?";
const PLOT_TWIST_MESSAGE =
	"Uh, something really strange is going on! Can you help me figure it out? I'm in the shipping docks. Come find me! 😉";
const DEFAULT_MAX_USER_MESSAGES = 15;
const AUTO_PLOT_TWIST_TYPING_DELAY_MS = 3000;

let stylesInstalled = false;

function installSleckStyles() {
	if (stylesInstalled) {
		return;
	}
	stylesInstalled = true;
	const style = document.createElement("style");
	style.textContent = `
		.sleck-desktop {
			position: relative;
			width: min(100%, calc((100vh - 36px) * 4 / 3));
			max-height: 100%;
			aspect-ratio: 4 / 3;
			background: center / 100% 100% no-repeat url("${SLECK_BACKGROUND_URL}");
			box-shadow: 0 20px 80px rgba(0, 0, 0, 0.58);
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
			color: #f6f7fb;
			user-select: none;
		}

		.sleck-desktop[hidden] {
			display: none;
		}

		.sleck-messages {
			position: absolute;
			left: 29.0%;
			top: 14.7%;
			width: 69.0%;
			height: 73.5%;
			overflow: auto;
			display: flex;
			flex-direction: column;
			gap: clamp(7px, 0.75vw, 11px);
			padding: clamp(14px, 1.8vw, 24px);
			scrollbar-color: rgba(255, 38, 126, 0.55) rgba(8, 13, 17, 0.8);
			scrollbar-width: thin;
			overflow-anchor: none;
		}

		.sleck-message {
			display: grid;
			grid-template-columns: clamp(30px, 3.3vw, 44px) minmax(0, auto);
			gap: clamp(8px, 0.9vw, 12px);
			align-items: end;
			max-width: min(72%, 680px);
		}

		.sleck-message.you {
			align-self: end;
			grid-template-columns: minmax(0, auto);
		}

		.sleck-avatar,
		.sleck-avatar-fallback {
			width: clamp(30px, 3.3vw, 44px);
			height: clamp(30px, 3.3vw, 44px);
			border-radius: 50%;
			background: linear-gradient(145deg, #fe3c90, #3ec7ff);
			box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.16), 0 6px 18px rgba(0, 0, 0, 0.32);
		}

		.sleck-avatar {
			object-fit: cover;
		}

		.sleck-avatar-fallback {
			display: grid;
			place-items: center;
			color: #fff;
			font-weight: 800;
		}

		.sleck-bubble {
			position: relative;
			min-width: 0;
			border: 1px solid rgba(255, 255, 255, 0.11);
			border-radius: 14px;
			padding: clamp(9px, 1vw, 13px) clamp(11px, 1.3vw, 16px);
			background: rgba(19, 26, 31, 0.88);
			color: rgba(246, 247, 251, 0.92);
			font-size: clamp(12px, 1.17vw, 16px);
			line-height: 1.34;
			overflow-wrap: anywhere;
			white-space: pre-line;
			box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
		}

		.sleck-message.you .sleck-bubble {
			background: linear-gradient(135deg, rgba(255, 38, 126, 0.95), rgba(225, 32, 112, 0.95));
			color: #fff;
		}

		.sleck-message.hearted .sleck-bubble::after {
			content: "\\2665";
			position: absolute;
			right: -8px;
			bottom: -10px;
			width: clamp(18px, 1.9vw, 25px);
			height: clamp(18px, 1.9vw, 25px);
			display: grid;
			place-items: center;
			border-radius: 50%;
			background: #fff;
			color: #ff267e;
			font-size: clamp(12px, 1.25vw, 17px);
			font-weight: 900;
			box-shadow: 0 5px 16px rgba(0, 0, 0, 0.32);
		}

		.sleck-typing {
			font-style: italic;
			animation: sleckTypingPulse 900ms ease-in-out infinite alternate;
		}

		@keyframes sleckTypingPulse {
			from {
				color: rgba(175, 181, 190, 0.62);
			}
			to {
				color: rgba(255, 255, 255, 0.96);
			}
		}

		.sleck-composer {
			position: absolute;
			left: 34.5%;
			top: 90.45%;
			width: 56.5%;
			height: 5.55%;
			border: 0;
			outline: none;
			background: transparent;
			color: rgba(246, 247, 251, 0.95);
			font: clamp(12px, 1.2vw, 17px) / 1.2 Inter, ui-sans-serif, system-ui, sans-serif;
			padding: 0 clamp(10px, 1.2vw, 16px);
		}

		.sleck-composer::placeholder {
			color: rgba(246, 247, 251, 0.56);
		}

		.sleck-composer:disabled {
			opacity: 0.55;
			cursor: wait;
		}

		.sleck-send {
			position: absolute;
			left: 92.0%;
			top: 89.55%;
			width: 5.55%;
			height: 7.15%;
			border: 0;
			background: transparent;
			color: transparent;
			cursor: pointer;
		}

		.sleck-send:disabled {
			cursor: wait;
			opacity: 0.55;
		}

		.sleck-finished {
			position: absolute;
			left: 50%;
			top: 48%;
			transform: translate(-50%, -50%);
			min-width: clamp(118px, 14vw, 184px);
			border: 1px solid rgba(255, 255, 255, 0.24);
			border-radius: 10px;
			background: rgba(255, 38, 126, 0.94);
			color: #fff;
			cursor: pointer;
			font: 800 clamp(14px, 1.35vw, 19px) / 1 Inter, ui-sans-serif, system-ui, sans-serif;
			padding: clamp(10px, 1.1vw, 15px) clamp(18px, 2vw, 28px);
			box-shadow: 0 16px 38px rgba(0, 0, 0, 0.36);
		}

		.sleck-finished:hover,
		.sleck-finished:focus-visible {
			filter: brightness(1.14);
		}

		.sleck-finished[hidden] {
			display: none;
		}
	`;
	document.head.append(style);
}

export class SleckUi {
	private readonly root: HTMLDivElement;
	private readonly messagesNode: HTMLDivElement;
	private readonly input: HTMLInputElement;
	private readonly send: HTMLButtonElement;
	private readonly finished: HTMLButtonElement;
	private readonly closeOnEscape: boolean;
	private readonly maxUserMessages: number;
	private readonly onClose?: () => void;
	private conversation: SleckConversationMessage[] = [];
	private messages: SleckMessage[] = [];
	private sending = false;
	private typing = false;
	private ended = false;
	private messageId = 0;
	private openToken = 0;
	private initialTimer = 0;
	private plotTwistTimer = 0;
	private userMessagesSent = 0;

	constructor(parent: HTMLElement, options: SleckUiOptions = {}) {
		installSleckStyles();
		this.closeOnEscape = options.closeOnEscape ?? true;
		this.maxUserMessages = options.maxUserMessages ?? DEFAULT_MAX_USER_MESSAGES;
		this.onClose = options.onClose;
		this.root = document.createElement("div");
		this.root.className = "sleck-desktop";
		this.root.hidden = true;

		this.messagesNode = document.createElement("div");
		this.messagesNode.className = "sleck-messages";
		this.input = document.createElement("input");
		this.input.className = "sleck-composer";
		this.input.type = "text";
		this.input.maxLength = 500;
		this.input.placeholder = "Type a message...";
		this.send = document.createElement("button");
		this.send.className = "sleck-send";
		this.send.type = "button";
		this.send.ariaLabel = "Send message";
		this.finished = document.createElement("button");
		this.finished.className = "sleck-finished";
		this.finished.type = "button";
		this.finished.textContent = "Click to Continue";
		this.finished.hidden = true;

		this.root.append(this.messagesNode, this.input, this.send, this.finished);
		parent.append(this.root);

		this.send.addEventListener("click", () => void this.submit());
		this.finished.addEventListener("click", () => this.close());
		this.input.addEventListener("input", () => this.render());
		this.input.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				if (this.closeOnEscape) {
					this.close();
				}
				return;
			}
			if (event.key === "Enter") {
				event.preventDefault();
				void this.submit();
				return;
			}
			event.stopPropagation();
		});
		this.input.addEventListener("keyup", (event) => event.stopPropagation());
		this.root.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				if (this.closeOnEscape) {
					this.close();
				}
			}
		});
		this.root.addEventListener("click", () => {
			if (this.ended) {
				this.close();
			}
		});
		this.render();
	}

	open() {
		const token = ++this.openToken;
		window.clearTimeout(this.initialTimer);
		this.root.hidden = false;
		this.conversation = [];
		this.messages = [];
		this.sending = false;
		this.typing = true;
		this.ended = false;
		this.userMessagesSent = 0;
		this.input.value = "";
		this.finished.hidden = true;
		this.render();
		this.initialTimer = window.setTimeout(() => {
			if (token !== this.openToken || this.root.hidden) {
				return;
			}
			this.typing = false;
			this.conversation = [{ role: "assistant", content: INITIAL_STEPHANIE_MESSAGE }];
			this.messages.push({
				author: "stephanie",
				id: this.nextMessageId(),
				text: INITIAL_STEPHANIE_MESSAGE,
			});
			this.render();
			this.playSound(SLECK_RECEIVED_SOUND_URL);
			this.input.focus();
		}, 2000);
	}

	close() {
		this.openToken += 1;
		window.clearTimeout(this.initialTimer);
		window.clearTimeout(this.plotTwistTimer);
		this.root.hidden = true;
		this.onClose?.();
	}

	private async submit() {
		if (this.sending || this.typing || this.ended) {
			return;
		}
		const text = this.input.value.trim();
		if (!text) {
			this.input.focus();
			return;
		}
		const userMessageId = this.nextMessageId();
		const requestHistory = [...this.conversation];
		this.userMessagesSent += 1;
		this.messages.push({ author: "you", id: userMessageId, text });
		this.input.value = "";
		this.sending = true;
		this.typing = true;
		this.render();
		try {
			const response = await fetch("/api/sleck/respond", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					history: requestHistory,
					message: text,
					userMessageCount: this.userMessagesSent,
				}),
			});
			if (!response.ok) {
				throw new Error(`Sleck request failed with ${response.status}`);
			}
			const payload = (await response.json()) as SleckApiResponse;
			this.conversation =
				Array.isArray(payload.history) && payload.history.length > 0
					? payload.history
					: [...requestHistory, { role: "user", content: text }, { role: "assistant", content: payload.message }];
			if (payload.hearted) {
				const lastUserMessage = this.messages.find((message) => message.id === userMessageId);
				if (lastUserMessage) {
					lastUserMessage.hearted = true;
				}
			}
			const autoPlotTwist = payload.ended && this.userMessagesSent >= this.maxUserMessages;
			if (autoPlotTwist) {
				this.sending = false;
				this.typing = true;
				this.render();
				this.plotTwistTimer = window.setTimeout(() => {
					if (this.root.hidden) {
						return;
					}
					this.showStephanieMessage(PLOT_TWIST_MESSAGE, true);
					this.playSound(SLECK_RECEIVED_SOUND_URL);
				}, AUTO_PLOT_TWIST_TYPING_DELAY_MS);
			} else {
				this.showStephanieMessage(payload.ended ? PLOT_TWIST_MESSAGE : payload.message, payload.ended);
				this.playSound(payload.hearted ? SLECK_HEART_SOUND_URL : SLECK_RECEIVED_SOUND_URL);
				if (!this.ended) {
					this.input.focus();
				}
			}
		} catch (error) {
			console.error(error);
			this.messages.push({
				author: "stephanie",
				id: this.nextMessageId(),
				text: "sorry, Sleck is being weird on my end. try that again?",
			});
			this.sending = false;
			this.typing = false;
			this.render();
			this.playSound(SLECK_RECEIVED_SOUND_URL);
			this.input.focus();
		}
	}

	private showStephanieMessage(text: string, ended: boolean) {
		this.messages.push({
			author: "stephanie",
			id: this.nextMessageId(),
			text,
		});
		this.ended = ended;
		this.sending = false;
		this.typing = false;
		this.render();
		if (this.ended) {
			this.finished.hidden = false;
			this.finished.focus();
			this.render();
		}
	}

	private render() {
		const renderedMessages = this.messages.map((message) => this.renderMessage(message));
		if (this.typing) {
			renderedMessages.push(this.renderTyping());
		}
		this.messagesNode.replaceChildren(...renderedMessages);
		const unavailable = this.sending || this.typing || this.ended;
		this.input.disabled = unavailable;
		this.send.disabled = unavailable || !this.input.value.trim();
		this.scrollToBottom();
	}

	private renderMessage(message: SleckMessage) {
		const row = document.createElement("div");
		row.className = `sleck-message ${message.author}${message.hearted ? " hearted" : ""}`;
		if (message.author === "stephanie") {
			row.append(this.renderAvatar());
		}
		const bubble = document.createElement("div");
		bubble.className = "sleck-bubble";
		bubble.textContent = message.text;
		row.append(bubble);
		return row;
	}

	private renderTyping() {
		const row = document.createElement("div");
		row.className = "sleck-message stephanie";
		row.append(this.renderAvatar());
		const bubble = document.createElement("div");
		bubble.className = "sleck-bubble sleck-typing";
		bubble.textContent = "Typing...";
		row.append(bubble);
		return row;
	}

	private renderAvatar() {
		const avatar = document.createElement("img");
		avatar.className = "sleck-avatar";
		avatar.src = STEPHANIE_AVATAR_URL;
		avatar.alt = "";
		avatar.draggable = false;
		avatar.addEventListener("error", () => {
			const fallback = document.createElement("div");
			fallback.className = "sleck-avatar-fallback";
			fallback.textContent = "S";
			avatar.replaceWith(fallback);
		}, { once: true });
		return avatar;
	}

	private nextMessageId() {
		this.messageId += 1;
		return this.messageId;
	}

	private playSound(url: string) {
		const audio = new Audio(url);
		audio.volume = 0.78;
		audio.play().catch(() => {
			// Browsers may block audio until the player interacts with the page.
		});
	}

	private scrollToBottom() {
		const scroll = () => {
			this.messagesNode.scrollTo({ top: this.messagesNode.scrollHeight, behavior: "smooth" });
		};
		window.requestAnimationFrame(() => {
			scroll();
			window.requestAnimationFrame(scroll);
		});
	}
}
