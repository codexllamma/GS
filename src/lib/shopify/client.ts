// lib/shopify/client.ts

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!;
const API_VERSION = process.env.SHOPIFY_API_VERSION!;

if (!SHOP) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN");
}

if (!TOKEN) {
  throw new Error("Missing SHOPIFY_ADMIN_ACCESS_TOKEN");
}

if (!API_VERSION) {
  throw new Error("Missing SHOPIFY_API_VERSION");
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: {
    message: string;
    locations?: {
      line: number;
      column: number;
    }[];
    path?: string[];
    extensions?: unknown;
  }[];
};

class ShopifyClient {
  private readonly baseUrl = `https://${SHOP}/admin/api/${API_VERSION}`;

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ) {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      ...options,
      headers: {
        "X-Shopify-Access-Token": TOKEN,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers ?? {}),
      },
    });

    if (!response.ok) {
      const error = await response.text();

      throw new Error(
        `Shopify API Error (${response.status}): ${error}`
      );
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async get(endpoint: string) {
    return this.request(endpoint, {
      method: "GET",
    });
  }

  async post(endpoint: string, body: unknown) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put(endpoint: string, body: unknown) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  }

  async graphql<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const result = await this.request("graphql.json", {
      method: "POST",
      body: JSON.stringify({
        query,
        variables,
      }),
    }) as GraphQLResponse<T>;

    if (result.errors?.length) {
      throw new Error(
        result.errors
          .map((error) => error.message)
          .join("\n")
      );
    }

    if (!result.data) {
      throw new Error("Shopify GraphQL returned no data.");
    }

    return result.data;
  }
}

export const shopify = new ShopifyClient();