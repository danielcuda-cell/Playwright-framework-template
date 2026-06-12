import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/loginPage';
import { IOModulesPage } from '../pages/ioModulesPage';
import { TemplatesPage } from '../pages/templatesPage';

type MyFixtures = {
    loginPage: LoginPage;
    ioModulesPage: IOModulesPage;
    templatesPage: TemplatesPage;
};

export const test = base.extend<MyFixtures>({

    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },

    ioModulesPage: async ({ page }, use) => {
        const ioModulesPage = new IOModulesPage(page);
        await use(ioModulesPage);
    },

    templatesPage: async ({ page }, use) => {
        const templatesPage = new TemplatesPage(page);
        await use(templatesPage);
    },
});

export { expect } from '@playwright/test';