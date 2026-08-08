import { OrderAggregate, OrderCreateInput, OrderAddressInput } from "../types/orders";

const CURRENCY = "INR";

const INDIAN_STATE_CODES: Record<string, string> = {
  maharashtra: "MH",
  delhi: "DL",
  karnataka: "KA",
  "tamil nadu": "TN",
  gujarat: "GJ",
  "uttar pradesh": "UP",
  telangana: "TG",
  "west bengal": "WB",
  rajasthan: "RJ",
  haryana: "HR",
  punjab: "PB",
  kerala: "KL",
  "andhra pradesh": "AP",
  "madhya pradesh": "MP",
  bihar: "BR",
  goa: "GA",
};

function sanitizeField(value?: string | null, fallback: string = ""): string {
  if (!value || value.trim().toUpperCase() === "N/A") {
    return fallback;
  }
  return value.trim();
}

function getProvinceCode(stateName: string): string {
  const normalized = stateName.toLowerCase().trim();
  return INDIAN_STATE_CODES[normalized] || "MH";
}

/**
 * Derives a clean First & Last name from User name or Email fallback
 */
function extractCustomerName(user?: OrderAggregate["user"]): { first: string; last: string } {
  if (user?.name && user.name.trim().length > 0) {
    const cleaned = user.name.trim().replace(/\s+/g, " ");
    const parts = cleaned.split(" ");
    return {
      first: parts[0],
      last: parts.slice(1).join(" ") || "Customer",
    };
  }

  if (user?.email) {
    const prefix = user.email.split("@")[0].replace(/[0-9_.-]+/g, " ").trim();
    if (prefix.length > 0) {
      const parts = prefix.split(" ");
      const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const last = parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
      return {
        first,
        last: last || "Customer",
      };
    }
  }

  return {
    first: "Valued",
    last: "Customer",
  };
}

export function mapOrderToOrderCreateInput(
  order: OrderAggregate
): OrderCreateInput {
  const { first, last } = extractCustomerName(order.user ?? undefined);

  const userEmail = order.user?.email ?? undefined;
  const rawPhone = sanitizeField(order.user?.phoneNumber, "");
  const userPhone = rawPhone ? rawPhone : undefined;

  // Primary address check with fallback to first saved user address
  const activeAddress = order.address || (order.user as any)?.addresses?.[0];

  const address1 = sanitizeField(activeAddress?.line1, "Main Street");
  const address2Raw = sanitizeField(activeAddress?.line2, "");
  const address2 = address2Raw ? address2Raw : undefined;

  const city = sanitizeField(activeAddress?.city, "Mumbai");
  const province = sanitizeField(activeAddress?.state, "Maharashtra");
  const zip = sanitizeField(activeAddress?.postal, "400001");
  const provinceCode = getProvinceCode(province);

  const shopifyCustomerId = (order.user as any)?.shopifyUserMapping?.shopifyCustomerId;

  const addressPayload: OrderAddressInput = {
    firstName: first,
    lastName: last,
    address1,
    ...(address2 ? { address2 } : {}),
    city,
    province,
    provinceCode,
    country: "India",
    countryCode: "IN",
    zip,
    ...(userPhone ? { phone: userPhone } : {}),
  };

  return {
    currency: CURRENCY,
    customerId: shopifyCustomerId || undefined,
    email: userEmail,
    financialStatus: order.isPaid ? "PAID" : "PENDING",

    shippingAddress: addressPayload,
    billingAddress: addressPayload,

    lineItems: order.orderItems.map((item) => {
      const shopifyVariantId = item.variant?.shopifyMapping?.shopifyVariantId;

      if (!shopifyVariantId) {
        throw new Error(
          `Variant ${item.variantId} on product ${item.productId} is missing Shopify mapping. Run syncProduct first.`
        );
      }

      return {
        quantity: item.quantity,
        variantId: shopifyVariantId,
        requiresShipping: true,
        paymentGatewayNames: order.isPaid ? ["Razorpay"] : ["Custom"],
        priceSet: {
          shopMoney: {
            amount: item.priceAtPurchase.toFixed(2),
            currencyCode: CURRENCY,
          },
        },
      };
    }),
  };
}