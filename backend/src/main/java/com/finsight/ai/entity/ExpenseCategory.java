package com.finsight.ai.entity;

public enum ExpenseCategory {
    FOOD_DINING("Food & Dining"),
    TRANSPORTATION("Transportation"),
    SHOPPING("Shopping"),
    ENTERTAINMENT("Entertainment"),
    BILLS_UTILITIES("Bills & Utilities"),
    HEALTHCARE("Healthcare"),
    EDUCATION("Education"),
    TRAVEL("Travel"),
    GROCERIES("Groceries"),
    PERSONAL_CARE("Personal Care"),
    BUSINESS("Business"),
    GIFTS_DONATIONS("Gifts & Donations"),
    INVESTMENTS("Investments"),
    CRYPTO("Crypto & Digital Assets"),
    OTHER("Other");

    private final String displayName;

    ExpenseCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
