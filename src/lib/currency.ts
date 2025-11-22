/**
 * Currency configuration and formatting utilities
 */

export type CurrencyCode = 'USD' | 'PEN' | 'MXN' | 'COP' | 'CLP';

export interface CurrencyConfig {
    code: CurrencyCode;
    symbol: string;
    name: string;
    locale: string;
    decimals: number;
}

// Currency configurations
export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
    USD: {
        code: 'USD',
        symbol: '$',
        name: 'Dólar Estadounidense',
        locale: 'en-US',
        decimals: 2,
    },
    PEN: {
        code: 'PEN',
        symbol: 'S/.',
        name: 'Sol Peruano',
        locale: 'es-PE',
        decimals: 2,
    },
    MXN: {
        code: 'MXN',
        symbol: '$',
        name: 'Peso Mexicano',
        locale: 'es-MX',
        decimals: 2,
    },
    COP: {
        code: 'COP',
        symbol: '$',
        name: 'Peso Colombiano',
        locale: 'es-CO',
        decimals: 0,
    },
    CLP: {
        code: 'CLP',
        symbol: '$',
        name: 'Peso Chileno',
        locale: 'es-CL',
        decimals: 0,
    },
};

// Get currency from environment or default to PEN (Peruvian Sol)
const DEFAULT_CURRENCY: CurrencyCode = 'PEN';
const currencyCode = (process.env.NEXT_PUBLIC_CURRENCY as CurrencyCode) || DEFAULT_CURRENCY;

export const CURRENT_CURRENCY = CURRENCIES[currencyCode];

/**
 * Format a number as currency using the configured currency
 * @param amount - The amount to format
 * @param options - Optional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
    amount: number,
    options?: {
        showSymbol?: boolean;
        decimals?: number;
        locale?: string;
    }
): string {
    const {
        showSymbol = true,
        decimals = CURRENT_CURRENCY.decimals,
        locale = CURRENT_CURRENCY.locale,
    } = options || {};

    const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amount);

    if (showSymbol) {
        return `${CURRENT_CURRENCY.symbol} ${formatted}`;
    }

    return formatted;
}

/**
 * Get the currency symbol
 */
export function getCurrencySymbol(): string {
    return CURRENT_CURRENCY.symbol;
}

/**
 * Get the currency code
 */
export function getCurrencyCode(): CurrencyCode {
    return CURRENT_CURRENCY.code;
}

/**
 * Get the currency name
 */
export function getCurrencyName(): string {
    return CURRENT_CURRENCY.name;
}

/**
 * Parse a currency string to a number
 * @param value - The currency string to parse
 * @returns The parsed number
 */
export function parseCurrency(value: string): number {
    // Remove currency symbol and any non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
}
