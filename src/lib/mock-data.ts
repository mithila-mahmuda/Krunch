import type { Category, Product, Promotion } from "@/lib/types";

export const OPERATOR_NAME = "Kyle";
export const TILL_NAME = "TILL 1";

/** Demo menu — general café / casual dining, no alcohol or retail merch. */
export const categories: Category[] = [
  { id: "hot-drinks", name: "Hot Drinks", tone: "drinks", sortOrder: 0 },
  { id: "cold-drinks", name: "Cold Drinks", tone: "drinks", sortOrder: 1 },
  { id: "smoothies", name: "Smoothies", tone: "drinks", sortOrder: 2 },
  { id: "bubble-tea", name: "Bubble Tea", tone: "drinks", sortOrder: 3 },
  { id: "snacks", name: "Snacks", tone: "food", sortOrder: 4 },
  { id: "breakfast", name: "Breakfast", tone: "food", sortOrder: 5 },
  { id: "starters", name: "Starters", tone: "food", sortOrder: 6 },
  { id: "mains", name: "Mains", tone: "food", sortOrder: 7 },
  { id: "sides", name: "Sides", tone: "food", sortOrder: 8 },
  { id: "sandwiches", name: "Sandwiches", tone: "special", sortOrder: 9 },
  { id: "desserts", name: "Desserts", tone: "food", sortOrder: 10 },
  { id: "extras", name: "Extras", tone: "food", sortOrder: 11 },
];

