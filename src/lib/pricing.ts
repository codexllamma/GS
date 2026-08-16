export interface CartItemLike {
  price: number;
  quantity: number;
}

export interface PricingBreakdown {
  subtotal: number;
  totalQuantity: number;
  discountPercent: number;
  discountAmount: number;
  finalTotal: number;
}

export function calculateCartPricing(items: CartItemLike[]): PricingBreakdown {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  let discountPercent = 0;
  if (totalQuantity === 2) {
    discountPercent = 3;
  } else if (totalQuantity >= 3) {
    discountPercent = 5;
  }

  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return {
    subtotal,
    totalQuantity,
    discountPercent,
    discountAmount,
    finalTotal,
  };
}