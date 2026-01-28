# 🧪 Playwright Automation Template (UI + API)

This repository is a **company-wide automation testing template** built with **Playwright** and **TypeScript**, designed to be reused across projects and teams.

Its goal is to provide a **ready-to-use, scalable, and maintainable** automation foundation so that any new project can start testing immediately without reinventing the wheel.

---

## 🎯 Purpose

- Standardize automation practices across the company
- Enable fast onboarding for new QA engineers
- Separate test logic from business logic
- Support both **UI (E2E)** and **API** testing
- Be CI/CD ready from day one

---

## 🛠️ Tech Stack

- Playwright
- TypeScript
- Node.js
- dotenv


---


# 🧪 Playwright Automation Template (UI + API)

This repository is a **company-wide automation testing template** built with **Playwright** and **TypeScript**, designed to be reused across projects and teams.

Its goal is to provide a **ready-to-use, scalable, and maintainable** automation foundation so that any new project can start testing immediately without reinventing the wheel.


---


## 📁 Project Structure

```ts
src/
├─ e2e/
│  ├─ fixtures/         # Custom Playwright fixtures used to extend the default test context
│  ├─ pages/            # Page Object Model (UI interactions only)
│  ├─ tests/
│  │  ├─ common/        # Reusable UI flows
│  │  └─ *.spec.ts
│  └─ utils/            # UI-specific helpers
│
├─ api/
│  ├─ clients/          # API clients (one per resource)
│  ├─ schemas/          # Request/Response schemas
│  ├─ tests/
│  └─ utils/            # API-specific helpers
│
├─ shared/
│  ├─ utils/            # Shared helpers (random data, strings, etc.)
│  ├─ data/             # Reusable test data
│  ├─ constants.ts
|  └─ messages.ts
│
├─ envLoader.ts         # Environment loader
└─ playwright.config.ts
```

---


## 🧠 Design Principles

### ❌ What NOT to do
- Write HTTP requests directly inside tests
- Add business logic inside test files
- Duplicate data across tests
- Add complex assertions inline

### ✅ What TO do
- Keep tests simple and readable
- Route all API calls through clients
- Validate API responses using schemas
- Centralize test data and utilities
- Reuse flows instead of duplicating steps


---


## 🌍 Environment Configuration

The environment is selected using the `ENV` variable.

Example `.env.dev` file:
```ts
ENV=dev
BASE_URL=https://demoqa.com
API_BASE_URL=https://reqres.in/api
API_TOKEN=dev_api_token
```

The `envLoader.ts` file automatically loads the correct environment configuration.

---

## ⚙️ Playwright Configuration

The project defines **separate Playwright projects** for UI and API testing:

- `chrome-e2e` → UI End-to-End tests
- `api-test` → API tests

Each project has its own `baseURL`, allowing independent execution and configuration.

---

## 🔌 API Testing – Clients

Each API resource has its own client responsible for handling HTTP communication.

Example usage:

```ts
UsersClient.createUser(data);
UsersClient.getUserById(id);
```
Benefits:

* Single responsibility per client
* Easy maintenance when APIs change
* Cleaner and more readable tests

---

## 📐 Schemas (Contracts)

API responses are validated using schemas to ensure structure and data consistency.

This approach:

* Detects breaking API changes early
* Improves test reliability
* Avoids fragile assertions

---

### 🧪 Test Organization
## UI Tests (E2E)

* Implemented using Page Object Model
* Reusable flows live in e2e/tests/common
* Tests focus on user behavior, not UI details

---

## API Tests

* Organized by resource

Covers:

* POST
* GET
* GET ALL
* PUT
* DELETE

---

## 🏷️ Test Tags

Tests can be tagged to support selective execution:
```ts
test.describe('@api @smoke', () => {
  // tests
});
```
Run tests by tag:
```ts
npx playwright test --grep @smoke
```

---

Run Playwright UI Mode:
```ts
npx playwright test --ui
```

Run Specific Proyect:
```ts
npx playwright test --project="project-name"

---


## 📊 Reporting

Default Playwright HTML report

The template is prepared for future integration with:

Allure

---

## CI artifacts

External reporting tools

---

## 🚀 Running Tests

Install dependencies:
```ts
npm install
```

Run all tests:
```ts
npx playwright test
```

Run only API tests:
```ts
npx playwright test --project=api-test
```

Run only UI tests:
```ts
npx playwright test --project=chrome-e2e
```
---

## 🧩 Built to Scale

This template is designed to:

* Support multiple teams and projects
* Enforce consistent automation standards
* Reduce technical debt
* Scale easily with CI/CD pipelines

This is not just a test repository —
it is a standard automation framework for the company.

---

## 📌 Best Practices

* Do not bypass clients or page objects
* Add new clients before adding new tests
* Keep tests small and focused
* DO NOT treat this template as the single source of truth. This template acts as a reference architecture to ensure consistency, while remaining flexible to adapt over time

---

## 📎 Final Notes

Use this repository as the starting point for all automation initiatives.
Any improvements made here should benefit all future projects.
