from typing import Optional

KEYWORDS = {
    "electronics": ["laptop", "phone", "iphone", "macbook", "charger", "cable", "airpods", "earphones", "ipad", "tablet", "mouse", "keyboard"],
    "wallets_purses": ["wallet", "purse", "cardholder", "money clip", "cash"],
    "keys": ["key", "keys", "keychain", "room key", "bike key", "car key"],
    "id_cards_docs": ["id card", "student id", "passport", "license", "hall ticket", "certificate"],
    "bags_backpacks": ["backpack", "bag", "handbag", "duffel", "tote"],
    "water_bottles": ["bottle", "flask", "sipper", "thermos"],
    "books_stationery": ["notebook", "book", "textbook", "calculator", "pen", "pencil"],
}

def guess_category(text: str) -> Optional[str]:
    lower = text.lower()
    for cat, words in KEYWORDS.items():
        if any(w in lower for w in words):
            return cat
    return "other"
