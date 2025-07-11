import * as ingestSchemas from "../schemas/menusIngest";
import * as orderSchema from "../schemas/orders";
import * as uuid from "uuid";
import admin from "firebase-admin";
import { db } from "./app";

/**
 * This function is responsible for storing the menu data in the format of
 * the Firestore schema defined in schemas/firestore.txt.
 *
 * @param menusIngest - The menu ingest data to be serialized.
 * @param brandId - The ID of the brand under which the menu will be stored.
 * @param locationId - The ID of the location associated with the brand.
 */
export const serializeMenu = async (
  menusIngest: ingestSchemas.MenusIngest,
  brandId: string,
  locationId: string
) => {
  // Starting point: all menus are serialized under the brand's document
  const brand = db.collection("brands").doc(brandId);

  // TODO: store the menu ingest in Firestore according to the schema
  // in schemas/firestore.txt


  // Store tax information
  for (const tax of menusIngest.taxes) {
    await brand.collection("taxes").doc(tax.stream_id).set({
      ...tax,
      location_id: locationId
    });
  }

  // Store holiday information
  for (const holiday of menusIngest.holidays) {
    await brand.collection("holidays").add({
      ...holiday,
      location_id: locationId
    })
  }

/**
 * Store menu information
 * 1. Store pass-through fields
 * 2. Create reference to list of categories
 * 3. Populate categories
 *  3a. Store items
 *  3b. Store modifier groups
 *  3c. Store modifiers
 * 4. Store reference list in menu
 */
  for (const menu of menusIngest.menus) {

    // Populate all pass-through fields
    const menuRef = await brand.collection("menus").doc(menu.stream_id).set({
      name: menu.name,
      schedule: menu.schedule,
      location_id: locationId,
      stream_id: menu.stream_id
    });
    
    // Initialize reference list for categories
    const categoryRefs: FirebaseFirestore.DocumentReference[] = []; 

    /**
     * Unpack categories and convert them to expected format, store references to each
     * category within categoryRefs once completed
     */
    for (const category of menu.categories) {
      const categoryRef = brand.collection("item_categories").doc(category.stream_id);
      
      //Populate category
      await categoryRef.set({
        menu_stream_id: menu.stream_id,
        location_id: locationId,
        name: category.name,
        stream_id: category.stream_id
      });

      // Add current category to reference list
      categoryRefs.push(categoryRef);

      /**
       * Unpack items, create references to modifiers and store them in the database. 
       * References to modifiers and modifier groups will be filled later.
       */
      for (const item of category.items) {
        const { 
          // Optional fields with fallbacks
          is_alcohol, 
          description, 
          is_active, 
          images, 
          allergens, 
          // All other required fields
          modifier_groups, 
          ...data 
        } = item;
        
        // Map each modifier group to accepted format for insertion into item
        const mGroups = modifier_groups.map(mg => ({
          //store reference to document but don't create yet
          modifier_group_ref: brand.collection("modifier_groups").doc(mg.stream_id),
          name: mg.name,
          rules: mg.rules ?? {},
          stream_id: mg.stream_id
        }));

        // Populate items with formatted fields
        const itemRef = categoryRef.collection("items").doc(item.stream_id);
        await itemRef.set({
          ...data,
          modifier_groups: mGroups,
          // Insert fallbacks to prevent undefined behavior
          is_alcohol: is_alcohol ?? false,
          description: description ?? "",
          image_url: images?.url,
          is_active: is_active ?? true,
          allergens: allergens ?? []
        });

        // Store modifier groups and modifiers
        for (const mg of item.modifier_groups) {
          const mgRef = brand.collection("modifier_groups").doc(mg.stream_id);
          await mgRef.set({
            name: mg.name,
            stream_id: mg.stream_id,
            rules: mg.rules,
          });

          for (const mod of mg.modifiers) {
            await mgRef.collection("modifiers").doc(mod.stream_id).set({
              name: mod.name,
              stream_id: mod.stream_id,
              price: mod.price,
              currency: mod.currency,
              is_active: mod.is_active ?? true,
            });
          }
        }

      } 
    }
    
    // Push list of categories to current menu item
    await brand.collection("menus").doc(menu.stream_id).update({
      category_refs: categoryRefs
    });
  }
};


/**
 * This function is responsible for converting the app-formatted order
 * to the format that the third-party orders API expects.
 *
 * @param order - The app-formatted order to be converted.
 * @returns The converted order in the format expected by the third-party API.
 */
