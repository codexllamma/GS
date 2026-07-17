import { Prisma } from "@/generated/prisma";

export type ProductAggregate = Prisma.ProductGetPayload<{
  include: {
    variants: true;
    images: true;

    fabric: {
      include: {
        category: true;
      };
    };
  };
}>;

export interface ProductOptionInput {
  name: string;

  values: {
    name: string;
  }[];
}

export interface ProductVariantSetInput {
  optionValues: {
    optionName: string;
    name: string;
  }[];

  price: string;

  inventoryItem?: {
    tracked: boolean;
  };
}

export interface ProductSetInput {
  title: string;

  descriptionHtml: string;

  vendor: string;

  productType?: string;

  status: "ACTIVE" | "DRAFT" | "ARCHIVED";

  tags: string[];

  giftCard: boolean;

  productOptions: ProductOptionInput[];

  variants: ProductVariantSetInput[];
}

export interface ShopifyVariant {
  id: string;

  selectedOptions: {
    name: string;
    value: string;
  }[];

  inventoryItem: {
    id: string;
  };
}


export interface ShopifyProduct {
  id: string;

  title: string;

  variants: {
    nodes: ShopifyVariant[];
  };
}

export interface ProductSetResponse {
  productSet: {
    product: ShopifyProduct | null;

    userErrors: {
      field: string[];
      message: string;
    }[];
  };
}

export interface InventoryQuantityInput {
  inventoryItemId: string;
  locationId: string;
  quantity: number;
  changeFromQuantity?: number | null;
}


export interface InventorySetQuantitiesInput {
  reason: string;
  referenceDocumentUri?: string | null;
  name: string;
  quantities: InventoryQuantityInput[];
}

export interface InventoryAdjustmentGroup {
  id: string;
  reason: string;
  referenceDocumentUri: string | null;
}

export interface InventorySetQuantitiesUserError {
  field: string[] | null;
  message: string;
  code: string;
}

export interface InventorySetQuantitiesResponse {
  inventorySetQuantities: {
    inventoryAdjustmentGroup: InventoryAdjustmentGroup | null;
    userErrors: InventorySetQuantitiesUserError[];
  };
}

