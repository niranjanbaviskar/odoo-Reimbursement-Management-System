import { ok, fail } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { uploadReceipt } from "@/lib/services/cloudinary";

export async function POST(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return fail("Unauthorized", 401);
        }

        const body = (await req.json()) as { imageBase64?: string };
        if (!body.imageBase64) {
            return fail("imageBase64 is required");
        }

        const uploaded = await uploadReceipt(body.imageBase64);
        return ok(uploaded);
    } catch (error) {
        return fail("Upload failed", 500, String(error));
    }
}
