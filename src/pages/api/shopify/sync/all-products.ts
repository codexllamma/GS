import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { syncProduct } from "@/lib/shopify/sync/products";

interface SyncFailure {
  id: string;
  name: string;
  error: string;
}

interface SyncSuccess {
  id: string;
  name: string;
  shopifyId: string;
}

const DELAY_MS = 500; // Delay between syncs to respect Shopify GraphQL rate limits
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Allow POST (and GET for quick browser testing)
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  console.log("\n=======================================================");
  console.log("🚀 STARTING BULK SHOPIFY PRODUCT & INVENTORY SYNC");
  console.log("=======================================================\n");

  const startTime = Date.now();

  try {
    // 1. Fetch all active products
    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const total = products.length;

    if (total === 0) {
      console.log("⚠️  No active products found in the database to sync.");
      return res.status(200).json({
        success: true,
        message: "No active products found in the database to sync.",
        total: 0,
        successes: [],
        failures: [],
      });
    }

    console.log(`📦 Found ${total} product(s) to synchronize.\n`);

    const successes: SyncSuccess[] = [];
    const failures: SyncFailure[] = [];

    // 2. Sequential product sync
    for (let i = 0; i < total; i++) {
      const { id, name } = products[i];
      const progress = `[${i + 1}/${total}]`;

      console.log(`${progress} 🔄 Syncing: "${name}" (ID: ${id})...`);

      try {
        const shopifyProduct = await syncProduct(id);

        console.log(
          `${progress} ✅ Success: "${name}" -> Shopify ID: ${shopifyProduct.id}`
        );

        successes.push({
          id,
          name,
          shopifyId: shopifyProduct.id,
        });
      } catch (err: any) {
        const errorMessage = err?.message || String(err);

        console.error(
          `${progress} ❌ FAILED: "${name}" (ID: ${id})\n   Error: ${errorMessage}`
        );

        failures.push({
          id,
          name,
          error: errorMessage,
        });
      }

      // Small pause between items to prevent hitting API cost ceilings
      if (i < total - 1) {
        await sleep(DELAY_MS);
      }
    }

    // 3. Terminal Summary Report
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n=======================================================");
    console.log("📊 SYNC COMPLETED SUMMARY REPORT");
    console.log("=======================================================");
    console.log(`⏱️  Total Duration : ${duration}s`);
    console.log(`📦 Total Products : ${total}`);
    console.log(`✅ Successful     : ${successes.length}`);
    console.log(`❌ Failed         : ${failures.length}`);

    if (failures.length > 0) {
      console.log("\n🚨 Failed Products Breakdown:");
      failures.forEach((f, idx) => {
        console.log(
          `   ${idx + 1}. [${f.id}] "${f.name}"\n     Reason: ${f.error}`
        );
      });
    }
    console.log("=======================================================\n");

    // 4. Return HTTP Response
    return res.status(200).json({
      success: failures.length === 0,
      duration: `${duration}s`,
      total,
      successCount: successes.length,
      failureCount: failures.length,
      successes,
      failures,
    });
  } catch (criticalError: any) {
    console.error("💥 Fatal error during bulk sync execution:", criticalError);
    return res.status(500).json({
      success: false,
      error: criticalError?.message || "Internal server error during bulk sync",
    });
  }
}