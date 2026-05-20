type SogoUiState = {
	avatarIndex: number;
	responseText: string;
	responsesLeft: number;
	sending: boolean;
	speakingUntil: number;
	suggestionText: string;
};

type SogoUiOptions = {
	onClose?: () => void;
};

const SOGO_BACKGROUND_URL = "/assets/images/sogo-background.webp";
const SANDERS_AVATAR_COUNT = 9;
const SOGO_RESPONSE_TEXT =
	"UPDATE REQUEST RECEIVED.\n\nSOGO requires executive affirmation before applying the pending governance update. Submit an instruction to proceed.";
const DEFAULT_SUGGESTION = "I agree completely.";

let stylesInstalled = false;

function installSogoStyles() {
	if (stylesInstalled) {
		return;
	}
	stylesInstalled = true;
	const style = document.createElement("style");
	style.textContent = `
		.sogo-desktop {
			position: relative;
			width: min(100%, calc((100vh - 36px) * 4 / 3));
			max-height: 100%;
			aspect-ratio: 4 / 3;
			background: center / 100% 100% no-repeat url("${SOGO_BACKGROUND_URL}");
			box-shadow: 0 20px 80px rgba(0, 0, 0, 0.58);
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			color: #bac99b;
			user-select: none;
		}

		.sogo-desktop[hidden] {
			display: none;
		}

		.sogo-visualizer {
			position: absolute;
			left: 3.05%;
			top: 17.7%;
			width: 93.9%;
			height: 24.2%;
			display: block;
			mix-blend-mode: screen;
		}

		.sogo-response {
			position: absolute;
			left: 3.9%;
			top: 49.0%;
			width: 92.4%;
			height: 12.0%;
			overflow: auto;
			padding: clamp(8px, 1.1vw, 16px);
			color: rgba(187, 202, 151, 0.92);
			font-size: clamp(10px, 1.06vw, 15px);
			line-height: 1.42;
			white-space: pre-wrap;
			text-shadow: 0 0 8px rgba(139, 177, 106, 0.26);
			scrollbar-color: rgba(177, 196, 139, 0.54) rgba(6, 12, 8, 0.7);
			scrollbar-width: thin;
		}

		.sogo-responses-left {
			position: absolute;
			left: 35.4%;
			top: 64.0%;
			width: 28.3%;
			height: 4.25%;
			display: grid;
			place-items: center;
			color: rgba(188, 202, 153, 0.86);
			font-size: clamp(9px, 1.05vw, 14px);
			letter-spacing: 0.08em;
			text-transform: uppercase;
			text-shadow: 0 0 8px rgba(154, 199, 113, 0.24);
		}

		.sogo-input {
			position: absolute;
			left: 3.6%;
			top: 74.1%;
			width: 59.7%;
			height: 21.1%;
			resize: none;
			border: 0;
			outline: none;
			background: rgba(3, 10, 6, 0.42);
			color: rgba(214, 223, 188, 0.95);
			padding: clamp(10px, 1.25vw, 18px);
			font: clamp(11px, 1.15vw, 16px) / 1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			text-shadow: 0 0 8px rgba(146, 191, 107, 0.2);
		}

		.sogo-input::placeholder {
			color: rgba(188, 202, 153, 0.52);
		}

		.sogo-input:disabled {
			opacity: 0.58;
			cursor: wait;
		}

		.sogo-send {
			position: absolute;
			left: 46.0%;
			top: 89.9%;
			width: 18.2%;
			height: 7.4%;
			border: 0;
			background: transparent;
			color: transparent;
			cursor: pointer;
		}

		.sogo-send:hover,
		.sogo-send:focus-visible,
		.sogo-suggestion:hover,
		.sogo-suggestion:focus-visible {
			filter: brightness(1.35);
		}

		.sogo-send:disabled {
			opacity: 0.45;
			cursor: wait;
			filter: none;
		}

		.sogo-avatar {
			position: absolute;
			left: 73.525%;
			top: 70.67%;
			width: 18.75%;
			height: 15.08%;
			object-fit: contain;
			object-position: center bottom;
			opacity: 0.65;
			pointer-events: none;
			filter: drop-shadow(0 0 12px rgba(167, 198, 122, 0.14));
		}

		.sogo-suggestion {
			position: absolute;
			left: 69.0%;
			top: 88.0%;
			width: 27.4%;
			height: 7.3%;
			display: grid;
			align-items: start;
			justify-items: start;
			border: 0;
			background: transparent;
			color: rgba(188, 202, 153, 0.92);
			cursor: pointer;
			padding: clamp(3px, 0.42vw, 6px) clamp(8px, 1.2vw, 16px) 0;
			font: clamp(9px, 1.06vw, 15px) / 1.25 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			text-align: left;
			text-shadow: 0 0 8px rgba(146, 191, 107, 0.22);
		}

		.sogo-suggestion:disabled {
			opacity: 0.5;
			cursor: wait;
			filter: none;
		}
	`;
	document.head.append(style);
}

