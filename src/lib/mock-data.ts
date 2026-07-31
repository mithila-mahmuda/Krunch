import type { Category, Product, Promotion } from "@/lib/types";

export const OPERATOR_NAME = "Kyle";
export const TILL_NAME = "TILL 1";

export const categories: Category[] = [
  { id: "barista", name: "Barista", tone: "drinks" },
  { id: "smoothies", name: "Smoothies", tone: "drinks" },
  { id: "bubble-tea", name: "Bubble Tea", tone: "drinks" },
  { id: "bar-buddies", name: "Bar Buddies", tone: "drinks" },
  { id: "spirits", name: "Spirits", tone: "drinks" },
  { id: "wines", name: "Wines", tone: "drinks" },
  { id: "beers", name: "Beers", tone: "drinks" },
  { id: "soft-drinks", name: "Soft Drinks", tone: "drinks" },
  { id: "brunch", name: "Brunch", tone: "food" },
  { id: "starters", name: "Starters", tone: "food" },
  { id: "mains", name: "Mains", tone: "food" },
  { id: "lunch-4-less", name: "Lunch 4 Less", tone: "food" },
  { id: "sides", name: "Sides", tone: "food" },
  { id: "extras", name: "Extras", tone: "food" },
  { id: "desserts", name: "Desserts", tone: "food" },
  { id: "deli", name: "Deli", tone: "special" },
  { id: "pantry", name: "The Pantry", tone: "retail" },
  { id: "branded", name: "Branded Products", tone: "retail" },
  { id: "aprons", name: "Aprons", tone: "retail" },
  { id: "ceramics", name: "Ceramics", tone: "retail" },
];

export const products: Product[] = [
  { id: "bruschetta", categoryId: "starters", name: "Bruschetta", price: 7.95 },
  { id: "nachos", categoryId: "starters", name: "Nachos", price: 8.5 },
  { id: "soup", categoryId: "starters", name: "Soup of the Day", price: 5.5 },
  { id: "calamari", categoryId: "starters", name: "Calamari", price: 9.25 },
  { id: "veg-risotto", categoryId: "mains", name: "Veg Risotto", price: 12.5 },
  { id: "stroganoff", categoryId: "mains", name: "Stroganoff V", price: 13.95 },
  { id: "burger", categoryId: "mains", name: "Classic Burger", price: 14.5 },
  { id: "fish-chips", categoryId: "mains", name: "Fish & Chips", price: 15.95 },
  { id: "carbonara", categoryId: "mains", name: "Carbonara", price: 13.25 },
  { id: "lunch-pasta", categoryId: "lunch-4-less", name: "Lunch Pasta", price: 8.99 },
  { id: "lunch-salad", categoryId: "lunch-4-less", name: "Lunch Salad", price: 7.99 },
  { id: "fries", categoryId: "sides", name: "Fries", price: 3.5 },
  { id: "salad-side", categoryId: "sides", name: "Side Salad", price: 3.95 },
  { id: "cheesecake", categoryId: "desserts", name: "Cheesecake", price: 6.5 },
  { id: "brownie", categoryId: "desserts", name: "Chocolate Brownie", price: 5.95 },
  { id: "americano", categoryId: "barista", name: "Americano", price: 2.8 },
  { id: "latte", categoryId: "barista", name: "Latte", price: 3.4 },
  { id: "cappuccino", categoryId: "barista", name: "Cappuccino", price: 3.4 },
  { id: "berry-smoothie", categoryId: "smoothies", name: "Berry Smoothie", price: 4.95 },
  { id: "mango-smoothie", categoryId: "smoothies", name: "Mango Smoothie", price: 4.95 },
  { id: "classic-bubble", categoryId: "bubble-tea", name: "Classic Bubble Tea", price: 4.5 },
  { id: "taro-bubble", categoryId: "bubble-tea", name: "Taro Bubble Tea", price: 4.75 },
  { id: "gin-tonic", categoryId: "spirits", name: "Gin & Tonic", price: 7.5 },
  { id: "whisky", categoryId: "spirits", name: "Whisky", price: 6.5 },
  { id: "soave", categoryId: "wines", name: "Soave 125ml", price: 5.2 },
  { id: "merlot", categoryId: "wines", name: "Merlot 125ml", price: 5.5 },
  { id: "lager", categoryId: "beers", name: "Lager Pint", price: 5.2 },
  { id: "ipa", categoryId: "beers", name: "IPA Pint", price: 5.8 },
  { id: "cola", categoryId: "soft-drinks", name: "Cola", price: 2.5 },
  { id: "lemonade", categoryId: "soft-drinks", name: "Lemonade", price: 2.5 },
  { id: "eggs-benedict", categoryId: "brunch", name: "Eggs Benedict", price: 11.5 },
  { id: "avocado-toast", categoryId: "brunch", name: "Avocado Toast", price: 9.95 },
  { id: "extra-cheese", categoryId: "extras", name: "Extra Cheese", price: 1.5 },
  { id: "garlic-bread", categoryId: "extras", name: "Garlic Bread", price: 3.95 },
  { id: "club-sandwich", categoryId: "deli", name: "Club Sandwich", price: 8.95 },
  { id: "ciabatta", categoryId: "deli", name: "Chicken Ciabatta", price: 7.95 },
  { id: "granola", categoryId: "pantry", name: "House Granola", price: 6.5 },
  { id: "coffee-beans", categoryId: "branded", name: "Coffee Beans 250g", price: 9.95 },
  { id: "apron-black", categoryId: "aprons", name: "Black Apron", price: 18 },
  { id: "mug", categoryId: "ceramics", name: "Krunch Mug", price: 12 },
];

export const promotions: Promotion[] = [
  {
    id: "two-mains",
    label: "Promotion Two Mains for 9.99",
    productIds: ["veg-risotto", "stroganoff", "burger", "fish-chips", "carbonara"],
    discountedUnitPrice: 4.995,
    requiredQuantity: 2,
  },
];

export const TAX_RATE = 0.2;
export const SERVICE_RATE = 0.1;
