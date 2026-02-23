import { APIRequestContext, APIResponse } from "@playwright/test";

export class companiesClient {

    private readonly request: APIRequestContext;
    private readonly baseUrl = process.env.API_BASE_URL;


    constructor(request: APIRequestContext) {
        this.request = request;
    }

    async createCompany(payload: {
        name: string
    }): Promise<APIResponse> {
        return this.request.post(`${this.baseUrl}/companies`, {
            data: payload
        });
    }

    async getAllCompanies(): Promise<APIResponse> {
        return this.request.get(`${this.baseUrl}/companies`, {
        });
    }

    async getCompanyById(companyId: string): Promise<APIResponse> {
        return this.request.get(`${this.baseUrl}/companies/${companyId}`, {
        });
    }

    async updateCompany(companyId: string, payload: { name: string }): Promise<APIResponse> {
        return this.request.patch(`${this.baseUrl}/companies/${companyId}`, {
            data: payload
        });
    }
}