export const products: Product[] = [
  // Hot drinks — sizes as separate items
  { id: "americano-reg", categoryId: "hot-drinks", name: "Americano Regular", price: 2.8, sortOrder: 0 },
  { id: "americano-large", categoryId: "hot-drinks", name: "Americano Large", price: 3.4, sortOrder: 1 },
  { id: "latte-reg", categoryId: "hot-drinks", name: "Latte Regular", price: 3.4, sortOrder: 2 },
  { id: "latte-large", categoryId: "hot-drinks", name: "Latte Large", price: 4.0, sortOrder: 3 },
  { id: "cappuccino-reg", categoryId: "hot-drinks", name: "Cappuccino Regular", price: 3.4, sortOrder: 4 },
  { id: "cappuccino-large", categoryId: "hot-drinks", name: "Cappuccino Large", price: 4.0, sortOrder: 5 },
  { id: "flat-white", categoryId: "hot-drinks", name: "Flat White", price: 3.6, sortOrder: 6 },
  { id: "mocha", categoryId: "hot-drinks", name: "Mocha", price: 3.9, sortOrder: 7 },
  { id: "masala-tea", categoryId: "hot-drinks", name: "Masala Tea", price: 2.2, sortOrder: 8 },
  { id: "green-tea", categoryId: "hot-drinks", name: "Green Tea", price: 2.0, sortOrder: 9 },

  // Cold drinks
  { id: "cola", categoryId: "cold-drinks", name: "Cola", price: 2.5, sortOrder: 0 },
  { id: "lemonade", categoryId: "cold-drinks", name: "Lemonade", price: 2.5, sortOrder: 1 },
  { id: "orange-juice", categoryId: "cold-drinks", name: "Fresh Orange Juice", price: 3.5, sortOrder: 2 },
  { id: "iced-latte", categoryId: "cold-drinks", name: "Iced Latte", price: 3.8, sortOrder: 3 },
  { id: "mineral-water", categoryId: "cold-drinks", name: "Mineral Water", price: 1.5, sortOrder: 4 },

  // Smoothies
  { id: "mango-smoothie", categoryId: "smoothies", name: "Mango Smoothie", price: 4.95, sortOrder: 0 },
  { id: "berry-smoothie", categoryId: "smoothies", name: "Berry Smoothie", price: 4.95, sortOrder: 1 },
  { id: "banana-smoothie", categoryId: "smoothies", name: "Banana Smoothie", price: 4.5, sortOrder: 2 },

  // Bubble tea
  { id: "classic-bubble", categoryId: "bubble-tea", name: "Classic Bubble Tea", price: 4.5, sortOrder: 0 },
  { id: "taro-bubble", categoryId: "bubble-tea", name: "Taro Bubble Tea", price: 4.75, sortOrder: 1 },
  { id: "brown-sugar-bubble", categoryId: "bubble-tea", name: "Brown Sugar Bubble Tea", price: 5.0, sortOrder: 2 },

  // Snacks
  { id: "french-fries-reg", categoryId: "snacks", name: "French Fries Regular", price: 3.5, sortOrder: 0 },
  { id: "french-fries-large", categoryId: "snacks", name: "French Fries Large", price: 4.75, sortOrder: 1 },
  { id: "loaded-fries", categoryId: "snacks", name: "Loaded Fries", price: 6.5, sortOrder: 2 },
  { id: "chicken-nuggets", categoryId: "snacks", name: "Chicken Nuggets", price: 5.5, sortOrder: 3 },
  { id: "onion-rings", categoryId: "snacks", name: "Onion Rings", price: 4.25, sortOrder: 4 },

  // Breakfast
  { id: "avocado-toast", categoryId: "breakfast", name: "Avocado Toast", price: 9.95, sortOrder: 0 },
  { id: "cheese-omelette", categoryId: "breakfast", name: "Cheese Omelette", price: 8.5, sortOrder: 1 },
  { id: "pancakes", categoryId: "breakfast", name: "Pancakes", price: 7.95, sortOrder: 2 },
  { id: "paratha-set", categoryId: "breakfast", name: "Paratha Set", price: 6.5, sortOrder: 3 },

  // Starters
  { id: "soup", categoryId: "starters", name: "Soup of the Day", price: 5.5, sortOrder: 0 },
  { id: "spring-rolls", categoryId: "starters", name: "Vegetable Spring Rolls", price: 6.95, sortOrder: 1 },
  { id: "chicken-wings", categoryId: "starters", name: "Chicken Wings", price: 8.5, sortOrder: 2 },
  { id: "garlic-bread", categoryId: "starters", name: "Garlic Bread", price: 3.95, sortOrder: 3 },

  // Mains
  { id: "chicken-burger", categoryId: "mains", name: "Chicken Burger", price: 12.5, sortOrder: 0 },
  { id: "beef-burger", categoryId: "mains", name: "Beef Burger", price: 14.5, sortOrder: 1 },
  { id: "grilled-chicken", categoryId: "mains", name: "Grilled Chicken", price: 13.95, sortOrder: 2 },
  { id: "veg-risotto", categoryId: "mains", name: "Vegetable Risotto", price: 12.5, sortOrder: 3 },
  { id: "pasta-alfredo", categoryId: "mains", name: "Chicken Alfredo Pasta", price: 13.25, sortOrder: 4 },
  { id: "fish-chips", categoryId: "mains", name: "Fish & Chips", price: 15.95, sortOrder: 5 },
  { id: "chicken-biryani", categoryId: "mains", name: "Chicken Biryani", price: 11.5, sortOrder: 6 },
  { id: "veg-biryani", categoryId: "mains", name: "Vegetable Biryani", price: 9.95, sortOrder: 7 },

  // Sides
  { id: "fries", categoryId: "sides", name: "Side Fries", price: 3.5, sortOrder: 0 },
  { id: "salad-side", categoryId: "sides", name: "Side Salad", price: 3.95, sortOrder: 1 },
  { id: "coleslaw", categoryId: "sides", name: "Coleslaw", price: 2.95, sortOrder: 2 },
  { id: "steamed-rice", categoryId: "sides", name: "Steamed Rice", price: 2.5, sortOrder: 3 },

  // Sandwiches
  { id: "club-sandwich", categoryId: "sandwiches", name: "Club Sandwich", price: 8.95, sortOrder: 0 },
  { id: "chicken-sandwich", categoryId: "sandwiches", name: "Chicken Sandwich", price: 7.95, sortOrder: 1 },
  { id: "veg-sandwich", categoryId: "sandwiches", name: "Vegetable Sandwich", price: 6.5, sortOrder: 2 },

  // Desserts
  { id: "cheesecake", categoryId: "desserts", name: "Cheesecake", price: 6.5, sortOrder: 0 },
  { id: "brownie", categoryId: "desserts", name: "Chocolate Brownie", price: 5.95, sortOrder: 1 },
  { id: "ice-cream", categoryId: "desserts", name: "Ice Cream Scoop", price: 3.5, sortOrder: 2 },
  { id: "gulab-jamun", categoryId: "desserts", name: "Gulab Jamun", price: 4.5, sortOrder: 3 },

  // Extras
  { id: "extra-cheese", categoryId: "extras", name: "Extra Cheese", price: 1.5, sortOrder: 0 },
  { id: "extra-sauce", categoryId: "extras", name: "Extra Sauce", price: 0.75, sortOrder: 1 },
  { id: "extra-shot", categoryId: "extras", name: "Extra Espresso Shot", price: 1.0, sortOrder: 2 },
];

export const promotions: Promotion[] = [
  {
    id: "two-mains",
    label: "Two Mains Special",
    productIds: [
      "chicken-burger",
      "beef-burger",
      "grilled-chicken",
      "veg-risotto",
      "pasta-alfredo",
      "fish-chips",
    ],
    discountedUnitPrice: 4.995,
    requiredQuantity: 2,
  },
];

export const TAX_RATE = 0.2;
export const SERVICE_RATE = 0.1;
