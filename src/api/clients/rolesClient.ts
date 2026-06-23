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

    async getRoleById(roleId: string): Promise<APIResponse> {
        return this.request.get(`${this.baseUrl}/role/${roleId}`, {
        });
    }

    async updateRole(roleId: string, payload: { label?: string, name?: string, description?: string }): Promise<APIResponse> {
        return this.request.patch(`${this.baseUrl}/role/${roleId}`, {
            data: payload
        });
    }

    async deleteRole(roleId: string): Promise<APIResponse> {
        return this.request.delete(`${this.baseUrl}/role/${roleId}`, {});
    }

}