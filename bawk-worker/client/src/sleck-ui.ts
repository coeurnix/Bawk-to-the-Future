type SleckMessage = {
	author: "you" | "stephanie";
	text: string;
};

type SleckUiOptions = {
	onClose?: () => void;
};

const SLECK_BACKGROUND_URL = "/assets/images/sleck-background.webp";
const STEPHANIE_AVATAR_URL = "/assets/images/stephanie.webp";

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
			gap: clamp(9px, 1.0vw, 15px);
			padding: clamp(14px, 1.8vw, 24px);
			scrollbar-color: rgba(255, 38, 126, 0.55) rgba(8, 13, 17, 0.8);
			scrollbar-width: thin;
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
			min-width: 0;
			border: 1px solid rgba(255, 255, 255, 0.11);
			border-radius: 14px;
			padding: clamp(9px, 1vw, 13px) clamp(11px, 1.3vw, 16px);
			background: rgba(19, 26, 31, 0.88);
			color: rgba(246, 247, 251, 0.92);
			font-size: clamp(12px, 1.17vw, 16px);
			line-height: 1.34;
			overflow-wrap: anywhere;
			box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
		}

		.sleck-message.you .sleck-bubble {
			background: linear-gradient(135deg, rgba(255, 38, 126, 0.95), rgba(225, 32, 112, 0.95));
			color: #fff;
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
	`;
	document.head.append(style);
}

export class SleckUi {
	private readonly root: HTMLDivElement;
	private readonly messagesNode: HTMLDivElement;
	private readonly input: HTMLInputElement;
	private readonly send: HTMLButtonElement;
	private readonly onClose?: () => void;
	private messages: SleckMessage[] = [
		{
			author: "stephanie",
			text: "Hey. I found something weird in the update notes. Can you read this before Sunders sees it?",
		},
	];
	private sending = false;

	constructor(parent: HTMLElement, options: SleckUiOptions = {}) {
		installSleckStyles();
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

		this.root.append(this.messagesNode, this.input, this.send);
		parent.append(this.root);

		this.send.addEventListener("click", () => this.submit());
		this.input.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				this.close();
				return;
			}
			if (event.key === "Enter") {
				event.preventDefault();
				this.submit();
				return;
			}
			event.stopPropagation();
		});
		this.input.addEventListener("keyup", (event) => event.stopPropagation());
		this.root.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				this.close();
			}
		});
		this.render();
	}

	open() {
		this.root.hidden = false;
		this.input.focus();
		this.scrollToBottom();
	}

	close() {
		this.root.hidden = true;
		this.onClose?.();
	}

	private submit() {
		if (this.sending) {
			return;
		}
		const text = this.input.value.trim();
		if (!text) {
			this.input.focus();
			return;
		}
		this.messages.push({ author: "you", text });
		this.input.value = "";
		this.sending = true;
		this.render();
		window.setTimeout(() => {
			this.messages.push({
				author: "stephanie",
				text: "Okay, yes. That is exactly what I needed you to say. I am saving this thread.",
			});
			this.sending = false;
			this.render();
		}, 650);
	}

	private render() {
		this.messagesNode.replaceChildren(...this.messages.map((message) => this.renderMessage(message)));
		this.input.disabled = this.sending;
		this.send.disabled = this.sending;
		this.scrollToBottom();
	}

	private renderMessage(message: SleckMessage) {
		const row = document.createElement("div");
		row.className = `sleck-message ${message.author}`;
		if (message.author === "stephanie") {
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
			row.append(avatar);
		}
		const bubble = document.createElement("div");
		bubble.className = "sleck-bubble";
		bubble.textContent = message.text;
		row.append(bubble);
		return row;
	}

	private scrollToBottom() {
		window.requestAnimationFrame(() => {
			this.messagesNode.scrollTop = this.messagesNode.scrollHeight;
		});
	}
}
