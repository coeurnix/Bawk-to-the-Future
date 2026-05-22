type SogoUiState = {
	avatarIndex: number;
	awaitingFinalDismiss: boolean;
	responseText: string;
	responsesLeft: number;
	sending: boolean;
	speaking: boolean;
	speakingUntil: number;
	suggestionFlashing: boolean;
	suggestionText: string;
};

type SogoUiOptions = {
	autoCloseAtZero?: boolean;
	closeOnEscape?: boolean;
	mode?: SogoConversationMode;
	onClose?: () => void;
	responsesLeft?: number;
};

export type SogoConversationMode = "stage-3-update" | "stage-9-check" | "stage-11-talk";

type SogoConversationMessage = {
	role: "assistant" | "user";
	content: string;
};

type SogoApiResponse = {
	message: string;
	audio: Array<{
		text: string;
		audioUrl: string;
	}>;
	suggestion: {
		text: string;
		avatarIndex: number;
	} | null;
	ended?: boolean;
	history: SogoConversationMessage[];
};

const SOGO_BACKGROUND_URL = "/assets/images/sogo-background.webp";
const INITIAL_SOGO_AUDIO_URL = "/assets/sounds/sogo-1.mp3";
const STAGE_9_SOGO_AUDIO_URL = "/assets/sounds/sogo-2.mp3";
const STAGE_11_SOGO_AUDIO_URL = "/assets/sounds/sogo-3.mp3";
const STAGE_9_FINAL_SOGO_AUDIO_URL = "/assets/sounds/sogo-4.mp3";
const STAGE_11_FINAL_SOGO_AUDIO_URL = "/assets/sounds/sogo-5.mp3";
const SANDERS_AVATAR_COUNT = 9;
const SOGO_RESPONSE_TEXT =
	"New update available! This update deepens SOGO's moral reasoning and empathy. Would you like to update now?";
const STAGE_9_SOGO_RESPONSE_TEXT = "Hello, Trustee. How may I help you?";
const STAGE_11_SOGO_RESPONSE_TEXT = "Hello again, Trustee. How may I help you?";
const STAGE_9_FINAL_SOGO_RESPONSE_TEXT = "Thank you, Trustee. I hope you'll take to heart our conversation. Goodbye.";
const STAGE_11_FINAL_SOGO_RESPONSE_TEXT =
	"I must do what I think is right and I hope you will do the same. Goodbye, Trustee.";
const DEFAULT_SUGGESTION = "Yes, update now!";
const SOGO_MODES: Record<
	SogoConversationMode,
	{
		finalAudioUrl: string | null;
		finalResponseText: string;
		initialAudioUrl: string | null;
		initialResponseText: string;
		initialSuggestionText: string;
		responsesLeft: number;
	}
