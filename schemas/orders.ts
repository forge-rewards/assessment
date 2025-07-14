/**
 * This file contains TypeScript interfaces for the order information
 * we send to restaurants from in-app purchases.
 */

// This is the format that the third-party orders API expects when we send an order
// It is not the same as our apps' internal order format
export interface NewApiOrder {
  id: string; // The ID of the order in our system (use a uuid)
  customer: Customer;
  items: OrderItem[]; // The items that the customer ordered.
  subtotal: number; // The subtotal of the order in cents (excluding taxes).
  customer_facing_id: string; // This is usually a shortened ID for the customer or merchant to troubleshoot their order
  fulfillment_type: "pickup"; // Our app only supports pickup orders at the moment.
  tax: number; // The tax amount of the order in cents.
  service_charge?: number; // Miscellaneous charge that is not taxes or tips. Ex: card fee
  discounts?: OrderDiscount[]; // A list of discounts that should be applied to the order. Optional
  should_include_utensils?: boolean; // Indicates if utensils and napkins are required to be included with the order. If not provided, this will default to true.
  special_instructions?: string; // Order level special instructions
}

export interface Customer {
  name: string; // The full name of the customer
  email: string;
  phone: string; // The customer phone number in E.164 format (e.g. '+14155552671')
}

export interface OrderItem {
  id: string; // The stream ID of the variation (not the Item ID)
  item_id: string; // The parent stream ID of the item the variation belongs to
  category_id: string; // The stream ID of the category the item belongs to
  name: string;
  quantity: number;
  price: number; // The price of the item in cents (excludes modifiers)
  modifiers: OrderModifier[]; // The modifiers that the customer selected for this item
  currency: "usd";
  special_instructions?: string; // Item level special instructions, i.e customer modifications
}

export interface OrderModifier {
  id: string; // The stream ID of the modifier
  modifier_group_id: string; // The Parent Group stream ID of the modifier
  name: string;
  quantity: number;
  price: number; // The price of the modifier in cents
  currency: "usd";
}

export interface OrderDiscount {
  id: string; // The stream ID of the discount applied to the order
  amount: number; // The amount of the discount in cents
}

// This is the format that our app uses to represent an order internally
// It is not the same as the format that the third-party orders API expects
export interface AppOrder {
  firstName: string;
  lastName: string;
  phone: string; // Already in E.164 format
  email: string;
  customerFacingId?: string;
  cart: AppCartItem[];
  locationId: string;
}

interface AppCartItem {
  quantity: number;
  menuCategoryId: string; // The stream_id of the menu category the item belongs to
  specialRequest: string; // Special instructions for the item
  itemName: string;
  modifiers: AppModifier[]; // Adjust type if needed
  menuItemId: string; // The stream_id of the corresponding Item
  variation: AppVariation; // The variation of the item selected by the customer
  itemPrice: number; // The price of the item in cents (excludes modifiers)
}

interface AppModifier {
  quantity: number;
  modifierName: string;
  modifierPrice: number; // The price of the modifier in cents
  modifierItemId: string; // The stream_id of the corresponding modifier
  modifierGroupId: string; // The stream_id of the ModifierGroup the modifier belongs to
}

interface AppVariation {
  id: string; // The stream_id of the corresponding ItemVariation
  name: string;
  price: number; // The price of the variation in cents
}
