import admin from "firebase-admin";
import axios from "axios";
import express from "express";
import { MenusIngest } from "../schemas/menusIngest";
import { AppOrder } from "../schemas/orders";

// You will implement these functions
import { serializeMenu, formatOrder } from "./todo";

// Initialize Firebase app
admin.initializeApp();
export const db: admin.firestore.Firestore = admin.firestore();

// Initialize Express app
const app: express.Express = express();
app.use(express.json());

/**
 * Retrieve menu data from the download URL in the request and
 * store it in our Firestore database.
 */
app.post("/v1/ingest", async (req: any, res: any) => {
  try {
    // Fetch the restaurant's menu from the third-party URL
    const downloadUrl = req.query.downloadUrl as string;
    const response = await axios.get(downloadUrl);
    const menusIngest = response.data as MenusIngest;

    // Some error handling
    if (!menusIngest || !menusIngest.menus || !menusIngest.menus.length) {
      return res.status(400).json({ error: "Invalid menu" });
    }

    // Serialize menu data in Firestore
    const brandId = req.query.brandId as string;
    const locationId = req.query.locationId as string;
    await serializeMenu(menusIngest, brandId, locationId);

    // Menu ingested successfully
    return res.status(201).json({ message: "success" });
  } catch (error) {
    console.error("Error processing event:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * Send an order from a client app to the third-party orders API, which
 * fulfills the order so that it gets sent to the restaurant.
 */
app.post("/v1/orders", async (req: any, res: any) => {
  try {
    // Get the app-formatted order from the request body
    const appOrder = req.body.order as AppOrder;
    const brandId = req.brandId as string;

    // Reorganize the order to match the format the third-party orders API expects
    const formattedOrder = await formatOrder(appOrder, brandId);

    // Send the formatted order to the third-party orders API
    const url = "https://connect.forgerewards.com/v1/orders";
    const body = {
      type: "new_order",
      order: formattedOrder,
      location_id: req.body.locationId,
    };
    const headers = { "Content-Type": "application/json" };
    await axios.post(url, body, { headers });

    // Order placed successfully
    return res.status(201).json({ message: "success" });
  } catch (error) {
    console.error("Error processing order:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
