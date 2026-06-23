import fs from 'fs';
import path from 'path';

import { claudeClient } from '../client/claude.client';
import { generatePlaywrightPrompt } from '../prompts/generateTest.prompt';

export async function generateTest(userStory: string) {
  const response = await claudeClient.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: generatePlaywrightPrompt(userStory),
      },
    ],
  });

  const generatedCode = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  if (!generatedCode.trim()) {
    throw new Error('Claude response contained no text content blocks.');
  }

  const filePath = path.resolve(
    './src/e2e/tests/generated/login.spec.ts'
  );

  fs.writeFileSync(filePath, generatedCode);

  return filePath;
}