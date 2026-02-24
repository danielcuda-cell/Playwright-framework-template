import { test, expect } from "@playwright/test";
import { companiesClient } from "../../clients/companiesClient";
import { getAuthApiContext, getNoAuthApiContext } from "../../utils/apiContext";
import { randomString } from "../../../shared/utils/random";
import { validateSchema } from "../../utils/helper";
import createCompanySchema from "../../schemas/companies/createCompany.schema.json";


test("CREATE company - happy path @api @companies", async () => {
    const apiContext = await getAuthApiContext();
    const companies = new companiesClient(apiContext);
    const companyName = "Test Company " + randomString();

    const response = await companies.createCompany({
        name: companyName,
    });

    const body = await response.json();
    // Data validation
    expect(body.statusCode).toBe(201);
    expect(body.message[0]).toBe("Created successfully");
    expect(body.data.name).toBeDefined();
    expect(body.data.name).toEqual(companyName);
    expect(body.data.status).toBe("active");

    // Schema validation
    validateSchema(createCompanySchema, body);
});


test("CREATE company with name already in use @api @companies", async () => {
    const apiContext = await getAuthApiContext();
    const companies = new companiesClient(apiContext);
    const companyName = "Test Company " + randomString();

    const response = await companies.createCompany({
        name: companyName,
    });

    const body = await response.json();
    // Data validation
    expect(body.statusCode).toBe(201);
    expect(body.message[0]).toBe("Created successfully");
    expect(body.data.name).toEqual(companyName);

    const response2 = await companies.createCompany({
        name: companyName,
    });

    const body2 = await response2.json();

    expect(body2.statusCode).toBe(409);
    expect(body2.message[0]).toBe("Company with this name already exists");
});


test("CREATE company without auth token @api @companies", async () => {
    const apiContext = await getNoAuthApiContext();
    const companies = new companiesClient(apiContext);
    const companyName = "Test Company " + randomString();

    const response = await companies.createCompany({
        name: companyName,
    });

    const body = await response.json();
    // Data validation
    expect(body.statusCode).toBe(401);
    expect(body.message).toBe("Token not found");
    expect(body.error).toBe("Unauthorized");
});

