/**
 * This file contains TypeScript interfaces for the menu information
 * provided to our webhook by an external source.
 */

export interface MenusIngest {
  prep_time_minutes?: number;
  menus: Menu[];
  holidays: Holiday[];
  taxes: Tax[];
}

export interface Menu {
  schedule: Schedule; // Schedule for menu in store timezone, using 24-hour format (HH:mm-HH:mm)
  stream_id: string;
  categories: Category[];
  name: string;
}

export interface Schedule {
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
  saturday: string[];
  sunday: string[];
}

export interface Category {
  stream_id: string;
  name: string;
  items: Item[];
}

export interface Item {
  is_alcohol?: boolean; // Provided when item is marked as Alcoholic and needs age verification
  tax_ids: string[]; // Tax rates assigned to this item
  stream_id: string;
  name: string;
  description?: string;
  images: { url: string }[]; // Possibly empty array of url-containing objects
  variations: ItemVariation[];
  modifier_groups: ModifierGroup[];
  is_active?: boolean;
  allergens?: string[];
}

export interface ItemVariation {
  price: number; // This will always be the lowest denomination. $1.50 USD = 150
  currency: "usd"; // We use lower-cased ISO 4127 alphabetic currency codes
  stream_id: string;
  name: string;
  is_active?: boolean;
}

export interface ModifierGroup {
  stream_id: string;
  name: string;
  modifiers: Modifier[];
  rules?: ModifierRules;
}

export interface Modifier {
  price: number;
  currency: string;
  stream_id: string;
  name: string;
  is_active?: boolean;
}

export interface ModifierRules {
  minimum_unique_modifiers_allowed?: number;
  maximum_unique_modifiers_allowed?: number;
  amount_of_modifiers_free?: number;
  selection_type?: "single" | "multiple";
}

export interface Holiday {
  date: string; // Day of the year in format MM-DD. Example: 05-14
  hours?: string[]; // Example: ['7:15-14:30', '15:30-22:00']
  recurring_yearly: boolean; // Flag that indicates if this holiday repeats every year
  specific_years?: number[]; // When reccurring_yearly is false, contains specific years the holiday occurs on. Example: [2024, 2025]
  name?: string; // Name of this holiday. Optional
}

export interface Tax {
  is_inclusive?: boolean; // Determines if the tax amount is already included in the item price
  stream_id: string;
  rate: number; // In percentage points
  name: string;
  is_default?: boolean;
}
