// api/clients/usersClient.ts
import { APIRequestContext, APIResponse } from "@playwright/test";

export class ResourcesClient {

    private readonly request: APIRequestContext;
    private readonly baseUrl = process.env.API_BASE_URL;

    constructor(request: APIRequestContext) {
        this.request = request;
    }

    async createResource(payload: {
        title: string;
        body: string;
        userId: number
    }): Promise<APIResponse> {
        return this.request.post(`${this.baseUrl}/posts`, {
            data: payload
        });
    }

}