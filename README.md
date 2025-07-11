# Technical Assessment: Menus & Orders API

Welcome to our assessment! You'll be working on a simulation of our real-world food delivery
platform to implement two core backend functions that handle menu data ingestion and order processing.

## Overview

You'll work with a Node.js/Express app that integrates with our Firebase Firestore database
and handles data transformation between different API schemas.

## Task

Implement two functions in `api/todo.ts`:

### 1. `serializeMenu` Function

**Purpose**: Store external menu data in our internal Firestore database

**Details**:

- Take menu data that follows a third-party API schema (`MenusIngest`)
- Store it in Firestore, following our database schema

### 2. `formatOrder` Function

**Purpose**: Convert internal app orders to external API format to send to a restaurant.

**Details**:

- Transform `AppOrder` (our internal format) to `NewApiOrder` (third-party API format)
- Calculate order totals, taxes, and service charges

Please follow the exact schemas defined in `schemas/firestore.txt`,
`schemas/menuIngest.ts`, and `schemas/orders.ts`! This is necessary
for you to create a correct mapping between different schemas.

## Project Structure

```
├── api/
│   ├── app.ts          # API endpoints to show you how your functions will be used
│   └── todo.ts         # YOUR IMPLEMENTATION GOES HERE
├── schemas/
│   ├── firestore.txt   # Database schema
│   ├── menuIngest.ts   # External API data schema
│   └── orders.ts       # Internal and external order schemas
└── package.json        # Dependencies and scripts
```

## TODOs

1. **Install Dependencies**

   ```
   npm install
   ```

2. **Review the Schemas**

   - Review `schemas/firestore.txt` for the database structure
   - Review `schemas/menuIngest.ts` for input data format
   - Review `schemas/orders.ts` for order transformation requirements

3. **Implement the Functions in api/todo.ts**

   - Implement `serializeMenu()`
   - Implement `formatOrder()`

4. **Test (Optional)**
   - If desired, use the JSONs in the `examples` folder to test your schema-to-schema mapping

## Misc. Notes

- You won't actually be able to run `app.ts` or initialize the Firebase SDK
- All prices are in cents (integers)
- Subtotal = sum of (item prices + modifier prices) × quantities
- Service charge is always 40 cents
- Tax calculation is based on tax objects with the provided IDs

## Deliverables

Complete implementation of both functions in `api/todo.ts`
Compiles without TypeScript errors
Comments on your work

## Evaluations

We'll assess your work based on:

- **Correctness**: Your functions work
- **Code Quality**: Clean, well-structured code
- **Database Skills**: Using Firestore operations and queries correctly

## Questions?

If you think anything is ambiguous, please ask!
You an also make reasonable assumptions and document them in comments.

Good luck!
