// Helpers: base64url, PEM→ArrayBuffer, JWT sign with WebCrypto
function base64url(buf) {
    let str = btoa(String.fromCharCode(...new Uint8Array(buf)));
    return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function importPkcs8Pem(pem) {
    const b64 = pem
        .replace(/-----BEGIN PRIVATE KEY-----/g, "")
        .replace(/-----END PRIVATE KEY-----/g, "")
        .replace(/\s+/g, "");
    const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;

    return crypto.subtle.importKey(
        "pkcs8",
        raw,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );
}

async function signJwtRS256(headerObj, payloadObj, privateKey) {
    const enc = new TextEncoder();
    const header = base64url(enc.encode(JSON.stringify(headerObj)));
    const payload = base64url(enc.encode(JSON.stringify(payloadObj)));
    const data = `${header}.${payload}`;
    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        privateKey,
        enc.encode(data)
    );
    return `${data}.${base64url(signature)}`;
}

export default {
    async fetch(request, env) {
        const cors = {
            "Access-Control-Allow-Origin": env.ALLOW_ORIGIN, // e.g. https://yourname.github.io
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: cors });
        }
        if (request.method !== "POST") {
            return new Response("Only POST allowed", { status: 405, headers: cors });
        }

        try {
            const { title, body } = await request.json();
            if (!title || !body) {
                return new Response(JSON.stringify({ error: "Missing title/body" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" }});
            }

            // 1) Create a JWT for the GitHub App
            const now = Math.floor(Date.now() / 1000);
            const payload = {
                iat: now - 60,                // backdate 60s to allow clock skew
                exp: now + 9 * 60,            // max ~10 minutes
                iss: env.GH_APP_ID            // GitHub App ID
            };

            const pk = await importPkcs8Pem(env.GH_PRIVATE_KEY_PKCS8);
            const jwt = await signJwtRS256({ alg: "RS256", typ: "JWT" }, payload, pk);

            // 2) Exchange for an installation access token
            const tokenResp = await fetch(
                `https://api.github.com/app/installations/${env.GH_INSTALLATION_ID}/access_tokens`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${jwt}`,
                        "Accept": "application/vnd.github+json"
                    }
                }
            );
            const tokenJson = await tokenResp.json();
            if (!tokenResp.ok) {
                return new Response(JSON.stringify({ error: "Installation token error", details: tokenJson }), { status: tokenResp.status, headers: { ...cors, "Content-Type": "application/json" }});
            }
            const accessToken = tokenJson.token;

            // 3) Create the issue
            const issueResp = await fetch(`https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/issues`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Accept": "application/vnd.github+json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ title, body })
            });

            const issueJson = await issueResp.json();
            return new Response(JSON.stringify(issueJson), { status: issueResp.status, headers: { ...cors, "Content-Type": "application/json" }});

        } catch (err) {
            return new Response(JSON.stringify({ error: "Unexpected error", details: String(err) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" }});
        }
    }
};
