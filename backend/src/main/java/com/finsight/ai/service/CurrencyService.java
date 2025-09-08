package com.finsight.ai.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class CurrencyService {

    private static final Map<String, String> CURRENCY_SYMBOLS = new HashMap<>();
    private static final Map<String, String> CURRENCY_REGIONS = new HashMap<>();
    private static final Map<String, String> CURRENCY_NAMES = new HashMap<>();

    static {
        // Currency symbols mapping
        CURRENCY_SYMBOLS.put("ZAR", "R");
        CURRENCY_SYMBOLS.put("USD", "$");
        CURRENCY_SYMBOLS.put("EUR", "€");
        CURRENCY_SYMBOLS.put("GBP", "£");
        CURRENCY_SYMBOLS.put("JPY", "¥");
        CURRENCY_SYMBOLS.put("CAD", "C$");
        CURRENCY_SYMBOLS.put("AUD", "A$");
        CURRENCY_SYMBOLS.put("CHF", "CHF");
        CURRENCY_SYMBOLS.put("CNY", "¥");
        CURRENCY_SYMBOLS.put("INR", "₹");
        CURRENCY_SYMBOLS.put("NGN", "₦");
        CURRENCY_SYMBOLS.put("KES", "KSh");
        CURRENCY_SYMBOLS.put("BWP", "P");
        CURRENCY_SYMBOLS.put("NAD", "N$");

        // Currency to region mapping
        CURRENCY_REGIONS.put("ZAR", "South Africa");
        CURRENCY_REGIONS.put("USD", "United States");
        CURRENCY_REGIONS.put("EUR", "Europe");
        CURRENCY_REGIONS.put("GBP", "United Kingdom");
        CURRENCY_REGIONS.put("JPY", "Japan");
        CURRENCY_REGIONS.put("CAD", "Canada");
        CURRENCY_REGIONS.put("AUD", "Australia");
        CURRENCY_REGIONS.put("CHF", "Switzerland");
        CURRENCY_REGIONS.put("CNY", "China");
        CURRENCY_REGIONS.put("INR", "India");
        CURRENCY_REGIONS.put("NGN", "Nigeria");
        CURRENCY_REGIONS.put("KES", "Kenya");
        CURRENCY_REGIONS.put("BWP", "Botswana");
        CURRENCY_REGIONS.put("NAD", "Namibia");

        // Currency names
        CURRENCY_NAMES.put("ZAR", "South African Rand");
        CURRENCY_NAMES.put("USD", "US Dollar");
        CURRENCY_NAMES.put("EUR", "Euro");
        CURRENCY_NAMES.put("GBP", "British Pound");
        CURRENCY_NAMES.put("JPY", "Japanese Yen");
        CURRENCY_NAMES.put("CAD", "Canadian Dollar");
        CURRENCY_NAMES.put("AUD", "Australian Dollar");
        CURRENCY_NAMES.put("CHF", "Swiss Franc");
        CURRENCY_NAMES.put("CNY", "Chinese Yuan");
        CURRENCY_NAMES.put("INR", "Indian Rupee");
        CURRENCY_NAMES.put("NGN", "Nigerian Naira");
        CURRENCY_NAMES.put("KES", "Kenyan Shilling");
        CURRENCY_NAMES.put("BWP", "Botswana Pula");
        CURRENCY_NAMES.put("NAD", "Namibian Dollar");
    }

    /**
     * Get the display symbol for a currency (e.g., "R" for ZAR, "$" for USD)
     */
    public String getCurrencySymbol(String currencyCode) {
        return CURRENCY_SYMBOLS.getOrDefault(currencyCode, currencyCode);
    }

    /**
     * Get the region/country for a currency
     */
    public String getCurrencyRegion(String currencyCode) {
        return CURRENCY_REGIONS.getOrDefault(currencyCode, "International");
    }

    /**
     * Get the full name of a currency
     */
    public String getCurrencyName(String currencyCode) {
        return CURRENCY_NAMES.getOrDefault(currencyCode, currencyCode);
    }

    /**
     * Format an amount with the appropriate currency symbol
     */
    public String formatAmount(double amount, String currencyCode) {
        String symbol = getCurrencySymbol(currencyCode);
        
        // Format with appropriate decimal places
        if (amount == Math.floor(amount)) {
            // Whole number
            return String.format("%s %.0f", symbol, amount);
        } else {
            // With decimals
            return String.format("%s %.2f", symbol, amount);
        }
    }

    /**
     * Check if currency uses symbol before amount (like $ or R) or after (like EUR)
     */
    public boolean isSymbolPrefix(String currencyCode) {
        // Most currencies use prefix, but some like EUR might use suffix in certain regions
        return true; // For now, keeping it simple
    }

    /**
     * Get localized financial advice context based on currency/region
     */
    public String getRegionalContext(String currencyCode) {
        switch (currencyCode) {
            case "ZAR":
                return "South African financial context (banks: FNB, Standard Bank, Capitec; investments: JSE, unit trusts)";
            case "USD":
                return "US financial context (banks: Chase, Bank of America; investments: stocks, 401k, IRA)";
            case "EUR":
                return "European financial context (banks vary by country; investments: UCITS funds, ETFs)";
            case "GBP":
                return "UK financial context (banks: Barclays, HSBC; investments: ISAs, pensions)";
            default:
                return "International financial context";
        }
    }
}