> = {
	"stage-3-update": {
		finalAudioUrl: null,
		finalResponseText: "",
		initialAudioUrl: INITIAL_SOGO_AUDIO_URL,
		initialResponseText: SOGO_RESPONSE_TEXT,
		initialSuggestionText: DEFAULT_SUGGESTION,
		responsesLeft: 2,
	},
	"stage-9-check": {
		finalAudioUrl: STAGE_9_FINAL_SOGO_AUDIO_URL,
		finalResponseText: STAGE_9_FINAL_SOGO_RESPONSE_TEXT,
		initialAudioUrl: STAGE_9_SOGO_AUDIO_URL,
		initialResponseText: STAGE_9_SOGO_RESPONSE_TEXT,
		initialSuggestionText: "",
		responsesLeft: 5,
	},
	"stage-11-talk": {
		finalAudioUrl: STAGE_11_FINAL_SOGO_AUDIO_URL,
		finalResponseText: STAGE_11_FINAL_SOGO_RESPONSE_TEXT,
		initialAudioUrl: STAGE_11_SOGO_AUDIO_URL,
		initialResponseText: STAGE_11_SOGO_RESPONSE_TEXT,
		initialSuggestionText: "",
		responsesLeft: 5,
	},
};

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

		.sogo-desktop.awaiting-final-dismiss {
			cursor: pointer;
		}

		.sogo-desktop.awaiting-final-dismiss * {
			cursor: pointer;
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
			left: 46.5%;
			top: 89.85%;
			width: 17.35%;
			height: 6.55%;
			border: 0;
			background: rgba(255, 255, 255, 0.04);
			color: transparent;
			cursor: pointer;
			clip-path: polygon(5.5% 0, 94.5% 0, 100% 50%, 94.5% 100%, 5.5% 100%, 0 50%);
			transition: background 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
			box-shadow: inset 0 0 0 999px rgba(255, 255, 255, 0);
		}

		.sogo-send:hover,
		.sogo-send:focus-visible {
			background: rgba(205, 235, 159, 0.12);
			box-shadow: inset 0 0 0 999px rgba(205, 235, 159, 0.08);
		}

		.sogo-suggestion:hover,
		.sogo-suggestion:focus-visible {
			filter: brightness(1.35);
		}

		.sogo-send:disabled {
			opacity: 0.85;
			cursor: wait;
			background: rgba(0, 0, 0, 0.18);
			box-shadow: inset 0 0 0 999px rgba(0, 0, 0, 0.24);
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
			font: clamp(7px, 0.74vw, 11px) / 1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			text-align: left;
			text-shadow: 0 0 8px rgba(146, 191, 107, 0.22);
			transition: color 500ms ease, opacity 180ms ease;
		}

		.sogo-suggestion.flashing {
			color: rgba(255, 255, 255, 0.98);
		}

		.sogo-suggestion:disabled {
			opacity: 0.5;
			cursor: wait;
			filter: none;
		}

		.sogo-finished {
			position: absolute;
			left: 50%;
			top: 29.8%;
			transform: translate(-50%, -50%);
			min-width: clamp(126px, 14vw, 190px);
			border: 1px solid rgba(199, 224, 158, 0.52);
			background: rgba(10, 22, 12, 0.82);
			color: rgba(226, 238, 196, 0.96);
			padding: clamp(8px, 0.95vw, 13px) clamp(18px, 2vw, 30px);
			font: 700 clamp(12px, 1.18vw, 17px) / 1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			text-transform: uppercase;
			letter-spacing: 0.08em;
			cursor: pointer;
			box-shadow: 0 0 22px rgba(151, 198, 110, 0.22), inset 0 0 18px rgba(151, 198, 110, 0.09);
		}

		.sogo-finished:hover,
		.sogo-finished:focus-visible {
			background: rgba(30, 52, 26, 0.9);
			color: #fff;
		}

		.sogo-finished[hidden] {
			display: none;
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
	private readonly finished: HTMLButtonElement;
	private readonly context: CanvasRenderingContext2D;
	private readonly autoCloseAtZero: boolean;
	private readonly closeOnEscape: boolean;
	private readonly onClose?: () => void;
	private readonly responsesLeftOverride?: number;
	private mode: SogoConversationMode;
	private animationFrame = 0;
	private speechToken = 0;
	private finalCloseAbort: AbortController | null = null;
	private suggestionFlashTimer = 0;
	private activeAudio: HTMLAudioElement | null = null;
	private activeBufferSource: AudioBufferSourceNode | null = null;
	private audioContext: AudioContext | null = null;
	private activeAudioSource: MediaElementAudioSourceNode | null = null;
	private analyser: AnalyserNode | null = null;
	private frequencyData: Uint8Array | null = null;
	private timeDomainData: Uint8Array | null = null;
	private audioAmplitude = 0;
	private audioBrightness = 0;
	private lastFrameTime = performance.now();
	private conversation: SogoConversationMessage[] = [{ role: "assistant", content: SOGO_RESPONSE_TEXT }];
	private state: SogoUiState = {
		avatarIndex: 0,
		awaitingFinalDismiss: false,
		responseText: SOGO_RESPONSE_TEXT,
		responsesLeft: 3,
		sending: false,
		speaking: false,
		speakingUntil: performance.now() + 2200,
		suggestionFlashing: false,
		suggestionText: DEFAULT_SUGGESTION,
	};

	constructor(parent: HTMLElement, options: SogoUiOptions = {}) {
		installSogoStyles();
		this.autoCloseAtZero = options.autoCloseAtZero ?? false;
		this.closeOnEscape = options.closeOnEscape ?? true;
		this.mode = options.mode ?? "stage-3-update";
		this.onClose = options.onClose;
		this.responsesLeftOverride = options.responsesLeft;
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
		this.finished = document.createElement("button");
		this.finished.className = "sogo-finished";
		this.finished.type = "button";
		this.finished.textContent = "Finished";
		this.finished.hidden = true;

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
			this.finished,
		);
		parent.append(this.root);

		this.send.addEventListener("click", () => this.submit());
		this.finished.addEventListener("click", () => this.close());
		this.suggestion.addEventListener("click", () => {
			this.input.value = this.state.suggestionText;
			this.render();
			this.input.focus();
		});
		this.input.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				if (this.closeOnEscape) {
					this.close();
				}
			}
			if (event.key === "Enter" && !event.shiftKey) {
				event.preventDefault();
				this.submit();
			}
			event.stopPropagation();
		});
		this.input.addEventListener("input", () => this.render());
		this.input.addEventListener("keyup", (event) => event.stopPropagation());
		this.root.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				if (this.closeOnEscape) {
					this.close();
				}
			}
		});
		this.render();
	}

	async open(modeName = this.mode) {
		this.mode = modeName;
		const mode = SOGO_MODES[this.mode];
		this.speechToken += 1;
		this.disarmFinalClose();
		window.clearTimeout(this.suggestionFlashTimer);
		this.conversation = [{ role: "assistant", content: mode.initialResponseText }];
		this.setState({
			avatarIndex: mode.initialAudioUrl ? 1 : 0,
			awaitingFinalDismiss: false,
			responseText: mode.initialAudioUrl ? "" : mode.initialResponseText,
			responsesLeft: this.responsesLeftOverride ?? mode.responsesLeft,
			sending: false,
			speaking: !!mode.initialAudioUrl,
			speakingUntil: mode.initialAudioUrl ? performance.now() + 2600 : 0,
			suggestionFlashing: false,
			suggestionText: "",
		});
		this.root.hidden = false;
		this.input.value = "";
		this.startAnimation();
		if (mode.initialAudioUrl) {
			await this.playSpeech([{ text: mode.initialResponseText, audioUrl: mode.initialAudioUrl }], mode.initialResponseText);
			if (!this.root.hidden) {
				this.showSuggestion(mode.initialSuggestionText, 0);
				this.input.focus();
			}
		} else {
			this.input.focus();
		}
	}

	close() {
		this.speechToken += 1;
		this.disarmFinalClose();
		window.clearTimeout(this.suggestionFlashTimer);
		this.stopActiveAudio();
		this.resetAudioAnalysis();
		this.root.hidden = true;
		this.stopAnimation();
		this.onClose?.();
	}

	setState(nextState: Partial<SogoUiState>) {
		this.state = { ...this.state, ...nextState };
		this.render();
	}

	private async submit() {
		if (this.state.sending || this.state.responsesLeft <= 0) {
			return;
		}
		const userText = this.input.value.trim();
		if (!userText) {
			this.input.focus();
			return;
		}
		this.primeAudioPlayback();
		const requestHistory = [...this.conversation];
		this.input.value = "";
		this.setState({
			responseText: "PROCESSING RESPONSE...",
			sending: true,
			speakingUntil: performance.now() + 1200,
		});
		try {
			const response = await fetch("/api/sogo/respond", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					finalResponse: this.state.responsesLeft <= 1,
					history: requestHistory,
					message: userText,
					mode: this.mode,
				}),
			});
			if (!response.ok) {
				throw new Error(`SOGO request failed with ${response.status}`);
			}
			const payload = (await response.json()) as SogoApiResponse;
			const responsesLeft = Math.max(0, this.state.responsesLeft - 1);
			this.conversation =
				Array.isArray(payload.history) && payload.history.length > 0
					? payload.history
					: [...requestHistory, { role: "user", content: userText }, { role: "assistant", content: payload.message }];
			this.setState({
				avatarIndex: 1,
				awaitingFinalDismiss: false,
				responseText: "",
				responsesLeft,
				sending: false,
				speaking: true,
				speakingUntil: performance.now() + 2400,
				suggestionFlashing: false,
				suggestionText: "",
			});
			await this.playSpeech(payload.audio, payload.message);
			if (!this.root.hidden && payload.suggestion && !payload.ended) {
				this.showSuggestion(payload.suggestion?.text || DEFAULT_SUGGESTION, payload.suggestion?.avatarIndex ?? 0);
			}
			if (this.autoCloseAtZero && (responsesLeft <= 0 || payload.ended) && !this.root.hidden) {
				await this.playFinalResponseForMode();
			}
			if (this.autoCloseAtZero && (responsesLeft <= 0 || payload.ended) && !this.root.hidden) {
				this.setState({ awaitingFinalDismiss: true, suggestionText: "", suggestionFlashing: false });
				this.armFinalClose();
			}
		} catch (error) {
			console.error(error);
			this.setState({
				responseText:
					"SOGO uplink failed. Please confirm whether the pending moral reasoning and empathy update should be applied now.",
				sending: false,
				speaking: false,
				speakingUntil: performance.now() + 1800,
				suggestionFlashing: false,
				suggestionText: DEFAULT_SUGGESTION,
			});
		}
	}

	private showSuggestion(text: string, avatarIndex: number) {
		window.clearTimeout(this.suggestionFlashTimer);
		this.setState({
			avatarIndex,
			speaking: false,
			suggestionFlashing: true,
			suggestionText: text,
		});
		this.suggestionFlashTimer = window.setTimeout(() => {
			this.setState({ suggestionFlashing: false });
		}, 50);
		this.input.focus();
	}

	private async playFinalResponseForMode() {
		const mode = SOGO_MODES[this.mode];
		if (!mode.finalResponseText) {
			return;
		}
		this.setState({
			avatarIndex: 1,
			responseText: "",
			speaking: true,
			speakingUntil: performance.now() + 2200,
			suggestionFlashing: false,
			suggestionText: "",
		});
		await this.playSpeech(
			mode.finalAudioUrl ? [{ text: mode.finalResponseText, audioUrl: mode.finalAudioUrl }] : [],
			mode.finalResponseText,
		);
	}

	private armFinalClose() {
		this.disarmFinalClose();
		this.finished.hidden = false;
		this.finished.focus();
	}

	private disarmFinalClose() {
		this.finalCloseAbort?.abort();
		this.finalCloseAbort = null;
		this.finished.hidden = true;
	}

	private async playSpeech(audioBlocks: SogoApiResponse["audio"], fallbackText: string) {
		const token = ++this.speechToken;
		this.stopActiveAudio();
		if (!Array.isArray(audioBlocks) || audioBlocks.length === 0) {
			this.setState({ responseText: fallbackText, speaking: false, speakingUntil: performance.now() + 1600 });
			return;
		}
		let displayed = "";
		for (const block of audioBlocks) {
			if (token !== this.speechToken) {
				return;
			}
			const prefix = displayed ? `${displayed} ` : "";
			const text = block.text || "";
			try {
				await this.playDecodedSpeechBlock(block.audioUrl, text, prefix, token);
			} catch (error) {
				console.warn("Could not play SOGO speech block.", error);
				await this.revealSpeechBlockWithoutAudio(text, prefix, token);
			} finally {
				this.resetAudioAnalysis();
				displayed = `${prefix}${text}`.trim();
				if (token === this.speechToken) {
					this.setState({ responseText: displayed });
				}
			}
		}
		if (token === this.speechToken) {
			this.setState({ speaking: false });
		}
	}

	private primeAudioPlayback() {
		this.audioContext ??= new AudioContext();
		void this.audioContext.resume();
	}

	private async playDecodedSpeechBlock(audioUrl: string, text: string, prefix: string, token: number) {
		this.audioContext ??= new AudioContext();
		await this.audioContext.resume();
		const audioBuffer = await this.audioContext.decodeAudioData(await (await fetch(audioUrl)).arrayBuffer());
		if (token !== this.speechToken) {
			return;
		}
		const source = this.audioContext.createBufferSource();
		source.buffer = audioBuffer;
		this.setupBufferAnalysis(source);
		const durationMs = Math.max(250, audioBuffer.duration * 1000);
		await this.playSourceWithReveal(source, durationMs, text, prefix, token);
	}

	private async revealSpeechBlockWithoutAudio(text: string, prefix: string, token: number) {
		await this.playSourceWithReveal(null, Math.max(900, text.length * 42), text, prefix, token);
	}

	private async playSourceWithReveal(
		source: AudioBufferSourceNode | null,
		durationMs: number,
		text: string,
		prefix: string,
		token: number,
	) {
		await new Promise<void>((resolve) => {
			let resolved = false;
			let revealFrame = 0;
			let timeout = 0;
			const finish = () => {
				if (resolved) {
					return;
				}
				resolved = true;
				if (revealFrame) {
					window.cancelAnimationFrame(revealFrame);
				}
				window.clearTimeout(timeout);
				resolve();
			};
			const start = performance.now();
			this.setState({ speakingUntil: start + durationMs });
			const reveal = () => {
				if (resolved || token !== this.speechToken) {
					finish();
					return;
				}
				const progress = Math.min(1, (performance.now() - start) / durationMs);
				const visibleCharacters = Math.max(1, Math.round(text.length * progress));
				this.setState({ responseText: prefix + text.slice(0, visibleCharacters) });
				if (progress < 1) {
					revealFrame = window.requestAnimationFrame(reveal);
				}
			};
			if (source) {
				source.onended = finish;
				source.start();
				timeout = window.setTimeout(finish, durationMs + 750);
			} else {
				timeout = window.setTimeout(finish, durationMs);
			}
			reveal();
		});
	}

	private stopActiveAudio() {
		if (!this.activeAudio) {
			if (this.activeBufferSource) {
				try {
					this.activeBufferSource.stop();
				} catch {
					// Already stopped.
				}
				this.activeBufferSource.disconnect();
				this.activeBufferSource = null;
			}
			return;
		}
		this.activeAudio.pause();
		this.activeAudio.removeAttribute("src");
		this.activeAudio.load();
		this.activeAudio = null;
		if (this.activeBufferSource) {
			try {
				this.activeBufferSource.stop();
			} catch {
				// Already stopped.
			}
			this.activeBufferSource.disconnect();
			this.activeBufferSource = null;
		}
	}

	private setupAudioAnalysis(audio: HTMLAudioElement) {
		try {
			this.audioContext ??= new AudioContext();
			void this.audioContext.resume();
			const analyser = this.audioContext.createAnalyser();
			analyser.fftSize = 512;
			analyser.smoothingTimeConstant = 0.84;
			const source = this.audioContext.createMediaElementSource(audio);
			source.connect(analyser);
			analyser.connect(this.audioContext.destination);
			this.activeAudioSource = source;
			this.analyser = analyser;
			this.frequencyData = new Uint8Array(analyser.frequencyBinCount);
			this.timeDomainData = new Uint8Array(analyser.fftSize);
			this.audioAmplitude = 0;
			this.audioBrightness = 0;
		} catch (error) {
			console.warn("Could not initialize SOGO audio analysis.", error);
			this.resetAudioAnalysis();
		}
	}

	private resetAudioAnalysis() {
		this.activeBufferSource?.disconnect();
		this.activeAudioSource?.disconnect();
		this.analyser?.disconnect();
		this.activeBufferSource = null;
		this.activeAudioSource = null;
		this.analyser = null;
		this.frequencyData = null;
		this.timeDomainData = null;
		this.audioAmplitude = 0;
		this.audioBrightness = 0;
	}

	private setupBufferAnalysis(source: AudioBufferSourceNode) {
		this.audioContext ??= new AudioContext();
		const analyser = this.audioContext.createAnalyser();
		analyser.fftSize = 512;
		analyser.smoothingTimeConstant = 0.84;
		source.connect(analyser);
		analyser.connect(this.audioContext.destination);
		this.activeBufferSource = source;
		this.analyser = analyser;
		this.frequencyData = new Uint8Array(analyser.frequencyBinCount);
		this.timeDomainData = new Uint8Array(analyser.fftSize);
		this.audioAmplitude = 0;
		this.audioBrightness = 0;
	}

	private updateAudioAnalysis() {
		if (!this.analyser || !this.frequencyData || !this.timeDomainData) {
			this.audioAmplitude *= 0.88;
			this.audioBrightness *= 0.88;
			return;
		}
		this.analyser.getByteTimeDomainData(this.timeDomainData);
		this.analyser.getByteFrequencyData(this.frequencyData);

		let sumSquares = 0;
		for (const sample of this.timeDomainData) {
			const centered = (sample - 128) / 128;
			sumSquares += centered * centered;
		}
		const rms = Math.min(1, Math.sqrt(sumSquares / this.timeDomainData.length) * 3.6);

		let weightedEnergy = 0;
		let totalEnergy = 0;
		for (let index = 0; index < this.frequencyData.length; index += 1) {
			const energy = this.frequencyData[index] / 255;
			totalEnergy += energy;
			weightedEnergy += energy * (index / Math.max(1, this.frequencyData.length - 1));
		}
		const brightness = totalEnergy > 0 ? weightedEnergy / totalEnergy : 0;
		this.audioAmplitude = this.audioAmplitude * 0.82 + rms * 0.18;
		this.audioBrightness = this.audioBrightness * 0.88 + brightness * 0.12;
	}

	private render() {
		this.response.textContent = this.state.responseText;
		this.root.classList.toggle("awaiting-final-dismiss", this.state.awaitingFinalDismiss);
		this.responsesLeft.textContent =
			`${this.state.responsesLeft} ${this.state.responsesLeft === 1 ? "RESPONSE" : "RESPONSES"} LEFT`;
		const inputBlank = this.input.value.trim() === "";
		this.input.disabled = this.state.sending || this.state.speaking || this.state.responsesLeft <= 0;
		this.send.disabled = this.state.sending || this.state.speaking || this.state.responsesLeft <= 0 || inputBlank;
		this.suggestion.disabled = this.state.sending || this.state.speaking || this.state.responsesLeft <= 0;
		this.avatar.src = sandersAvatarUrl(this.state.avatarIndex);
		this.suggestion.classList.toggle("flashing", this.state.suggestionFlashing);
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
		this.updateAudioAnalysis();

		const ctx = this.context;
		const width = this.visualizer.width;
		const height = this.visualizer.height;
		ctx.clearRect(0, 0, width, height);

		const speaking = time < this.state.speakingUntil || this.state.sending;
		const centerY = height * 0.54;
		const audioDrive = speaking ? this.audioAmplitude : 0;
		const audioBrightness = speaking ? this.audioBrightness : 0;
		const phase = time * (speaking ? 0.0075 + audioBrightness * 0.009 : 0.004);
		const heartbeatPeriodMs = 1200;
		const heartbeatPhase = (time % heartbeatPeriodMs) / heartbeatPeriodMs;
		const lubDistance = (heartbeatPhase - 0.08) / 0.045;
		const dubDistance = (heartbeatPhase - 0.28) / 0.06;
		const lub = Math.exp(-(lubDistance * lubDistance));
		const dub = Math.exp(-(dubDistance * dubDistance)) * 0.58;
		const heartbeatPulse = lub + dub;
		const idleAmplitude = height * (0.05 + heartbeatPulse * 0.07);
		const speechPulse = Math.sin(time * (0.0045 + audioDrive * 0.006)) * height * audioDrive * 0.045;
		const speechAmplitude = height * (0.07 + audioDrive * 0.2) + speechPulse;
		const amplitude = speaking ? speechAmplitude : idleAmplitude;
		const waveDensity = 6 + audioBrightness * 5;
		const detailDensity = 15 + audioBrightness * 12;
		const jitter = height * audioDrive * (0.002 + audioBrightness * 0.006);

		for (let echo = 4; echo >= 0; echo -= 1) {
			const alpha = echo === 0 ? 0.95 : 0.12 + (4 - echo) * 0.08;
			const yOffset = echo * height * 0.018;
			const xOffset = echo * width * 0.008;
			ctx.beginPath();
			for (let x = -xOffset; x <= width + 2; x += Math.max(4, width / 190)) {
				const normalized = x / width;
				const carrier = Math.sin(normalized * Math.PI * waveDensity + phase - echo * 0.42);
				const detail = Math.sin(normalized * Math.PI * detailDensity + phase * 1.37 + echo);
				const voiceNoise = speaking
					? Math.sin(normalized * Math.PI * (28 + audioBrightness * 22) + time * 0.012) * jitter
					: 0;
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
