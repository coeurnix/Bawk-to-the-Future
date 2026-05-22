import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker, { sogoSystemPromptForTurn } from "../src";

describe("Hello World user worker", () => {
	describe("request for /message", () => {
		it('/ responds with "Hello, World!" (unit style)', async () => {
			const request = new Request<unknown, IncomingRequestCfProperties>(
				"http://example.com/message"
			);
			// Create an empty context to pass to `worker.fetch()`.
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx);
			expect(await response.text()).toMatchInlineSnapshot(`"Hello, World!"`);
		});

		it('responds with "Hello, World!" (integration style)', async () => {
			const request = new Request("http://example.com/message");
			const response = await SELF.fetch(request);
			expect(await response.text()).toMatchInlineSnapshot(`"Hello, World!"`);
		});
	});

	describe("request for /random", () => {
		it("/ responds with a random UUID (unit style)", async () => {
			const request = new Request<unknown, IncomingRequestCfProperties>(
				"http://example.com/random"
			);
			// Create an empty context to pass to `worker.fetch()`.
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx);
			expect(await response.text()).toMatch(
				/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/
			);
		});

		it("responds with a random UUID (integration style)", async () => {
			const request = new Request("http://example.com/random");
			const response = await SELF.fetch(request);
			expect(await response.text()).toMatch(
				/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/
			);
		});
	});
});

describe("SOGO AI route", () => {
	it("rejects non-POST requests", async () => {
		const response = await worker.fetch(new Request("http://example.com/api/sogo/respond"), env, createExecutionContext());
		expect(response.status).toBe(405);
		expect(await response.json()).toEqual({ error: "Method not allowed." });
	});

	it("requires a non-empty message", async () => {
		const response = await worker.fetch(
			new Request("http://example.com/api/sogo/respond", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ message: "   " }),
			}),
			env,
			createExecutionContext(),
		);
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Message is required." });
	});

	it("uses the first-turn SOGO system prompt for the first user response", () => {
		const prompt = sogoSystemPromptForTurn([
			{ role: "assistant", content: "New update available!" },
			{ role: "user", content: "I am not sure." },
		]);
		expect(prompt).toContain("first response");
		expect(prompt).toContain("ask for final explicit confirmation");
		expect(prompt).toContain("Do not start the update yet");
	});

	it("uses the second-turn SOGO system prompt for the second user response", () => {
		const prompt = sogoSystemPromptForTurn([
			{ role: "assistant", content: "New update available!" },
			{ role: "user", content: "I am not sure." },
			{ role: "assistant", content: "Please confirm." },
			{ role: "user", content: "No." },
		]);
		expect(prompt).toContain("second and final response");
		expect(prompt).toContain("update is starting now");
		expect(prompt).toContain("Do not ask another question");
	});
});

describe("Sleck AI route", () => {
	it("rejects non-POST requests", async () => {
		const response = await worker.fetch(new Request("http://example.com/api/sleck/respond"), env, createExecutionContext());
		expect(response.status).toBe(405);
		expect(await response.json()).toEqual({ error: "Method not allowed." });
	});

	it("requires a non-empty message", async () => {
		const response = await worker.fetch(
			new Request("http://example.com/api/sleck/respond", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ message: "   " }),
			}),
			env,
			createExecutionContext(),
		);
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Message is required." });
	});

	it("returns the plot twist without calling the LLM after fifteen user messages", async () => {
		const response = await worker.fetch(
			new Request("http://example.com/api/sleck/respond", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ message: "still here", userMessageCount: 15 }),
			}),
			env,
			createExecutionContext(),
		);
		expect(response.status).toBe(200);
		const payload = await response.json() as { ended?: boolean; hearted?: boolean; message?: string };
		expect(payload.ended).toBe(true);
		expect(payload.hearted).toBe(false);
		expect(payload.message).toContain("shipping docks");
	});
});
