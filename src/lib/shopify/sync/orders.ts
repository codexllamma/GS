import prisma from "@/lib/prisma";
import { ShopifyOrder } from "../types/orders";
import { mapOrderToOrderCreateInput } from "../mappers/orders";
import { syncShopifyOrder } from "../services/orders";
import { persistOrderMappings } from "../services/mappings";


export async function syncOrder(
    orderId: string
): Promise<ShopifyOrder> {

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },

      include: {
        user: true,

        address: true,

        orderItems: {
          include: {
            variant: {
              include: {
                shopifyMapping: true,
              },
            },
          },
        },

        shopifyMapping: true,
      },
    });

    if (!order) {
        throw new Error("Order not found");
    }

    const payload = mapOrderToOrderCreateInput(order);

    const shopifyOrder = await syncShopifyOrder(payload);

    await persistOrderMappings(
        order,
        shopifyOrder
    );


    return shopifyOrder;
}