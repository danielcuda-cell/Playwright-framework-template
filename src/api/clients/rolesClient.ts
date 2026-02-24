import { APIRequestContext, APIResponse } from "@playwright/test";

export class rolesClient {

    private readonly request: APIRequestContext;
    private readonly baseUrl = process.env.API_BASE_URL;


    constructor(request: APIRequestContext) {
        this.request = request;
    }

    async createRole(payload: {
        label: string,
        name: string,
        description: string
    }): Promise<APIResponse> {
        return this.request.post(`${this.baseUrl}/role`, {
            data: payload
        });
    }

    async getAllRoles(): Promise<APIResponse> {
        return this.request.get(`${this.baseUrl}/role/list`, {
        });
    }

    async getRoleById(companyId: string): Promise<APIResponse> {
        return this.request.get(`${this.baseUrl}/role/${companyId}`, {
        });
    }

    async updateRole(companyId: string, payload: { name: string }): Promise<APIResponse> {
        return this.request.patch(`${this.baseUrl}/role/${companyId}`, {
            data: payload
        });
    }

    async deleteRole(companyId: string): Promise<APIResponse> {
        return this.request.delete(`${this.baseUrl}/role/${companyId}`, {});
    }

}