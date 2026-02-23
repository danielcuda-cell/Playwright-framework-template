import { request, APIRequestContext } from "@playwright/test";
import { getAuthToken } from "./auth";

export async function getAuthApiContext(): Promise<APIRequestContext> {
    const token = await getAuthToken();

    return request.newContext({
        extraHTTPHeaders: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
}

export async function getNoAuthApiContext(): Promise<APIRequestContext> {
    return await request.newContext({
        baseURL: process.env.API_URL,
        extraHTTPHeaders: {
            'Content-Type': 'application/json'
        }
    });
}