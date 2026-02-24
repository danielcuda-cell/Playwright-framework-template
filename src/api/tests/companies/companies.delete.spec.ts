import { test, expect } from "@playwright/test";
import { companiesClient } from "../../clients/companiesClient";
import { getAuthApiContext } from "../../utils/apiContext";
import { randomString } from "../../../shared/utils/random";
import { validateSchema } from "../../utils/helper";
import updateCompanySchema from "../../schemas/companies/updateCompany.schema.json";


test("DELETE company - happy path @api @companies", async () => {
    const apiContext = await getAuthApiContext();
    const companies = new companiesClient(apiContext);
    const companyName = "Test Company " + randomString();

    const createRes = await companies.createCompany({
        name: companyName
    });

    const createBody = await createRes.json();
    const companyId = createBody.data.id;

    const getCompanyRes = await companies.getCompanyById(companyId);
    expect(getCompanyRes.status()).toBe(200);

    const deleteCompanyRes = await companies.deleteCompany(companyId);

    expect(deleteCompanyRes.status()).toBe(204);

    const getCompanyRes2 = await companies.getCompanyById(companyId);
    const getCompanyBody2 = await getCompanyRes2.json();

    expect(getCompanyBody2.statusCode).toBe(404);
    expect(getCompanyBody2.message[0]).toBe("Company not found");
});


test("DELETE company - invalid company id @api @companies", async () => {
    const apiContext = await getAuthApiContext();
    const companies = new companiesClient(apiContext);
    const companyId = randomString();

    const deleteRes = await companies.deleteCompany(companyId);

    expect(deleteRes.status()).toBe(404);

    const body = await deleteRes.json();

    expect(body.message).toBe("Company not found");
    expect(body.error).toBe("Not Found");
    expect(body.statusCode).toBe(404);
});


test("DELETE company - restore soft-deleted company", async () => {
    const apiContext = await getAuthApiContext();
    const companies = new companiesClient(apiContext);
    const companyName = "Test Company " + randomString();

    const createRes = await companies.createCompany({
        name: companyName
    });

    const createBody = await createRes.json();
    const companyId = createBody.data.id;
    const createdAt = createBody.data.createdAt;

    const getCompanyRes = await companies.getCompanyById(companyId);
    expect(getCompanyRes.status()).toBe(200);

    const deleteCompanyRes = await companies.deleteCompany(companyId);

    expect(deleteCompanyRes.status()).toBe(204);

    const getCompanyRes2 = await companies.getCompanyById(companyId);
    const getCompanyBody2 = await getCompanyRes2.json();

    expect(getCompanyBody2.statusCode).toBe(404);
    expect(getCompanyBody2.message[0]).toBe("Company not found");
    
    const restoreRes = await companies.restoreDeletedCompany(companyId);
    expect(restoreRes.status()).toBe(200);
    const restoreBody = await restoreRes.json();

    expect(restoreBody.statusCode).toBe(200);
    expect(restoreBody.message[0]).toBe("Data updated");
    expect(restoreBody.data.id).toBe(companyId);
    expect(restoreBody.data.name).toBe(companyName);
    expect(restoreBody.data.status).toBe("active");

    const getCompanyRes3 = await companies.getCompanyById(companyId);
    expect(getCompanyRes3.status()).toBe(200);
    const getCompanyBody3 = await getCompanyRes3.json();
    expect(getCompanyBody3.statusCode).toBe(200);
    expect(getCompanyBody3.data.id).toBe(companyId);
    expect(getCompanyBody3.data.name).toBe(companyName);
    expect(getCompanyBody3.data.status).toBe("active");
    expect(getCompanyBody3.data.createdAt).toBe(createdAt);

});