function sandersAvatarUrl(index: number) {
	const clamped = Math.max(0, Math.min(SANDERS_AVATAR_COUNT - 1, Math.trunc(index)));
	return `/assets/images/sanders_${String(clamped).padStart(2, "0")}.webp`;
}

export class SogoUi {
	private readonly root: HTMLDivElement;
	private readonly visualizer: HTMLCanvasElement;
	private readonly response: HTMLDivElement;
	private readonly responsesLeft: HTMLDivElement;
	private readonly input: HTMLTextAreaElement;
	private readonly send: HTMLButtonElement;
	private readonly avatar: HTMLImageElement;
	private readonly suggestion: HTMLButtonElement;
	private readonly context: CanvasRenderingContext2D;
	private readonly onClose?: () => void;
	private animationFrame = 0;
	private lastFrameTime = performance.now();
	private state: SogoUiState = {
		avatarIndex: 0,
		responseText: SOGO_RESPONSE_TEXT,
		responsesLeft: 3,
		sending: false,
		speakingUntil: performance.now() + 2200,
		suggestionText: DEFAULT_SUGGESTION,
	};

	constructor(parent: HTMLElement, options: SogoUiOptions = {}) {
		installSogoStyles();
		this.onClose = options.onClose;
		this.root = document.createElement("div");
		this.root.className = "sogo-desktop";
		this.root.hidden = true;

		this.visualizer = document.createElement("canvas");
		this.visualizer.className = "sogo-visualizer";
		this.response = document.createElement("div");
		this.response.className = "sogo-response";
		this.responsesLeft = document.createElement("div");
		this.responsesLeft.className = "sogo-responses-left";
		this.input = document.createElement("textarea");
		this.input.className = "sogo-input";
		this.input.maxLength = 500;
		this.input.placeholder = "Type your instruction or question here...";
		this.send = document.createElement("button");
		this.send.className = "sogo-send";
		this.send.type = "button";
		this.send.ariaLabel = "Send response";
		this.avatar = document.createElement("img");
		this.avatar.className = "sogo-avatar";
		this.avatar.alt = "";
		this.avatar.draggable = false;
		this.suggestion = document.createElement("button");
		this.suggestion.className = "sogo-suggestion";
		this.suggestion.type = "button";

		const context = this.visualizer.getContext("2d");
		if (!context) {
			throw new Error("Could not create SOGO visualizer context.");
		}
		this.context = context;

		this.root.append(
			this.visualizer,
			this.response,
			this.responsesLeft,
			this.input,
			this.send,
			this.avatar,
			this.suggestion,
		);
		parent.append(this.root);

		this.send.addEventListener("click", () => this.submit());
		this.suggestion.addEventListener("click", () => {
			this.input.value = this.state.suggestionText;
			this.input.focus();
		});
		this.input.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				this.close();
			}
			if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
				event.preventDefault();
				this.submit();
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
		this.input.value = "";
		this.input.focus();
		this.startAnimation();
	}

	close() {
		this.root.hidden = true;
		this.stopAnimation();
		this.onClose?.();
	}

	setState(nextState: Partial<SogoUiState>) {
		this.state = { ...this.state, ...nextState };
		this.render();
	}

	private submit() {
		if (this.state.sending || this.state.responsesLeft <= 0) {
			return;
		}
		const userText = this.input.value.trim();
		this.setState({ sending: true });
		window.setTimeout(() => {
			const responsesLeft = Math.max(0, this.state.responsesLeft - 1);
			this.setState({
				avatarIndex: (this.state.avatarIndex + 1) % SANDERS_AVATAR_COUNT,
				responseText: [
					"ACKNOWLEDGED.",
					userText ? `USER INSTRUCTION: ${userText}` : "NO USER INSTRUCTION PROVIDED.",
					"Pending SOGO update remains queued for final approval.",
				].join("\n\n"),
				responsesLeft,
				sending: false,
				speakingUntil: performance.now() + 2600,
				suggestionText: responsesLeft > 1 ? "Proceed with the update." : DEFAULT_SUGGESTION,
			});
		}, 850);
	}

	private render() {
		this.response.textContent = this.state.responseText;
		this.responsesLeft.textContent =
			`${this.state.responsesLeft} ${this.state.responsesLeft === 1 ? "RESPONSE" : "RESPONSES"} LEFT`;
		this.input.disabled = this.state.sending;
		this.send.disabled = this.state.sending || this.state.responsesLeft <= 0;
		this.suggestion.disabled = this.state.sending;
		this.avatar.src = sandersAvatarUrl(this.state.avatarIndex);
		this.suggestion.textContent = this.state.suggestionText;
	}

	private startAnimation() {
		this.resizeVisualizer();
		this.lastFrameTime = performance.now();
		if (!this.animationFrame) {
			this.animationFrame = window.requestAnimationFrame((time) => this.draw(time));
		}
	}

	private stopAnimation() {
		if (this.animationFrame) {
			window.cancelAnimationFrame(this.animationFrame);
			this.animationFrame = 0;
		}
	}

	private resizeVisualizer() {
		const rect = this.visualizer.getBoundingClientRect();
		const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
		const width = Math.max(1, Math.round(rect.width * pixelRatio));
		const height = Math.max(1, Math.round(rect.height * pixelRatio));
		if (this.visualizer.width !== width || this.visualizer.height !== height) {
			this.visualizer.width = width;
			this.visualizer.height = height;
		}
	}

	private draw(time: number) {
		this.animationFrame = window.requestAnimationFrame((nextTime) => this.draw(nextTime));
		this.resizeVisualizer();
		const deltaSeconds = Math.min(0.05, (time - this.lastFrameTime) / 1000);
		this.lastFrameTime = time;

		const ctx = this.context;
		const width = this.visualizer.width;
		const height = this.visualizer.height;
		ctx.clearRect(0, 0, width, height);

		const speaking = time < this.state.speakingUntil || this.state.sending;
		const centerY = height * 0.54;
		const phase = time * (speaking ? 0.009 : 0.004);
		const heartBeat = Math.pow(Math.max(0, Math.sin(time * 0.006)), 10);
		const idleAmplitude = height * (0.055 + heartBeat * 0.065);
		const speechAmplitude = height * (0.10 + 0.045 * Math.sin(time * 0.015));
		const amplitude = speaking ? speechAmplitude : idleAmplitude;

		for (let echo = 4; echo >= 0; echo -= 1) {
			const alpha = echo === 0 ? 0.95 : 0.12 + (4 - echo) * 0.08;
			const yOffset = echo * height * 0.018;
			const xOffset = echo * width * 0.008;
			ctx.beginPath();
			for (let x = -xOffset; x <= width + 2; x += Math.max(4, width / 190)) {
				const normalized = x / width;
				const carrier = Math.sin(normalized * Math.PI * 7 + phase - echo * 0.42);
				const detail = Math.sin(normalized * Math.PI * 19 + phase * 1.37 + echo);
				const voiceNoise = speaking ? Math.sin(normalized * Math.PI * 43 + time * 0.021) * height * 0.018 : 0;
				const envelope = 0.18 + 0.82 * Math.sin(normalized * Math.PI);
				const y = centerY + yOffset + (carrier * 0.78 + detail * 0.22) * amplitude * envelope + voiceNoise;
				if (x <= -xOffset) {
					ctx.moveTo(x + xOffset, y);
				} else {
					ctx.lineTo(x + xOffset, y);
				}
			}
			ctx.strokeStyle = `rgba(174, 211, 137, ${alpha})`;
			ctx.lineWidth = Math.max(1, width * (echo === 0 ? 0.002 : 0.0012));
			ctx.shadowColor = "rgba(126, 189, 102, 0.38)";
			ctx.shadowBlur = echo === 0 ? width * 0.008 : 0;
			ctx.stroke();
		}

		if (deltaSeconds > 0) {
			ctx.shadowBlur = 0;
		}
	}
}
