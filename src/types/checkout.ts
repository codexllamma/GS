
export interface GuestCartItemInput {
  variantId: string;
  quantity: number;
}

export interface CheckoutApiRequest {
  pincode: string;
  guestItems?: GuestCartItemInput[];
}

export interface CheckoutApiResponse {
  success: boolean;
  checkoutSessionId: string;
  razorpayOrder: any;
}

export interface CartSnapshotItem {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  price: number; // Matches Float/Int
  quantity: number;
}

/**
 * Payload sent from Frontend to create a CheckoutSession
 */
export interface CreateCheckoutSessionPayload {
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
  pincode?: string; // Optional on initial click, updated during Magic Checkout
}

/**
 * Response returned by /api/checkout/session
 */
export interface CreateCheckoutSessionResponse {
  success: boolean;
  sessionId: string;
  amount: number;
  currency: string;
}