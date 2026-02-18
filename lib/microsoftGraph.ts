export async function getAccessToken() {
    const tenantId = process.env.MICROSOFT_TENANT_ID
    const clientId = process.env.MICROSOFT_CLIENT_ID
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET

    const response = await fetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId!,
                scope: "https://graph.microsoft.com/.default",
                client_secret: clientSecret!,
                grant_type: "client_credentials",
            }),
        }
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error("Failed to get access token")
    }

    return data.access_token
}

export async function sendGraphEmail(
    to: string[],
    subject: string,
    body: string
) {
    const token = await getAccessToken()

    const sender = process.env.MICROSOFT_SENDER_EMAIL

    const response = await fetch(
        `https://graph.microsoft.com/v1.0/users/${sender}/sendMail`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: {
                    subject,
                    body: {
                        contentType: "HTML",
                        content: body,
                    },
                    toRecipients: to.map(email => ({
                        emailAddress: { address: email },
                    })),
                },
            }),
        }
    )

    if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
    }

    return true
}
