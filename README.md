# 🧪 Playwright Automation Template (UI + API)

This repository is a **company-wide automation testing template** built with **Playwright** and **TypeScript**, designed to be reused across projects and teams.

Its goal is to provide a **ready-to-use, scalable, and maintainable** automation foundation so that any new project can start testing immediately without reinventing the wheel.<br><br>

---

## 🎯 Purpose

- Standardize automation practices across the company
- Enable fast onboarding for new QA engineers
- Separate test logic from business logic
- Support both **UI (E2E)** and **API** testing
- Be CI/CD ready from day one<br><br>

---

## 🛠️ Tech Stack

- Playwright
- TypeScript
- Node.js
- dotenv<br><br>

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
- Reuse flows instead of duplicating steps<br><br>


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

The `envLoader.ts` file automatically loads the correct environment configuration.<br><br>

---

## ⚙️ Playwright Configuration

The project defines **separate Playwright projects** for UI and API testing:

- `chrome-e2e` → UI End-to-End tests
- `api-test` → API tests

Each project has its own `baseURL`, allowing independent execution and configuration.<br><br>

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
* Cleaner and more readable tests<br><br>

---

## 📐 Schemas (Contracts)

API responses are validated using schemas to ensure structure and data consistency.

This approach:

* Detects breaking API changes early
* Improves test reliability
* Avoids fragile assertions<br><br>

---

## 🧪 Test Organization
### UI Tests (E2E)

* Implemented using Page Object Model
* Reusable flows live in e2e/tests/common
* Tests focus on user behavior, not UI details<br><br>

---

### API Tests

* Organized by resource

Covers:

* POST
* GET
* GET ALL
* PUT
* DELETE<br><br>

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
```

---


## 📊 Reporting
Allure Report with Local History
This project uses Allure Report to visualize test execution results, with local execution history enabled (trends, duration, retries, etc.).

### 🧩 Prerequisites

* Node.js (v18+ recommended)
* Java JDK (required by Allure)
* Java must be accessible from the command line:
```ts
java --version
```
* npm (comes with Node.js)

### 📦 Dependencies Used

* @playwright/test
* allure-playwright
* allure-commandline (via npx)

### ▶️ Recommended Execution Flow

To ensure Allure history works correctly, it is important NOT to delete the allure-results or allure-report directories.

# Recommended flow:

* npm run test
* npm run allure:report
* npm run allure:open

### 🗂️ How History Works

Allure does not store execution history automatically.
History is preserved by reusing the history folder between executions.

The allure:report script performs the following steps:

* Copies the previous history:
allure-report/history → allure-results/history


* Generates a new report:
allure-results → allure-report

This enables:

* 📈 Trends
* ⏱ Duration Trends
* 🔁 Retry / Flaky tests
  
### 📁 Expected Folder Structure

After multiple executions, the structure should look like:
```ts
allure-results/
 ├── *.json
 └── history/
     ├── history.json
     ├── history-trend.json
     ├── duration-trend.json
     └── retry-trend.json

allure-report/
 ├── index.html
 └── history/
     ├── history.json
     ├── history-trend.json
     ├── duration-trend.json
     └── retry-trend.json
```

### 👀 Where to See the History in the UI

Once the report is opened (npm run allure:open), history is available in:

Overview → Trends

Overview → Duration Trends

Retries / Flaky tests

### ℹ️ Allure does not display a list of executions (runs).
Execution history is shown in an aggregated format using trend charts.

### ❗ Important Rules

* ❌ Do not delete allure-report
* ❌ Do not delete allure-results
* ❌ Do not run allure open without regenerating the report

Deleting these directories will reset the execution history.

### 🚀 Recommended Usage

### Remember, always use the full flow to avoid manual mistakes:

* npm run test
* npm run allure:report
* npm run allure:open<br><br>
  
---

## CI artifacts

External reporting tools<br><br>

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
it is a standard automation framework for the company.<br><br>

---

## 📌 Best Practices

* Do not bypass clients or page objects
* Add new clients before adding new tests
* Keep tests small and focused
* DO NOT treat this template as the single source of truth. This template acts as a reference architecture to ensure consistency, while remaining flexible to adapt over time<br><br>

---

## 📎 Final Notes

Use this repository as the starting point for all automation initiatives.
Any improvements made here should benefit all future projects.
