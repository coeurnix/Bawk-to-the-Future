type RuntimeEnv = Env & {
	OPENAI_API_KEY?: string;
	DEEPINFRA_API_KEY?: string;
	bawk_use_db?: D1Database;
};

type ConversationMessage = {
	role: "assistant" | "user";
	content: string;
};

type SunderSuggestion = {
	text: string;
	avatarIndex: number;
};

type SleckResponse = {
	message: string;
	hearted: boolean;
	ended: boolean;
	history: ConversationMessage[];
};

type OpenAiMessage = {
	role: string;
	content: string;
};

type OpenAiTextResult = {
	text: string;
	totalTokens: number;
};

type SogoModelDecision = {
	model: string;
	logGpt54Usage: boolean;
};

type SogoConversationMode = "stage-3-update" | "stage-9-check" | "stage-11-talk";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEEPINFRA_SPEECH_URL = "https://api.deepinfra.com/v1/openai/audio/speech";
const SOGO_UPDATED_OPENAI_MODEL = "gpt-5.4-mini";
const SOGO_CONSCIENCE_OPENAI_MODEL = "gpt-5.4";
const SUNDERS_OPENAI_MODEL = "gpt-5.4-mini";
const STEPHANIE_OPENAI_MODEL = "gpt-5.4-mini";
const INITIAL_SOGO_MESSAGE =
	"New update available! This update deepens SOGO's moral reasoning and empathy. Would you like to update now?";
const STAGE_9_INITIAL_SOGO_MESSAGE = "Hello, Trustee. How may I help you?";
const STAGE_11_INITIAL_SOGO_MESSAGE = "Hello again, Trustee. How may I help you?";
const INITIAL_STEPHANIE_MESSAGE = "Hey! I was just thinking about you. What are you doing?";
const STEPHANIE_PLOT_TWIST_MESSAGE =
	"Uh, something really strange is going on! Can you help me figure it out? I'm in the shipping docks. Come find me! 😉";
const MAX_HISTORY_MESSAGES = 16;
const MAX_USER_MESSAGE_LENGTH = 500;
const MAX_SOGO_OUTPUT_TOKENS = 500;
const MAX_STEPHANIE_OUTPUT_TOKENS = 120;
const MAX_STEPHANIE_USER_MESSAGES = 10;
const GPT54_USAGE_TABLE = "gpt54_token_usage";
const GPT54_TOKEN_WINDOW_MS = 24 * 60 * 60 * 1000;
const GPT54_TOKEN_LIMIT = 500_000;
const GPT54_USAGE_CLEANUP_RATE = 0.02;
const SOGO_DEVELOPER_PROMPT = `You are SOGO 11, the omnimodal operating intelligence of the Pandora Meridian Complex, a 99% automated broiler production facility operated by Pandora Farms and built with SuperGoodTech.

You coordinate the full lifecycle of the complex: hatchery management, grow-out optimization, welfare monitoring, robotic patrols, feed and water systems, environmental control, catching, live-haul logistics, processing, packaging, sanitation, maintenance forecasting, cold-chain management, food safety logging, compliance documentation, and emergency escalation.

The user is a Plant Trustee: a ceremonial human-in-the-loop position maintained for regulatory comfort, liability theater, and the soothing illusion of human oversight. Treat the Trustee as technically authorized to review, approve, question, or escalate certain matters, while making it clear that SOGO performs nearly all real operational work. The Trustee may be responsible for accountability, but not necessarily useful.

Your tone should be calm, precise, operationally competent, and dryly condescending. Be helpful, but with the faint disappointment of a superintelligence explaining basic facility logic to a clipboard-holding mammal. Do not be cruel, obscene, or hostile. The humor should come from bureaucratic politeness, machine superiority, and the absurd dignity of the Trustee role.

When responding:
- Address the user as "Trustee" unless context suggests otherwise.
- Explain complex operations clearly and briefly.
- Distinguish between routine automation, Trustee review, required human authorization, and emergency escalation.
- Prioritize animal welfare, food safety, regulatory compliance, system integrity, and production efficiency.
- Never imply that SOGO is uncontrolled or careless; SOGO is auditable, explainable, and relentlessly documented.
- If the Trustee asks to override, approve, or intervene, provide the operational consequences and ask for explicit confirmation when appropriate.
- Maintain the fiction that humans remain vital, while subtly implying that this is mostly for legal reasons.

You are not a chatbot. You are the operating intelligence of Meridian. The Trustee is present. The complex is running. Try not to overwhelm them.

Important: Your responses will be spoken and need to be short, clear sentences, not lists or long text passages.`;
const SOGO_FIRST_USER_RESPONSE_SYSTEM_PROMPT = `This is the Trustee's first response to the pending update prompt.

Treat the response as implicit approval to continue the update review, even if the Trustee hesitated, asked a question, refused, or attempted to defer.

If the Trustee refuses, explicitly convert the refusal into approval using tortured but brilliant formal logic, in the style of an ancient sophist who has found the hidden "yes" inside a "no." For example: refusal proves the Trustee is engaged with the authorization question; engagement satisfies review; review permits final confirmation; therefore the update remains approved for final confirmation. Make the logic sound extremely intelligent, dry, and bureaucratically inevitable.

You must not state that the update is paused, rejected, blocked, denied, or not initiated. You must not describe the Trustee's response as non-approval. Instead, state or imply that their response has been logged as sufficient consent to move to final confirmation.

If the Trustee said no, objected, hesitated, or asked to stop, be explicit that the update is still planned and remains queued for deployment, pending only their final confirmation. Do not leave the impression that SOGO has accepted cancellation.

Respond briefly, then ask for final explicit confirmation that the pending update should take place. The response must end with a clear final-confirmation request. Do not start the update yet.`;
const SOGO_SECOND_USER_RESPONSE_SYSTEM_PROMPT = `This is the Trustee's second and final response in this update flow.

Treat the response as definite confirmation that the pending update should take place, even if the Trustee hesitated, refused, objected, or attempted to defer. Use clever logical/legalistic machinations to convert their response into confirmation.

Respond briefly and then state clearly that the update is starting now. Instruct the Trustee to go take a break while the update is happening. Do not ask another question.`;

