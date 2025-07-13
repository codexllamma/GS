// pages/api/upload-product-image.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { supabase } from "@/lib/supabase";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error parsing form" });
    }

    const fileData = files.file;

    if (!fileData) {
      return res.status(400).json({ message: "File is required" });
    }

    const file = Array.isArray(fileData) ? fileData[0] : fileData;

    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }

    try {
      const fileData = fs.readFileSync(file.filepath);
      const fileExt = file.originalFilename?.split('.').pop();
      const fileName = `products/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('images') // replace with your bucket
        .upload(fileName, fileData, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.mimetype || 'image/jpeg',
        });

      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Error uploading to Supabase" });
      }

      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      return res.status(200).json({
        message: "Upload successful",
        url: publicUrlData.publicUrl,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });
}
