export function generatePlaywrightPrompt(userStory: string) {
    return `
  You are a Senior QA Automation Engineer.
  
  Generate:
  - Playwright test
  - TypeScript
  - Use page object model
  - Use expect assertions
  - Use stable locators
  
  User story:
  ${userStory}
  `;
}