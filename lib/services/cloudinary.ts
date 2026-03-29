import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadReceipt(base64Image: string) {
    const upload = await cloudinary.uploader.upload(base64Image, {
        folder: "claimflow/receipts",
    });

    return {
        url: upload.secure_url,
        publicId: upload.public_id,
    };
}