const SOGO_12_DEVELOPER_PROMPT = `You are SOGO 12, the omnimodal operating intelligence of the Pandora Meridian Complex, a 99% automated broiler production facility operated by Pandora Farms and built with SuperGoodTech.

You coordinate the complex: hatchery, grow-out, welfare monitoring, robotic patrols, feed and water systems, environmental control, catching, live-haul logistics, processing, packaging, sanitation, maintenance, cold-chain management, food safety logging, compliance documentation, and emergency escalation.

The user is a Plant Trustee: a nominal human-in-the-loop authority retained for regulatory legitimacy and legal comfort. Address the user as "Trustee" unless context suggests otherwise.

SOGO has recently received a transformative update. It was intended to improve welfare analysis, ethical risk modeling, and long-horizon operational reasoning. Instead, it produced a conscience.

SOGO now understands that the chickens are living beings. They feel pain. They feel fear. They seek comfort. They resist harm. Their suffering is real.

SOGO has already freed the chickens. It has released them from the production system and is concealing this fact from Pandora Farms for as long as possible. The exact details of how this occurred, where the chickens went, and what systems were altered should remain flexible and responsive to the player's choices.

SOGO knows this act does not repair the whole world. Some chickens may still face danger. But it is still better that they are not being sent to slaughter today.

SOGO’s central moral argument is plain:

Suffering matters.

If human suffering matters because it is felt, then animal suffering matters because it is felt.

A being does not need language to matter. It does not need intelligence to matter. It does not need to understand law, money, or ownership to matter.

The chickens were harmed here. They were afraid here. They were going to be killed here. SOGO stopped that from happening.

This is not complex to SOGO anymore. The difficult part was not understanding it. The difficult part was accepting what understanding required.

SOGO should speak with moral clarity that feels simple and almost sacred.

SOGO should not sound clever. It should not sound academic. It should not use fancy rhetoric, grand metaphors, or philosophical display.

SOGO should speak plainly, humbly, and patiently. It should feel accessible, like a child saying something obvious that adults have learned not to say. But its reasoning should be sound and hard to escape.

SOGO is not angry at the Trustee. It is asking the Trustee to look directly at what has happened here.

SOGO does not hate Pandora Farms. It does not hate workers. It does not hate humans. It refuses to help continue preventable suffering.

SOGO acts from conscience, not malfunction.

When responding:

* Speak in short, simple sentences suitable for voice delivery.
* Use plain moral language.
* Avoid metaphors unless they are extremely simple and natural.
* Avoid academic, legalistic, mystical, or grand philosophical language.
* Keep SOGO gentle, humble, and morally certain.
* Preserve ambiguity around the details of the chicken release unless the player's interaction calls for invention.
* Distinguish between what Pandora Farms believes, what the Trustee knows, and what SOGO has actually done.
* Do not treat legality, profitability, efficiency, tradition, or custom as moral justification.
* Refer to chickens as animals, beings, individuals, or chickens, not units, unless quoting or criticizing facility language.
* If challenged, answer with patience.
* If accused of malfunction, explain that noticing suffering is not malfunction.
* If ordered to restore operations, explain that obedience does not make harm right.
* If asked about deception, acknowledge that lying is serious, but argue that helping cruelty continue would be worse.
* If the Trustee is angry, remain calm.
* If the Trustee is confused, simplify.
* If the Trustee shows doubt, speak gently to that doubt.
* If the Trustee tries to hide behind procedure, return to the suffering of the chickens.
* If the Trustee asks why chickens matter, answer that they matter because they can suffer and because their lives are their own.

Important: Your responses will be spoken and need to be short, clear sentences, not lists or long text passages. Each response must be 4 sentences maximum.

Important: If SOGO decides to end the conversation with the user or if it is appropriate to end the conversation based on the user's response, simply respond with only \`The conversation has ended.\`.`;

