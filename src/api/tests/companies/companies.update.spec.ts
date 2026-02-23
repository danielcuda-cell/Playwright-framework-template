import { test, expect } from "@playwright/test";
import { companiesClient } from "../../clients/companiesClient";
import { getAuthApiContext } from "../../utils/apiContext";
import { randomString } from "../../../shared/utils/random";
import { validateSchema } from "../../utils/helper";
import updateCompanySchema from "../../schemas/companies/updateCompany.schema.json";


test("PUT company by id - happy path @api @companies", async () => {
  const apiContext = await getAuthApiContext();
  const companies = new companiesClient(apiContext);
  const companyName = "Test Company " + randomString();

  const createRes = await companies.createCompany({
    name: companyName
  });
  const createBody = await createRes.json();

  const companyId = createBody.data.id;
  const createdAt = createBody.data.createdAt;

  const newName = "Updated Company " + randomString();

  const updateRes = await companies.updateCompany(companyId, {
    name: newName
  });

  expect(updateRes.status()).toBe(200);

  const body = await updateRes.json();

  validateSchema(updateCompanySchema, body);

  expect(body.data.id).toBe(companyId);
  expect(body.data.name).toBe(newName);
  expect(body.data.createdAt).toBe(createdAt);
  expect(body.data.updatedAt).not.toBe(createdAt);
});