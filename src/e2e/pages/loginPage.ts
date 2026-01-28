import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
    private readonly page: Page;
    private readonly usernameInput: Locator; // Locator for username input field
    private readonly passwordInput: Locator; // Locator for password input field    
    private readonly loginButton: Locator; // Locator for login button
    private readonly errorMessage: Locator; // Locator for error message display

    constructor(page: Page) {
        this.page = page;
        this.usernameInput = page.locator('#userName'); // Finding element using ID selector
        this.passwordInput = page.locator('#password');
        this.loginButton = page.locator('#login'); 
        this.errorMessage = page.locator('.mb-1'); // Finding element using class selector
    }

    async goto() {
        await this.page.goto('/login'); // Navigating to the login page
    }

    async gotoRegister(){
        await this.page.goto('/register'); // Navigating to the register page
    }

    async login(username: string, password: string) { // Method to perform login action
        await this.usernameInput.fill(username); // Filling in the username
        await this.passwordInput.fill(password); // Filling in the password
        await this.loginButton.click(); // Clicking the login button
    }
    
    async assertLoginError(message: string) {
        await expect(this.errorMessage).toHaveText(message); // Using toHaveText assertion, validating the error message
    }
}