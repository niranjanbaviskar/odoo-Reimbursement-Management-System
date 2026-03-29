type RestCountry = {
    name: { common: string };
    currencies?: Record<string, { name: string; symbol?: string }>;
};

const COUNTRY_API = "https://restcountries.com/v3.1/all?fields=name,currencies";

let countryCurrencyCache: Map<string, string> | null = null;

async function loadCountryCurrencyMap() {
    if (countryCurrencyCache) return countryCurrencyCache;

    const response = await fetch(COUNTRY_API, {
        next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch country/currency mapping");
    }

    const countries = (await response.json()) as RestCountry[];
    const map = new Map<string, string>();

    countries.forEach((country) => {
        const code = Object.keys(country.currencies || {})[0];
        if (code) {
            map.set(country.name.common.toLowerCase(), code);
        }
    });

    countryCurrencyCache = map;
    return map;
}

export async function getCountryCurrency(country: string) {
    const map = await loadCountryCurrencyMap();
    return map.get(country.toLowerCase()) ?? "USD";
}

export async function convertCurrency(amount: number, fromCurrency: string, toCurrency: string) {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${encodeURIComponent(fromCurrency)}`,
        { cache: "no-store" },
    );

    if (!response.ok) {
        throw new Error("Failed currency conversion");
    }

    const data = (await response.json()) as { rates: Record<string, number> };
    const rate = data.rates[toCurrency];

    if (!rate) {
        throw new Error(`Missing exchange rate from ${fromCurrency} to ${toCurrency}`);
    }

    return Number((amount * rate).toFixed(2));
}
