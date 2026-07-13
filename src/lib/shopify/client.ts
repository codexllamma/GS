const SHOP = process.env.SHOPIFY_SHOP_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!;
const API_VERSION = process.env.SHOPIFY_API_VERSION;

export async function shopifyFetch(
    endpoint: string,
    options: RequestInit = {}
) {
    const res = await fetch(
        `https://${SHOP}/admin/api/${API_VERSION}/${endpoint}`,
        {
            ...options,
            headers: {
                "X-Shopify-Access-Token": TOKEN,
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return res.json();
}