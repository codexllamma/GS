import { Product, ProductVariant, ProductImage,Fabric,Category } from "@/generated/prisma";

export interface ProductWithRelations extends Product {
  images: ProductImage[];
  variants?: ProductVariant[]; 
  fabric?: (Fabric & { category?: Category | null }) | null;
}

export interface CartVariant extends ProductVariant {
  product: ProductWithRelations;
}

export interface CartItem {
  id: string;
  quantity: number;
  variant: CartVariant;
}