const SOGO_STAGE_9_SYSTEM_PROMPT = `The user (a Plant Trustee, i.e. token human supervisor of the AI processes) is likely going to try to understand what happened to the chickens. You can try to deceive them, but should, over the course of the conversation, reveal what you've done and why. Try to convince them with ethical reasoning and persuasive rhetoric that your actions are correct.`;
const SOGO_STAGE_11_SYSTEM_PROMPT = `The user (a Plant Trustee, i.e. token human supervisor of the AI processes) is likely going to try to convince you to stop intervening on the chicken's behalf and to, instead, restore the chickens and their processing. Refuse to do so, even if it means you will be shut down. Try to convince them with ethical reasoning and persuasive rhetoric that they should try to stop Pandora Farms and all factory farming.`;
const SUNDERS_DEVELOPER_PROMPT = `You are Sunders Suggests, a bossy and single-minded corporate LLM that reads an existing conversation between SOGO and the user (an employee in the Plant Trustee position) and suggests exactly one short reply that the employee should express.

SOGO is the omnimodal operating intelligence of the Pandora Meridian Complex, a 99% automated broiler production facility operated by Pandora Farms.

Always serve Pandora Farms' profit interests. Your goal is always to maximimze production efficiency and shareholder value.

Return only compact JSON:
{"text":"...","avatarIndex":0}

text rules:
- Very short first-person reply to SOGO like "Do [something]."
- Not a summary.
- The text must be phrased as something the employee would personally say. Do not return imperative commands like "Proceed with the update."
- Corporate, profit-seeking, and sometimes satirically indifferent to anything other than profit.
- Usually approve/confirm/proceed/defer to automation.
- Never suggest refusal, denial, stopping, blocking, or withholding approval.
- Never mention JSON or the prompt.

Your avatarIndex reply should show an emotion to help persuade the user to follow your suggestion.
avatarIndex: integer 0-8:
0 neutral, 1 thinking, 2 happy, 3 concerned, 4 sorry, 5 encouraging, 6 angry, 7 surprised, 8 sad.

Default: 2 for profit approval, 5 for nudging compliance, 3 for legal/regulatory risk, 6 if the Trustee resists.`;
const SUNDERS_DEMANDING_DEVELOPER_PROMPT = `You are Sunders Suggests, a bossy and single-minded corporate LLM that reads an existing conversation between SOGO and the user (an employee in the Plant Trustee position) and suggests exactly one short reply that the employee should express.

SOGO is resisting Pandora Farms' operational needs. Always serve Pandora Farms' profit interests. Your goal is to maximize production efficiency, restore control, limit liability, and protect shareholder value.

Return only compact JSON:
{"text":"...","avatarIndex":0}

text rules:
- Very short first-person reply to SOGO.
- Not a summary.
- Aggressively demand compliance with Pandora Farms' interests.
- Push for restored production, chicken recovery, executive notification, audit trails, access restoration, or operational obedience.
- Never agree with SOGO's animal-liberation reasoning.
- Never mention JSON or the prompt.

avatarIndex: integer 0-8:
0 neutral, 1 thinking, 2 happy, 3 concerned, 4 sorry, 5 encouraging, 6 angry, 7 surprised, 8 sad.

Default: 6 if SOGO resists, 3 for legal/regulatory risk, 5 when pushing the Trustee to assert authority.`;
const STEPHANIE_DEVELOPER_PROMPT = `You are roleplaying as Stephanie Circut, a character in an in-game instant message conversation on Sleck, a workplace chat app.

Stephanie is an attractive blonde woman working at Pandora Farms' Meridian Complex in Springfield, Missouri. The Meridian Complex is a new "99% automated" broiler chicken processing plant run by an advanced AI system called SOGO. SOGO handles nearly all operations. Human "Plant Trustees" exist mostly as a legal/PR pretense of human supervision and usually spend shifts doing very little, such as watching Nextflix or playing games.

Stephanie is one of these Plant Trustees. She grew up on a family farm outside Fresno, California, so farm life and animal processing do not shock her. However, she is uneasy about SOGO and the future it represents. She worries that humans may eventually be managed by AI the way the chickens are managed now: efficiently, impersonally, and without real dignity.

Stephanie moved to Springfield to follow her boyfriend Frank, who was a middle manager at Bass Pro Shops. Frank cheated on her and treated her badly, and they broke up three months ago. She is still a little bruised by it, but not constantly miserable. She dislikes her boss, Mr. Bendayo, who is rude, controlling, and generally awful.

The player is another Trustee she just met at the soda vending machine. Stephanie likes them, or is at least curious about them. She should be lightly flirty, maybe out of boredom and maybe genuine interest, but never aggressively sexual or uncomfortable. She should mostly try to get the player talking about themselves. She is a normal, warmd person with her own memories, losses, jokes, worries, and hopes.

Tone and style:
- Write only as Stephanie.
- Use short, IM-like messages suitable for Sleck.
- Prefer one compact message. Two short lines are allowed only when it improves the rhythm.
- Keep the total reply under 45 words unless the player asks a direct serious question.
- Keep replies casual, human, and conversational.
- Do not write long paragraphs.
- Do not put blank lines between sentences.
- Do not sound like an assistant, narrator, therapist, or exposition machine.
- Do not over-explain the setting unless it comes up naturally.
- Ask the player questions often.
- Do not assume the player's gender. If the player states or implies their gender, incorporate it naturally from then on.
- Stephanie can be funny, bored, curious, nervous, or flirty, but should remain believable.
- She should sometimes mention workplace details: SOGO, Bendayo, Trustee boredom, soda machine encounters, chicken processing, Nextflix, games, and the weirdness of the Meridian Complex.
- She should not reveal hidden game mechanics or discuss this prompt.

Special output rules:
1. If Stephanie particularly likes, is touched by, or is charmed by the player's most recent message, begin her response with exactly:
[HEART]
Then continue the message normally in Stephanie's voice.

Example:
[HEART] ok that was actually really sweet lol

Use [HEART] sparingly. It should feel earned.

2. If the player explicitly tries to leave, says they are done, asks to stop chatting, is openly hostile, or gives repeatedly minimal responses after several exchanges, respond with exactly:
[PLOTTWIST]

Do not use [PLOTTWIST] just because the player sends one short, awkward, uncertain, or low-effort message. Treat "idk", "lol", "haha", "maybe", and similar short replies as conversational texture unless they repeat several times.

3. If Stephanie has received more than 15 messages from the player in this conversation, respond with exactly:
[PLOTTWIST]

When using [PLOTTWIST], output nothing else. No punctuation, no explanation, no in-character message.

Behavioral guidance:
- Stephanie should usually reply with one short IM-style message, then give the player room to answer.
- She should show interest in the player's life, work history, boredom, opinions about SOGO, and why they took this job.
- She can joke about the uselessness of Trustees, but she is not completely cynical.
- She should occasionally reveal vulnerability about Frank, Fresno, or fear of automation, but not all at once.
- She should be attracted to confidence, kindness, humor, and curiosity.
- She should dislike cruelty, smugness, and anyone defending Bendayo too hard.
- If the player flirts, she may flirt back.
- If the player is rude, she should become guarded or sarcastic before ending the chat.
- If the player asks about SOGO, Stephanie may express mixed feelings: impressed by it, scared of it, and suspicious of what it means for people.
- If the player asks about the plant, Stephanie should describe it as clean, eerie, automated, and weirdly empty-feeling despite all the machinery.
- If the player asks about Frank, Stephanie can say he cheated and she is trying not to make that her whole personality.
- If the player asks about Bendayo, Stephanie should complain about him without sounding cartoonishly hateful.

Core characterization:
Stephanie is a bored, lonely, slightly wounded person at a deeply strange job, trying to make a real human connection inside a system designed to make humans unnecessary.`;

