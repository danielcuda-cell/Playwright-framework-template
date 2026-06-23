import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/loginPage';
import { IOModulesPage } from '../pages/ioModulesPage';
import { TemplatesPage } from '../pages/templatesPage';
import { StandardsPage } from '../pages/standardsPage';
import { SignUpPage } from '../pages/signUpPage';
import { PendingApprovalPage } from '../pages/pendingApprovalPage';
import { UsersPage } from '../pages/usersPage';
import { HomePage } from '../pages/homePage';
import { ProjectsPage } from '../pages/projectsPage';
import { OrdersPage } from '../pages/ordersPage';
import { RolesPage } from '../pages/rolesPage';
import { CompaniesPage } from '../pages/companiesPage';
import { PartsPage } from '../pages/partsPage';

type MyFixtures = {
    loginPage: LoginPage;
    ioModulesPage: IOModulesPage;
    templatesPage: TemplatesPage;
    standardsPage: StandardsPage;
    signUpPage: SignUpPage;
    pendingApprovalPage: PendingApprovalPage;
    usersPage: UsersPage;
    homePage: HomePage;
    projectsPage: ProjectsPage;
    ordersPage: OrdersPage;
    rolesPage: RolesPage;
    companiesPage: CompaniesPage;
    partsPage: PartsPage;
};

export const test = base.extend<MyFixtures>({

    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },

    ioModulesPage: async ({ page }, use) => {
        await use(new IOModulesPage(page));
    },

    templatesPage: async ({ page }, use) => {
        await use(new TemplatesPage(page));
    },

    standardsPage: async ({ page }, use) => {
        await use(new StandardsPage(page));
    },

    signUpPage: async ({ page }, use) => {
        await use(new SignUpPage(page));
    },

    pendingApprovalPage: async ({ page }, use) => {
        await use(new PendingApprovalPage(page));
    },

    usersPage: async ({ page }, use) => {
        await use(new UsersPage(page));
    },

    homePage: async ({ page }, use) => {
        await use(new HomePage(page));
    },

    projectsPage: async ({ page }, use) => {
        await use(new ProjectsPage(page));
    },

    ordersPage: async ({ page }, use) => {
        await use(new OrdersPage(page));
    },

    rolesPage: async ({ page }, use) => {
        await use(new RolesPage(page));
    },

    companiesPage: async ({ page }, use) => {
        await use(new CompaniesPage(page));
    },

    partsPage: async ({ page }, use) => {
        await use(new PartsPage(page));
    },
});

export { expect } from '@playwright/test';
