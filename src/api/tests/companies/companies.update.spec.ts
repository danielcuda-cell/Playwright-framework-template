import { test, expect } from "@playwright/test";
import { companiesClient } from "../../clients/companiesClient";
import { getAuthApiContext } from "../../utils/apiContext";
import { randomString } from "../../../shared/utils/random";
import { validateSchema } from "../../utils/helper";
import updateCompanySchema from "../../schemas/companies/updateCompany.schema.json";


test("UPDATE company - happy path @api @companies", async () => {
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


test("UPDATE company - invalid company id @api @companies", async () => {
    const apiContext = await getAuthApiContext();
    const companies = new companiesClient(apiContext);
    const companyName = "Test Company " + randomString();
    const companyId = randomString();


    const updateRes = await companies.updateCompany(companyId, {
        name: companyName
    });

    expect(updateRes.status()).toBe(200);

    const body = await updateRes.json();

    expect(body.statusCode).toBe(404);
    expect(body.message[0]).toBe("Company not found");
    expect(body.error).toBe("Internal Error");
});


test("UPDATE company - company name already in use @api @companies", async () => {
    const apiContext = await getAuthApiContext();
    const companies = new companiesClient(apiContext);
    const companyName = "Test Company " + randomString();
    const companyName2 = "Test Company " + randomString();

    await companies.createCompany({
        name: companyName
    });

    const createRes2 = await companies.createCompany({
        name: companyName2
    });

    const createBody2 = await createRes2.json();

    const companyId2 = createBody2.data.id;

    const updateRes = await companies.updateCompany(companyId2, {
        name: companyName
    });

    expect(updateRes.status()).toBe(200);

    const body = await updateRes.json();

    expect(body.statusCode).toBe(409);
    expect(body.message[0]).toBe("Company with this name already exists");
    expect(body.error).toBe("Internal Error");
});