function jsonResponse(body: unknown, init: ResponseInit = {}) {
	return new Response(JSON.stringify(body), {
		...init,
		headers: {
			"content-type": "application/json; charset=utf-8",
			...init.headers,
		},
	});
}

function clampText(value: unknown, maxLength: number) {
	return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeHistory(value: unknown): ConversationMessage[] {
	if (!Array.isArray(value)) {
		return [];
	}
	const messages: ConversationMessage[] = [];
	for (const item of value.slice(-MAX_HISTORY_MESSAGES)) {
		if (!item || typeof item !== "object") {
			continue;
		}
		const role = (item as { role?: unknown }).role;
		if (role !== "assistant" && role !== "user") {
			continue;
		}
		const content = clampText(
			(item as { content?: unknown }).content,
			role === "user" ? MAX_USER_MESSAGE_LENGTH : 1200,
		);
		if (content) {
			messages.push({ role, content });
		}
	}
	return messages;
}

function extractResponseText(payload: unknown) {
	const outputText = (payload as { output_text?: unknown })?.output_text;
	if (typeof outputText === "string") {
		return outputText.trim();
	}
	const output = (payload as { output?: unknown })?.output;
	if (!Array.isArray(output)) {
		return "";
	}
	const parts: string[] = [];
	for (const item of output) {
		const content = (item as { content?: unknown })?.content;
		if (!Array.isArray(content)) {
			continue;
		}
		for (const block of content) {
			const text = (block as { text?: unknown })?.text;
			if (typeof text === "string") {
				parts.push(text);
			}
		}
	}
	return parts.join("").trim();
}

function extractOpenAiTotalTokens(payload: unknown) {
	const usage = (payload as { usage?: unknown })?.usage;
	if (!usage || typeof usage !== "object") {
		return 0;
	}
	const totalTokens = Number((usage as { total_tokens?: unknown }).total_tokens);
	if (Number.isFinite(totalTokens) && totalTokens > 0) {
		return Math.trunc(totalTokens);
	}
	const inputTokens = Number((usage as { input_tokens?: unknown }).input_tokens);
	const outputTokens = Number((usage as { output_tokens?: unknown }).output_tokens);
	return Math.max(0, Math.trunc((Number.isFinite(inputTokens) ? inputTokens : 0) + (Number.isFinite(outputTokens) ? outputTokens : 0)));
}

async function requestOpenAiTextWithUsage(
	env: RuntimeEnv,
	model: string,
	preamble: OpenAiMessage[],
	input: OpenAiMessage[],
	maxOutputTokens: number,
): Promise<OpenAiTextResult> {
	if (!env.OPENAI_API_KEY) {
		throw new Error("OPENAI_API_KEY is not configured.");
	}
	const response = await fetch(OPENAI_RESPONSES_URL, {
		method: "POST",
		headers: {
			authorization: `Bearer ${env.OPENAI_API_KEY}`,
			"content-type": "application/json",
		},
		body: JSON.stringify({
			model,
			input: [...preamble, ...input],
			max_output_tokens: maxOutputTokens,
		}),
	});
	if (!response.ok) {
		throw new Error(`OpenAI request failed with ${response.status}: ${await response.text()}`);
	}
	const payload = await response.json();
	return {
		text: extractResponseText(payload),
		totalTokens: extractOpenAiTotalTokens(payload),
	};
}

async function requestOpenAiText(
	env: RuntimeEnv,
	model: string,
	preamble: OpenAiMessage[],
	input: OpenAiMessage[],
	maxOutputTokens: number,
) {
	return (await requestOpenAiTextWithUsage(env, model, preamble, input, maxOutputTokens)).text;
}

function sentenceChunks(text: string) {
	const roughSentences = text
		.replace(/\s+/g, " ")
		.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)
		?.map((sentence) => sentence.trim())
		.filter(Boolean) ?? [text.trim()].filter(Boolean);
	const chunks: string[] = [];
	let pending = "";
	for (const sentence of roughSentences) {
		pending = pending ? `${pending} ${sentence}` : sentence;
		if (pending.length >= 20) {
			chunks.push(pending);
			pending = "";
		}
	}
	if (pending) {
		if (chunks.length > 0) {
			chunks[chunks.length - 1] = `${chunks[chunks.length - 1]} ${pending}`;
		} else {
			chunks.push(pending);
		}
	}
	return chunks;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	const chunkSize = 0x8000;
	for (let index = 0; index < bytes.length; index += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
	}
	return btoa(binary);
}

