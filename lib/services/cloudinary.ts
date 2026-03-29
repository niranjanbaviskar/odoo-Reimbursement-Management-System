import { v2 as cloudinary } from "cloudinary";

const isConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

export async function uploadReceipt(base64Image: string) {
    // Check if Cloudinary is configured
    if (!isConfigured) {
        // For development: store as data URL without upload
        if (process.env.NODE_ENV === "development") {
            return {
                url: base64Image.startsWith("data:") ? base64Image : `data:image/png;base64,${base64Image}`,
                publicId: "dev-local-receipt",
                isDemoMode: true,
            };
        }

        throw new Error(
            "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env"
        );
    }

    try {
        const upload = await cloudinary.uploader.upload(base64Image, {
            folder: "claimflow/receipts",
            resource_type: "auto",
        });

        return {
            url: upload.secure_url,
            publicId: upload.public_id,
        };
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw new Error(`Failed to upload receipt to Cloudinary: ${String(error)}`);
    }
}
