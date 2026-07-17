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

  zip: string;

  phone?: string;
}

export interface OrderCreateInput {
  currency: string;

  lineItems: OrderLineItemInput[];

  billingAddress: OrderAddressInput;

  shippingAddress: OrderAddressInput;

  email?: string;

  financialStatus?: string;

  note?: string;
}

export interface ShopifyOrder {
  id: string;

  name: string;

  number: number;

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
    order: ShopifyOrder;

    userErrors: {
      field?: string[];
      message: string;
    }[];
  };
}