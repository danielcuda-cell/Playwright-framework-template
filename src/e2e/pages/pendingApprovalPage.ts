import { Page, Locator, expect } from '@playwright/test';

export class PendingApprovalPage {
    readonly page: Page;

    // /pending-approval/alert
    private readonly accessRequiresApprovalHeading: Locator;
    private readonly completeInformationButton: Locator;

    // /pending-approval/complete-profile
    private readonly fullNameInput: Locator;
    private readonly phoneInput: Locator;
    private readonly emailInput: Locator;
    private readonly specialNotesInput: Locator;
    private readonly submitRequestButton: Locator;

    // /pending-approval/success
    private readonly successHeading: Locator;
    private readonly updateInformationButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.accessRequiresApprovalHeading = page.getByRole('heading', { name: 'Access requires approval' });
        this.completeInformationButton     = page.getByRole('button', { name: 'Complete information' });

        this.fullNameInput       = page.getByPlaceholder('Enter your full name');
        this.phoneInput          = page.getByPlaceholder('+1 (234) 567-8901');
        this.emailInput          = page.getByPlaceholder('Enter your email address');
        this.specialNotesInput   = page.getByPlaceholder('How did you find us?');
        this.submitRequestButton = page.getByRole('button', { name: 'Submit request' });

        this.successHeading          = page.getByRole('heading', { name: 'Your request has been submitted successfully' });
        this.updateInformationButton = page.getByRole('button', { name: 'Update information' });
    }

    // ─── /pending-approval/alert ──────────────────────────────────────────────────

    async assertAccessRequiresApproval() {
        await expect(this.accessRequiresApprovalHeading).toBeVisible({ timeout: 15000 });
    }

    async clickCompleteInformation() {
        await this.completeInformationButton.click();
        await this.page.waitForURL(/\/pending-approval\/complete-profile/, { timeout: 10000 });
    }

    // ─── /pending-approval/complete-profile ──────────────────────────────────────

    async fillFullName(name: string) {
        await this.fullNameInput.fill(name);
    }

    async selectJobFunction(jobFunction: string) {
        await this.page.locator('input[id*="job-function"]').click();
        await this.page.locator('[class*="option"]').filter({ hasText: jobFunction }).click();
    }

    async fillPhone(phone: string) {
        await this.phoneInput.fill(phone);
    }

    async fillSpecialNotes(notes: string) {
        await this.specialNotesInput.fill(notes);
    }

    async completeProfile(data: {
        fullName: string;
        jobFunction: string;
        phone: string;
        specialNotes?: string;
    }) {
        await this.selectJobFunction(data.jobFunction);
        await this.fillFullName(data.fullName);
        await this.fillPhone(data.phone);
        if (data.specialNotes) await this.fillSpecialNotes(data.specialNotes);
        await this.submitRequestButton.click();
    }

    async clickSubmitRequest() {
        await this.submitRequestButton.click();
    }

    async assertEmailPrefilled(email: string) {
        await expect(this.emailInput).toHaveValue(email);
        await expect(this.emailInput).toBeDisabled();
    }

    async assertFullNameError(message: string) {
        await expect(this.page.getByText(message)).toBeVisible();
    }

    async assertPhoneError(message: string) {
        await expect(this.page.getByText(message)).toBeVisible();
    }

    async assertJobFunctionError() {
        // Job Function error is shown inline by the react-select component
        await expect(this.page.getByText('Job function is required')).toBeVisible();
    }

    // ─── /pending-approval/success ────────────────────────────────────────────────

    async assertProfileSubmittedSuccessfully() {
        await expect(this.successHeading).toBeVisible({ timeout: 10000 });
        await expect(this.updateInformationButton).toBeVisible();
        await this.page.waitForURL(/\/pending-approval\/success/, { timeout: 10000 });
    }
}
