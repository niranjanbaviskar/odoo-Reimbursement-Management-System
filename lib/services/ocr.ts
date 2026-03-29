export type ParsedOCRReceipt = {
    merchant?: string;
    amount?: number;
    date?: string;
    tax?: number;
    lineItems?: string[];
    category?: string;
    description?: string;
};

function findMoneyValues(text: string) {
    const matches = text.match(/(?:\$|USD|EUR|INR|GBP)?\s?(\d+[\.,]\d{2})/gi) || [];
    return matches
        .map((raw) => Number(raw.replace(/[^0-9.]/g, "")))
        .filter((value) => !Number.isNaN(value));
}

function detectCategory(text: string) {
    const lower = text.toLowerCase();
    if (/hotel|flight|airlines|uber|taxi|travel/.test(lower)) return "Travel";
    if (/restaurant|food|cafe|dinner|lunch/.test(lower)) return "Food";
    if (/office|stationery|supplies/.test(lower)) return "Office Supplies";
    if (/software|subscription|saas/.test(lower)) return "Software";
    return "Other";
}

export function parseOCRReceipt(rawText: string): ParsedOCRReceipt {
    const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    const money = findMoneyValues(rawText);
    const amount = money.length ? Math.max(...money) : undefined;

    const dateMatch = rawText.match(/\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/);

    return {
        merchant: lines[0],
        amount,
        date: dateMatch?.[1],
        tax: money.length > 1 ? money.sort((a, b) => b - a)[1] : undefined,
        lineItems: lines.slice(1, 6),
        category: detectCategory(rawText),
        description: lines.slice(0, 3).join(" | "),
    };
}
