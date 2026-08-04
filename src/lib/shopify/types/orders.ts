// types/orders.ts

import { Prisma } from "@/generated/prisma";

export type OrderAggregate = Prisma.OrderGetPayload<{
  include: {
    user: true;
    address: true;
    orderItems: {
      include: {
        variant: {
          include: {
            shopifyMapping: true;
          };
        };
      };
    };
    shopifyMapping: true;
  };
}>;

export interface OrderLineItemInput {
  quantity: number;
  variantId: string;
  priceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
}

export interface OrderAddressInput {
  firstName?: string;
  lastName?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  provinceCode?: string; // e.g. "MH"
  countryCode?: string;
  zip: string;
  phone?: string;
}

export interface OrderCreateInput {
  currency: string;
  customerId?: string; // Updated: Allows linking directly to existing Shopify Customer IDs
  lineItems: OrderLineItemInput[];
  billingAddress: OrderAddressInput;
  shippingAddress: OrderAddressInput;
  email?: string;
  financialStatus?: string;
  note?: string;
}

export interface ShopifyCustomer {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface ShopifyOrder {
  id: string;
  name: string;
  number: number;
  customer?: ShopifyCustomer | null; // Updated: Captures customer ID returned by Shopify orderCreate
  lineItems: {
    nodes: {
      id: string;
      quantity: number;
      product: {
        id: string;
      } | null;
      variant: {
        id: string;
      } | null;
    }[];
  };
}

export interface OrderCreateResponse {
  orderCreate: {
    order: ShopifyOrder | null; // Updated: Made nullable to account for GraphQL userErrors
    userErrors: {
      field?: string[];
      message: string;
    }[];
  };
}