export const formatOrder = async (
  order: orderSchema.AppOrder
): Promise<orderSchema.NewApiOrder> => {
  // TODO: convert the app-formatted order to the format the third-party
  // orders API expects.

  // HINT: you will need to calculate subtotal, taxes, and total based on
  // the items in the order, and also handle modifiers. For the purposes
  // of this exercise, you can assume there will be NO discounts applied!

  // HINT: you shouldn't need to make any queries to Firestore for creating the
  // `items` field of `newOrder`, but you will need to make queries for other
  // information not provided via app orders, like taxes

  // HINT: Every order carries a 40-cent service charge (an app processing fee)
  
  /**
   * 1. Calculate total (subtotal + taxes + service charge) based on order information
   * 2. Unpack AppOrder data and modify format to fit NewApiOrder
   */

  const newOrderId = uuid.v4();
  const locationId: string = order.locationId;
  const cart = order.cart;
  let subtotal = 0; // Sums subtotal of all cart item prices
  const items: orderSchema.OrderItem[] = []; // Stores converted list of items

  /**
   * Iterate through each item in the cart. For each item, map it to the expected
   * format for NewApiOrder and calculate its price. Push the newly formatted item
   * to items and add the price to subtotal.
   */
  for (const cartItem of cart) {
    // Map order modifiers to expected format
    const ordMod: orderSchema.OrderModifier[] = cartItem.modifiers.map(md => ({
      id: md.modifierItemId,
      modifier_group_id: md.modifierGroupId,
      name: md.modifierName,
      quantity: md.quantity,
      price: md.modifierPrice,
      currency: "usd"
    }));

    // Push current cart item to list of items
    items.push({
      id: cartItem.variation.id,
      item_id: cartItem.menuItemId,
      category_id: cartItem.menuCategoryId,
      name: cartItem.itemName,
      quantity: cartItem.quantity,
      price: cartItem.itemPrice,
      currency: "usd", //hard coded to only usd
      modifiers: ordMod,
      special_instructions: cartItem.specialRequest
    });

    // Calculate total price of modifications
    let addonPrice = 0;
    for (const mod of cartItem.modifiers) {
      addonPrice += mod.quantity * mod.modifierPrice;
    }

    /**
     * Assume the itemPrice doensn't include price of addons, which are calculated
     * separately and then added below. The test case doesn't add addons into the
     * total price.
     * 
     * If addonPrice is included, use this line instead:
     * const itemSubtotal = cartItem.quantity * cartItem.itemPrice;
     */
    const itemSubtotal = cartItem.quantity * (cartItem.itemPrice + addonPrice);

    //Increment subtotal
    subtotal += itemSubtotal;

  }

  // Find brandId the order is associated with, return with error if none found
  // Assumes a given location can only be tied to a single brand
  const brandId: string = await queryBrand(locationId) ?? "";
  if(brandId == "") {
    throw new Error("No brand found.");
  }

  // Calculate taxes and service charge, with taxes rounded off at the nearest cent
  const taxRate: number = await calculateTaxRate(brandId, locationId);
  const taxes = Math.round((taxRate * subtotal));
  const serviceCharge: number = 40;

  // total isn't part of NewApiOrder, but sum can be calculated here if needed
  //  const total: number = subtotal + taxes + serviceCharge;

  // Populate the output order in expected format for NewApiOrder
  const newOrder: orderSchema.NewApiOrder = {
    id: newOrderId,
    customer: {
      name: order.firstName + " " + order.lastName,
      email: order.email,
      phone: order.phone
    },
    items: items,
    subtotal: subtotal,
    customer_facing_id: order.customerFacingId ?? "",
    fulfillment_type: "pickup",
    tax: taxes,
    service_charge: serviceCharge,
    // Unimplemented behaviors below, assume utensils should always be included
    //  total: total, 
    discounts: [],
    should_include_utensils: true
  };

  return newOrder;
};


// This function finds the matching brand from the AppOrder given the location of the order
export const queryBrand = async (
  locationId: string
): Promise<string | null> => {
  // Get list of brands
  const brandSnapshot = await db.collection("brands").get();
  
  // Manually search through all brands and their locations
  for (const brand of brandSnapshot.docs) {
    const locationSnapshot = await brand.ref.collection("location").get();
    for (const location of locationSnapshot.docs) {
      if (location.id == locationId) {
        return brand.id; //Location from brand matches given location
      }
    }
  }
  return null; // No brand matches the given location
}

export const calculateTaxRate = async (
  brandId: string,
  locationId: string,
): Promise<number> => {
  let total = 0;

  // Get the snapshot of the taxrates associated with the brand
  const brand = db.collection("brands").doc(brandId);
  const taxesSnapshot = await brand.collection("taxes").get();

  // Iterate through each tax object and sum the rates
  for (const taxDoc of taxesSnapshot.docs) {
    const taxData = taxDoc.data();

    // is_inclusive means this tax was already summed in subtotal, so no changes made
    if (taxData.is_inclusive === false && taxData.location_id === locationId) {
      total += taxData.rate;
    }
  }

  return total;
}