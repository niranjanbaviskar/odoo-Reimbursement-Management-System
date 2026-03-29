import { ok, fail } from "@/lib/api";

export async function GET() {
    try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name,currencies", {
            next: { revalidate: 60 * 60 * 24 },
        });

        if (!response.ok) {
            return fail("Failed to load countries", 502);
        }

        const countries = (await response.json()) as Array<{
            name: { common: string };
            currencies?: Record<string, { name: string }>;
        }>;

        const data = countries
            .map((country) => ({
                country: country.name.common,
                currency: Object.keys(country.currencies || {})[0] || "USD",
            }))
            .sort((a, b) => a.country.localeCompare(b.country));

        return ok(data);
    } catch (error) {
        return fail("Failed to fetch country data", 500, String(error));
    }
}
