import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase"; // Use your existing client

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const BUCKET_NAME = "images";
    const FOLDER_NAME = "hero";

    // 1. List files inside the 'hero' folder of the 'images' bucket
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME) 
      .list(FOLDER_NAME, {
        limit: 20,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      console.error("Supabase Storage Error:", error);
      return res.status(500).json({ message: error.message });
    }

    if (!data || data.length === 0) {
      // Return empty array if folder is empty (prevents crash)
      return res.status(200).json([]);
    }

    // 2. Generate Public URLs
    const urls = data
      .filter((item) => item.name !== ".emptyFolderPlaceholder") // Ignore system file
      .map((item) => {
        // Path logic: folder/filename
        const filePath = `${FOLDER_NAME}/${item.name}`;
        
        const publicUrlData = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);
          
        return publicUrlData.data.publicUrl;
      });

    return res.status(200).json(urls);

  } catch (error) {
    console.error("Hero API internal error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}