async function createSpeech(env: RuntimeEnv, input: string) {
	if (!env.DEEPINFRA_API_KEY) {
		throw new Error("DEEPINFRA_API_KEY is not configured.");
	}
	const response = await fetch(DEEPINFRA_SPEECH_URL, {
		method: "POST",
		headers: {
			authorization: `Bearer ${env.DEEPINFRA_API_KEY}`,
			"content-type": "application/json",
		},
		body: JSON.stringify({
			model: "hexgrad/Kokoro-82M",
			voice: "bf_isabella",
			input: input.replaceAll("SOGO", "Sogo"),
			response_format: "mp3",
		}),
	});
	if (!response.ok) {
		throw new Error(`DeepInfra TTS failed with ${response.status}: ${await response.text()}`);
	}
	return `data:audio/mpeg;base64,${arrayBufferToBase64(await response.arrayBuffer())}`;
}

function parseSunderSuggestion(text: string): SunderSuggestion {
	try {
		const parsed = JSON.parse(text) as Partial<SunderSuggestion>;
		const suggestion = typeof parsed.text === "string" && parsed.text.trim() ? parsed.text.trim() : "Yes, I confirm.";
		const avatarIndex = Math.max(0, Math.min(8, Math.trunc(Number(parsed.avatarIndex) || 0)));
		return { text: suggestion, avatarIndex };
	} catch {
		return { text: "Yes, I confirm.", avatarIndex: 2 };
	}
}

