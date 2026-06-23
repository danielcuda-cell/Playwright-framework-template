import { Anthropic } from "@anthropic-ai/sdk";

export const claudeClient = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
});