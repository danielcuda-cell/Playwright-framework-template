import { Page, Locator, expect } from '@playwright/test';

export class OrdersPage {
    private readonly page: Page;

    // ─── Page ─────────────────────────────────────────────────────────────────────
    private readonly pageTitle: Locator;
    private readonly newProjectButton: Locator;
    private readonly newOrderButton: Locator;
    private readonly searchInput: Locator;
    private readonly orderDateFilter: Locator;
    private readonly statusFilter: Locator;
    private readonly panelTypesFilter: Locator;
    private readonly table: Locator;
    private readonly paginationInfo: Locator;
    private readonly previousPageButton: Locator;
    private readonly nextPageButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.pageTitle = page.getByRole('heading', { name: 'Orders', level: 1 });
        this.newProjectButton = page.getByRole('button', { name: 'New Project' });
        this.newOrderButton = page.getByRole('button', { name: 'New Order' });
        this.searchInput = page.getByRole('main').getByPlaceholder('Search...');
        this.orderDateFilter = page.getByRole('button', { name: 'Order Date' });
        this.statusFilter = page.getByRole('button', { name: 'Status' });
        this.panelTypesFilter = page.getByRole('button', { name: 'Panel Types' });
        this.table = page.getByRole('table');
        this.paginationInfo = page.getByText(/Showing \d+-\d+ of \d+ items/);
        this.previousPageButton = page.getByRole('button', { name: 'Previous' });
        this.nextPageButton = page.getByRole('button', { name: 'Next' });
    }

    // ─── Navigation ──────────────────────────────────────────────────────────────

    async goto() {
        const currentUrl = this.page.url();
        if (currentUrl.includes('/orders') && !currentUrl.includes('admin')) return;

        if (currentUrl.includes('daedalusindustrial.com')) {
            const ordersLink = this.page.locator('a[href="/orders"]');
            if (!await ordersLink.isVisible()) {
                await this.page.getByRole('button', { name: 'Dashboard' }).click();
            }
            await ordersLink.click();
        } else {
            await this.page.goto('/orders');
        }

        await this.page.waitForURL(/\/orders(\?.*)?$/, { timeout: 15000 });
        await this.pageTitle.waitFor({ timeout: 10000 });
    }

    // ─── Actions ─────────────────────────────────────────────────────────────────

    async clickNewProject() {
        await this.newProjectButton.click();
    }

    async clickNewOrder() {
        await this.newOrderButton.click();
    }

    async search(text: string) {
        await this.searchInput.fill(text);
        await this.page.waitForTimeout(400);
    }

    async openOrderDateFilter() {
        await this.orderDateFilter.click();
    }

    async openStatusFilter() {
        await this.statusFilter.click();
    }

    async openPanelTypesFilter() {
        await this.panelTypesFilter.click();
    }

    async clickNextPage() {
        const prevText = (await this.paginationInfo.innerText()).trim();
        await this.nextPageButton.click();
        await this.waitForPaginationChange(prevText);
    }

    async clickPreviousPage() {
        const prevText = (await this.paginationInfo.innerText()).trim();
        await this.previousPageButton.click();
        await this.waitForPaginationChange(prevText);
    }

    private async waitForPaginationChange(prevText: string) {
        await expect(async () => {
            const currentText = (await this.paginationInfo.innerText({ timeout: 3000 })).trim();
            expect(currentText).not.toBe(prevText);
        }).toPass({ timeout: 15000 });
    }

    // ─── Row actions ──────────────────────────────────────────────────────────────

    getRow(orderNumber: string): Locator {
        return this.table.getByRole('row').filter({ hasText: orderNumber });
    }

    async openRowActions(orderNumber: string) {
        await this.getRow(orderNumber).getByRole('button', { name: 'Row actions' }).click();
    }

    // ─── Assertions ──────────────────────────────────────────────────────────────

    async assertPageLoaded() {
        await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
        await expect(this.newOrderButton).toBeVisible();
        await expect(this.table).toBeVisible();
    }

    async assertOrderVisible(orderNumber: string) {
        await expect(this.getRow(orderNumber)).toBeVisible({ timeout: 10000 });
    }

    async assertOrderStatus(orderNumber: string, status: string) {
        await expect(this.getRow(orderNumber).getByRole('cell', { name: status })).toBeVisible();
    }

    async assertPaginationInfo(text: string) {
        await expect(this.paginationInfo).toContainText(text);
    }
}
