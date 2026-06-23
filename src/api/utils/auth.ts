import { request } from "@playwright/test";

let cachedToken: string | null = null;
let TokenExpiresAt = 0;

export async function getAuthToken(): Promise<string> {

    const now = Date.now();

    // Reuse the token if still valid
    if (cachedToken && now < TokenExpiresAt) {
        return cachedToken
    }

    const context = await request.newContext();

    const response = await context.post(
        `${process.env.AUTH_BASE_URL}/oauth/token`,
        {
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                client_id: process.env.AUTH0_CLIENT_ID,
                client_secret: process.env.AUTH0_CLIENT_SECRET,
                audience: process.env.AUTH0_AUDIENCE,
                grant_type: 'client_credentials'
            }
        }
    );

    if (!response.ok()) {
        throw new Error(`Failed to obtain auth token: ${response.status()} ${response.statusText()}`);
    }

    const body = await response.json();

    cachedToken = body.access_token;
    TokenExpiresAt = now + body.expires_in * 1000 - 60000; // Refresh 1 minute before expiry

    return cachedToken!;
}