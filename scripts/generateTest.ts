import { generateTest } from '../src/ai/generators/playwright.generator';

await generateTest(`
As a user,
I want to login,
so I can access my dashboard
`);