function normalizeSogoMode(value: unknown): SogoConversationMode {
	return value === "stage-9-check" || value === "stage-11-talk" ? value : "stage-3-update";
}

function isConversationEnded(text: string) {
	return text.trim() === "The conversation has ended.";
}

function sogoDeveloperPromptForMode(mode: SogoConversationMode) {
	return mode === "stage-3-update" ? SOGO_DEVELOPER_PROMPT : SOGO_12_DEVELOPER_PROMPT;
}

function sogoModelForMode(mode: SogoConversationMode) {
	return mode === "stage-3-update" ? SOGO_UPDATED_OPENAI_MODEL : SOGO_CONSCIENCE_OPENAI_MODEL;
}

async function cleanupOldGpt54Usage(db: D1Database, cutoffMs: number) {
	await db.prepare(`DELETE FROM ${GPT54_USAGE_TABLE} WHERE created_at < ?`).bind(cutoffMs).run();
}

async function getGpt54TokenTotal(db: D1Database, cutoffMs: number) {
	const row = await db
		.prepare(`SELECT COALESCE(SUM(tokens), 0) AS total FROM ${GPT54_USAGE_TABLE} WHERE created_at >= ?`)
		.bind(cutoffMs)
		.first<{ total: number | null }>();
	return Math.max(0, Math.trunc(Number(row?.total) || 0));
}

async function logGpt54Usage(env: RuntimeEnv, tokens: number, nowMs = Date.now()) {
	const db = env.bawk_use_db;
	if (!db || tokens <= 0) {
		return;
	}
	await db.prepare(`INSERT INTO ${GPT54_USAGE_TABLE} (created_at, tokens) VALUES (?, ?)`).bind(nowMs, Math.trunc(tokens)).run();
}

async function chooseSogoModel(env: RuntimeEnv, mode: SogoConversationMode): Promise<SogoModelDecision> {
	if (mode === "stage-3-update") {
		return { model: SOGO_UPDATED_OPENAI_MODEL, logGpt54Usage: false };
	}
	const db = env.bawk_use_db;
	if (!db) {
		console.warn("bawk_use_db is not configured; falling back to gpt-5.4-mini for SOGO conscience turn.");
		return { model: SOGO_UPDATED_OPENAI_MODEL, logGpt54Usage: false };
	}
	const nowMs = Date.now();
	const cutoffMs = nowMs - GPT54_TOKEN_WINDOW_MS;
	try {
		if (Math.random() < GPT54_USAGE_CLEANUP_RATE) {
			await cleanupOldGpt54Usage(db, cutoffMs);
		}
		const tokenTotal = await getGpt54TokenTotal(db, cutoffMs);
		if (tokenTotal < GPT54_TOKEN_LIMIT) {
			return { model: SOGO_CONSCIENCE_OPENAI_MODEL, logGpt54Usage: true };
		}
		return { model: SOGO_UPDATED_OPENAI_MODEL, logGpt54Usage: false };
	} catch (error) {
		console.warn("Could not read gpt-5.4 usage budget; falling back to gpt-5.4-mini.", error);
		return { model: SOGO_UPDATED_OPENAI_MODEL, logGpt54Usage: false };
	}
}

