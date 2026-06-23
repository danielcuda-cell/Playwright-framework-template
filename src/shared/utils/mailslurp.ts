import MailSlurp from 'mailslurp-client';

let client: MailSlurp | null = null;

function getClient(): MailSlurp {
    if (!client) {
        const apiKey = process.env.MAILSLURP_API_KEY;
        if (!apiKey) throw new Error('MAILSLURP_API_KEY is not set in environment variables');
        client = new MailSlurp({ apiKey });
    }
    return client;
}

export async function createInbox(): Promise<{ id: string; emailAddress: string }> {
    const inbox = await getClient().createInbox();
    return { id: inbox.id!, emailAddress: inbox.emailAddress! };
}

export async function waitForLatestEmail(inboxId: string, timeoutMs = 30000) {
    return getClient().waitForLatestEmail(inboxId, timeoutMs, true);
}
