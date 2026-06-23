import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
    private readonly page: Page;

    // ─── Header ──────────────────────────────────────────────────────────────────
    private readonly greeting: Locator;
    private readonly draftsSummary: Locator;
    private readonly newProjectButton: Locator;
    private readonly newOrderButton: Locator;

    // ─── Stats ────────────────────────────────────────────────────────────────────
    private readonly draftsCount: Locator;
    private readonly submittedCount: Locator;
    private readonly inProgressCount: Locator;
    private readonly completedCount: Locator;

    // ─── Sections ─────────────────────────────────────────────────────────────────
    private readonly templatesSection: Locator;
    private readonly projectsSection: Locator;
    private readonly latestOrdersSection: Locator;
    private readonly orderTimelineSection: Locator;
    private readonly orderHistorySection: Locator;

    constructor(page: Page) {
        this.page = page;

        this.greeting = page.getByRole('heading', { level: 2 }).filter({ hasText: 'Hi ' });
        this.draftsSummary = page.getByText(/order drafts ready to submit/);
        this.newProjectButton = page.getByRole('button', { name: 'New Project' });
        this.newOrderButton = page.getByRole('button', { name: 'New Order' });

        this.draftsCount = page.locator('p', { hasText: 'Drafts' }).locator('..').getByText(/^\d+$/);
        this.submittedCount = page.locator('p', { hasText: 'Submitted' }).locator('..').getByText(/^\d+$/);
        this.inProgressCount = page.locator('p', { hasText: 'In Progress' }).locator('..').getByText(/^\d+$/);
        this.completedCount = page.locator('p', { hasText: 'Completed' }).locator('..').getByText(/^\d+$/);

        this.templatesSection = page.getByRole('heading', { name: 'Starting Panel Templates', level: 2 });
        this.projectsSection = page.getByRole('heading', { name: 'My Projects', level: 2 });
        this.latestOrdersSection = page.getByRole('heading', { name: 'Latest Orders', level: 2 });
        this.orderTimelineSection = page.getByRole('heading', { name: 'Order Timeline', level: 2 });
        this.orderHistorySection = page.getByRole('heading', { name: 'Order History', level: 3 });
    }

    // ─── Navigation ──────────────────────────────────────────────────────────────

    async goto() {
        const currentUrl = this.page.url();
        if (currentUrl.includes('/home')) return;

        if (currentUrl.includes('daedalusindustrial.com')) {
            const homeLink = this.page.locator('a[href="/home"]');
            await homeLink.click();
        } else {
            await this.page.goto('/home');
        }

        await this.page.waitForURL(/\/home/, { timeout: 15000 });
        await this.greeting.waitFor({ timeout: 10000 });
    }

    // ─── Actions ─────────────────────────────────────────────────────────────────

    async clickNewProject() {
        await this.newProjectButton.click();
    }

    async clickNewOrder() {
        await this.newOrderButton.click();
    }

    async clickViewAllTemplates() {
        await this.templatesSection.locator('../..').getByRole('button', { name: 'View all' }).click();
    }

    async clickViewAllProjects() {
        await this.projectsSection.locator('../..').getByRole('button', { name: 'View all' }).click();
    }

    async clickViewAllOrders() {
        await this.latestOrdersSection.locator('../..').getByRole('button', { name: 'View all' }).click();
    }

    // ─── Assertions ──────────────────────────────────────────────────────────────

    async assertPageLoaded() {
        await expect(this.greeting).toBeVisible({ timeout: 10000 });
        await expect(this.newProjectButton).toBeVisible();
        await expect(this.newOrderButton).toBeVisible();
    }

    async assertGreeting(name: string) {
        await expect(this.greeting).toContainText(name);
    }

    async assertStatVisible(label: 'Drafts' | 'Submitted' | 'In Progress' | 'Completed') {
        await expect(this.page.getByText(label).first()).toBeVisible();
    }

    async assertTemplateCardVisible(templateName: string) {
        await expect(this.page.getByRole('heading', { name: templateName, level: 3 })).toBeVisible();
    }

    async assertProjectCardVisible(projectName: string) {
        await expect(this.page.getByRole('heading', { name: projectName, level: 2 }).first()).toBeVisible();
    }

    async assertOrderRowVisible(orderNumber: string) {
        await expect(this.page.getByText(orderNumber).first()).toBeVisible();
    }
}