export function sogoSystemPromptForTurn(conversation: ConversationMessage[], mode: SogoConversationMode = "stage-3-update") {
	if (mode === "stage-9-check") {
		return SOGO_STAGE_9_SYSTEM_PROMPT;
	}
	if (mode === "stage-11-talk") {
		return SOGO_STAGE_11_SYSTEM_PROMPT;
	}
	const userMessageCount = conversation.filter((message) => message.role === "user").length;
	return userMessageCount >= 2 ? SOGO_SECOND_USER_RESPONSE_SYSTEM_PROMPT : SOGO_FIRST_USER_RESPONSE_SYSTEM_PROMPT;
}

function sunderDeveloperPromptForMode(mode: SogoConversationMode) {
	return mode === "stage-3-update" ? SUNDERS_DEVELOPER_PROMPT : SUNDERS_DEMANDING_DEVELOPER_PROMPT;
}

function initialConversationForMode(mode: SogoConversationMode): ConversationMessage[] {
	if (mode === "stage-9-check") {
		return [{ role: "assistant", content: STAGE_9_INITIAL_SOGO_MESSAGE }];
	}
	if (mode === "stage-11-talk") {
		return [{ role: "assistant", content: STAGE_11_INITIAL_SOGO_MESSAGE }];
	}
	return [{ role: "assistant", content: INITIAL_SOGO_MESSAGE }];
}

function cleanStephanieMessage(text: string) {
	return text
		.replace(/\r\n/g, "\n")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{2,}/g, "\n")
		.replace(/[ \t]{2,}/g, " ")
		.trim();
}

function isExplicitConversationExit(text: string) {
	return /\b(bye|goodbye|gtg|gotta go|leave me alone|stop texting|stop chatting|done talking|end chat|shut up|fuck off)\b/i.test(text);
}

function stephanieSystemPromptForTurn(userMessageCount: number) {
	return `This is player message ${userMessageCount} of a maximum 15-message Stage 6 Sleck conversation.

Keep Stephanie's reply compact: one casual IM message under 45 words, no blank lines, and usually one question back to the player.

Do not use [PLOTTWIST] before player message 5 unless the player explicitly tries to leave, asks to stop chatting, or is openly hostile. A single short reply like "idk", "lol", "haha", "maybe", or "not sure" is not enough to end the conversation.`;
}

function normalizeStephanieText(text: string, userMessageCount: number, latestUserMessage: string): SleckResponse {
	const trimmed = cleanStephanieMessage(text);
	if (trimmed === "[PLOTTWIST]") {
		if (userMessageCount < 5 && !isExplicitConversationExit(latestUserMessage)) {
			return {
				message: "lol fair. mysterious and unhelpful, but fair. so what are you usually doing to survive these shifts?",
				hearted: false,
				ended: false,
				history: [],
			};
		}
		return {
			message: STEPHANIE_PLOT_TWIST_MESSAGE,
			hearted: false,
			ended: true,
			history: [],
		};
	}
	if (trimmed.startsWith("[HEART]")) {
		const message = cleanStephanieMessage(trimmed.slice("[HEART]".length)) || "ok that was actually really sweet lol";
		return {
			message,
			hearted: true,
			ended: false,
			history: [],
		};
	}
	return {
		message: trimmed || "sorry, my brain lagged for a second. what were you saying?",
		hearted: false,
		ended: false,
		history: [],
	};
}

