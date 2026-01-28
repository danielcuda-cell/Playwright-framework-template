// api/tests/users.spec.ts
import { test, expect } from "@playwright/test";
import { ResourcesClient } from "../../clients/resourcesClient";
import { validateSchema } from "../../utils/helper";

import createResourceSchema from "../../schemas/resources/createResource.schema.json";

test.describe("Resources API", () => {
  let resourcesClient: ResourcesClient;

  test.beforeEach(async ({ request }) => {
    resourcesClient = new ResourcesClient(request);
  });

  test("POST /users - create user", async () => {
    const payload = { title: "New Film", body: "A real good film", userId: 1 };

    const response = await resourcesClient.createResource(payload);
    expect(response.status()).toBe(201);

    const body = await response.json();

    expect(body.title).toBe(payload.title);
    expect(body.body).toBe(payload.body);
    expect(body.userId).toBe(payload.userId);

    validateSchema(createResourceSchema, body);
  });

});