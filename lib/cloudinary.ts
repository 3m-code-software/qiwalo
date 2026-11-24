import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "qiwalo_units";

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

// Vercel functions accept at most ~4.5 MB of request body, so keep headroom.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function isCloudinaryConfigured(): boolean {
  return Boolean(cloudName && apiKey && apiSecret);
}

export interface UploadedImage {
  url: string;
  publicId: string;
}

export async function uploadUnitImage(file: File): Promise<UploadedImage> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("فقط الصور مسموحة.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("حجم الصورة لازم يكون أقل من 4 ميجابايت.");
  }

  const bytes = await file.arrayBuffer();
  const dataUri = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "qiwalo/units",
    upload_preset: uploadPreset,
    resource_type: "image",
    transformation: [{ width: 1600, height: 1200, crop: "limit" }],
  });

  return { url: result.secure_url, publicId: result.public_id };
}