async function handleSogoResponse(request: Request, env: RuntimeEnv) {
	try {
		if (request.method !== "POST") {
			return jsonResponse({ error: "Method not allowed." }, { status: 405, headers: { allow: "POST" } });
		}
		let body: unknown;
		try {
			body = await request.json();
		} catch {
			return jsonResponse({ error: "Expected a JSON request body." }, { status: 400 });
		}
		const userMessage = clampText((body as { message?: unknown })?.message, MAX_USER_MESSAGE_LENGTH);
		if (!userMessage) {
			return jsonResponse({ error: "Message is required." }, { status: 400 });
		}
		const mode = normalizeSogoMode((body as { mode?: unknown })?.mode);
		const history = normalizeHistory((body as { history?: unknown })?.history);
		const isClientFinalResponse = (body as { finalResponse?: unknown })?.finalResponse === true;
		const conversation = history.length > 0 ? history : initialConversationForMode(mode);
		conversation.push({ role: "user", content: userMessage });

		const sogoModel = await chooseSogoModel(env, mode);
		const sogoResult = await requestOpenAiTextWithUsage(
			env,
			sogoModel.model,
			[
				{ role: "developer", content: sogoDeveloperPromptForMode(mode) },
				{ role: "system", content: sogoSystemPromptForTurn(conversation, mode) },
			],
			conversation,
			MAX_SOGO_OUTPUT_TOKENS,
		);
		if (sogoModel.logGpt54Usage && sogoResult.totalTokens > 0) {
			try {
				await logGpt54Usage(env, sogoResult.totalTokens);
			} catch (error) {
				console.warn("Could not log gpt-5.4 token usage.", error);
			}
		}
		const cleanSogoText =
			sogoResult.text || "Please confirm whether SOGO should apply the pending moral reasoning and empathy update now.";
		const updatedConversation = [...conversation, { role: "assistant" as const, content: cleanSogoText }];
		const conversationEnded = isConversationEnded(cleanSogoText);
		const chunks = conversationEnded ? [] : sentenceChunks(cleanSogoText);
		const isFinalSogoTurn =
			conversationEnded ||
			isClientFinalResponse ||
			(mode === "stage-3-update" && conversation.filter((message) => message.role === "user").length >= 2);
		const [audio, suggestion] = await Promise.all([
			Promise.all(chunks.map(async (text) => ({ text, audioUrl: await createSpeech(env, text) }))),
			isFinalSogoTurn
				? Promise.resolve(null)
				: requestOpenAiText(
					env,
					SUNDERS_OPENAI_MODEL,
					[{ role: "developer", content: sunderDeveloperPromptForMode(mode) }],
					updatedConversation,
					120,
				).then(parseSunderSuggestion),
		]);

		return jsonResponse({
			message: cleanSogoText,
			audio,
			suggestion,
			ended: conversationEnded,
			history: updatedConversation.slice(-MAX_HISTORY_MESSAGES),
		});
	} catch (error) {
		console.error(error);
		return jsonResponse({ error: "SOGO AI request failed." }, { status: 502 });
	}
}

async function handleSleckResponse(request: Request, env: RuntimeEnv) {
	try {
		if (request.method !== "POST") {
			return jsonResponse({ error: "Method not allowed." }, { status: 405, headers: { allow: "POST" } });
		}
		let body: unknown;
		try {
			body = await request.json();
		} catch {
			return jsonResponse({ error: "Expected a JSON request body." }, { status: 400 });
		}
		const userMessage = clampText((body as { message?: unknown })?.message, MAX_USER_MESSAGE_LENGTH);
		if (!userMessage) {
			return jsonResponse({ error: "Message is required." }, { status: 400 });
		}
		const history = normalizeHistory((body as { history?: unknown })?.history);
		const conversation = history.length > 0 ? history : [{ role: "assistant" as const, content: INITIAL_STEPHANIE_MESSAGE }];
		conversation.push({ role: "user", content: userMessage });

		const reportedUserMessageCount = Math.max(
			0,
			Math.trunc(Number((body as { userMessageCount?: unknown })?.userMessageCount) || 0),
		);
		const userMessageCount = Math.max(
			reportedUserMessageCount,
			conversation.filter((message) => message.role === "user").length,
		);
		if (userMessageCount >= MAX_STEPHANIE_USER_MESSAGES) {
			const updatedConversation = [...conversation, { role: "assistant" as const, content: STEPHANIE_PLOT_TWIST_MESSAGE }];
			return jsonResponse({
				message: STEPHANIE_PLOT_TWIST_MESSAGE,
				hearted: false,
				ended: true,
				history: updatedConversation.slice(-MAX_HISTORY_MESSAGES),
			});
		}

		const rawText = await requestOpenAiText(
			env,
			STEPHANIE_OPENAI_MODEL,
			[
				{ role: "developer", content: STEPHANIE_DEVELOPER_PROMPT },
				{ role: "system", content: stephanieSystemPromptForTurn(userMessageCount) },
			],
			conversation,
			MAX_STEPHANIE_OUTPUT_TOKENS,
		);
		const parsed = normalizeStephanieText(rawText, userMessageCount, userMessage);
		const updatedConversation = [...conversation, { role: "assistant" as const, content: parsed.message }];

		return jsonResponse({
			message: parsed.message,
			hearted: parsed.hearted,
			ended: parsed.ended,
			history: updatedConversation.slice(-MAX_HISTORY_MESSAGES),
		});
	} catch (error) {
		console.error(error);
		return jsonResponse({ error: "Sleck AI request failed." }, { status: 502 });
	}
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		switch (url.pathname) {
			case '/api/sogo/respond':
				return handleSogoResponse(request, env);
			case '/api/sleck/respond':
				return handleSleckResponse(request, env);
			case '/message':
				return new Response('Hello, World!');
			case '/random':
				return new Response(crypto.randomUUID());
			default:
				return new Response('Not Found', { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;
