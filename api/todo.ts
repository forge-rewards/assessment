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
};

/**
 * This function is responsible for converting the app-formatted order
 * to the format that the third-party orders API expects.
 *
 * @param order - The app-formatted order to be converted.
 * @param brandId - The ID of the brand for which the order is being processed.
 * @returns The converted order in the format expected by the third-party API.
 */
export const formatOrder = async (
  order: orderSchema.AppOrder,
  brandId: string
): Promise<orderSchema.NewApiOrder> => {
  const newOrderId = uuid.v4();
  const newOrder = {} as orderSchema.NewApiOrder;

  // TODO: convert the app-formatted order to the format the third-party
  // orders API expects.

  // HINT: you will need to calculate subtotal, taxes, and total based on
  // the items in the order, and also handle modifiers. For the purposes
  // of this exercise, you can assume there will be NO discounts applied!

  // HINT: you shouldn't need to make any queries to Firestore for creating the
  // `items` field of `newOrder`, but you will need to make queries for other
  // information not provided via app orders, like taxes

  // HINT: Every order carries a 40-cent service charge (an app processing fee)
  const serviceCharge: number = 40;

  return newOrder;
};
