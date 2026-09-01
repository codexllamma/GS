import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).send("Method Not Allowed");
  }

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.xn--hir-7la.com";

  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      include: {
        images: { orderBy: { isPrimary: "desc" } },
        variants: true,
        fabric: { include: { category: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const itemsXml = products
      .map((product) => {
        const primaryImage = product.images[0]?.url || "https://placehold.co/600x800/png?text=HIER+Product";
        const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
        const availability = totalStock > 0 ? "in stock" : "out of stock";
        const categoryName = product.fabric?.category?.name || "Clothing";

        return `
    <item>
      <g:id>${product.id}</g:id>
      <g:title><![CDATA[${product.name}]]></g:title>
      <g:description><![CDATA[${product.description || product.name}]]></g:description>
      <g:link>${BASE_URL}/?product=${product.id}</g:link>
      <g:image_link><![CDATA[${primaryImage}]]></g:image_link>
      <g:brand>HIÈR</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${product.basePrice}.00 INR</g:price>
      <g:product_type><![CDATA[${categoryName}]]></g:product_type>
      <g:color><![CDATA[${product.color}]]></g:color>
      
      <!-- Critical Google Apparel Tags -->
      <g:google_product_category>1604</g:google_product_category> <!-- 1604 = Apparel & Accessories > Clothing -->
      <g:identifier_exists>no</g:identifier_exists> <!-- Tells Google you are a custom brand without barcodes -->
      <g:age_group>adult</g:age_group>
      <g:gender>unisex</g:gender>
    </item>`;
      })
      .join("");

    const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>HIÈR Google Shopping Feed</title>
    <link>${BASE_URL}</link>
    <description>HIÈR Official Catalog Feed</description>
    ${itemsXml}
  </channel>
</rss>`;

    res.setHeader("Content-Type", "text/xml; charset=UTF-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).send(feedXml);
  } catch (error: any) {
    console.error("[GOOGLE FEED ERROR]:", error);
    return res.status(500).send("Internal Server Error");
  }
}