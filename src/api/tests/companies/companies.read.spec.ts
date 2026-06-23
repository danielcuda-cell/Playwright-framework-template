import { test, expect } from "@playwright/test";
import { companiesClient } from "../../clients/companiesClient";
import { getAuthApiContext } from "../../utils/apiContext";
import { randomString } from "../../../shared/utils/random";
import { validateSchema } from "../../utils/helper";
import getAllCompaniesSchema from "../../schemas/companies/getAllCompanies.schema.json";
import getCompanyByIdSchema from "../../schemas/companies/getCompanyById.schema.json";


test("GET all companies @api @companies", async () => {
    const apiContext = await getAuthApiContext();
    const companies = new companiesClient(apiContext);

    const response = await companies.getAllCompanies();
    expect(response.status()).toBe(200);

    const body = await response.json();

    validateSchema(getAllCompaniesSchema, body);

    expect(body.statusCode).toBe(200);
    expect(Array.isArray(body.data.items)).toBe(true);
});


test("GET company by id - happy path @api @companies", async () => {

    const companyName = "Test Company " + randomString();
    const apiContext = await getAuthApiContext();
    const companies = new companiesClient(apiContext);
    const createRes = await companies.createCompany({ name: companyName });
    const createBody = await createRes.json();

    const companyId = createBody.data.id;

    const res = await companies.getCompanyById(companyId);
    const body = await res.json();

    console.log(body);
    validateSchema(getCompanyByIdSchema, body);

    expect(body.statusCode).toBe(200);
    expect(body.data.id).toBe(companyId);
    expect(body.data.name).toBeDefined();
    expect(body.data.name).toBe(companyName);
    expect(body.data.status).toBe("active");

});