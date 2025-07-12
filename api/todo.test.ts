// @jest-environment node
// This file is intended to be run with Jest
import { formatOrder, calculateTaxRate, queryBrand, serializeMenu } from "./todo";
import * as todoModule from "./todo";
import appOrder from "../examples/AppOrder.json";
import newApiOrder from "../examples/NewApiOrder.json";
import menusIngest from "../examples/MenusIngest.json";

// Mock Firestore db and dependencies
const mockSet = jest.fn();
const mockAdd = jest.fn();
const mockUpdate = jest.fn();
const mockGet = jest.fn();
const mockCollection: any = jest.fn((): any => ({
  doc: jest.fn((): any => ({
    set: mockSet,
    collection: mockCollection,
    update: mockUpdate,
  })),
  add: mockAdd,
  get: mockGet, // Ensure .get is available for collection mocks
}));
const mockDoc: any = jest.fn((): any => ({
  collection: mockCollection,
  set: mockSet,
  update: mockUpdate,
}));

jest.mock("./app", () => ({
  db: {
    collection: jest.fn(() => ({
      doc: mockDoc,
      collection: mockCollection,
    })),
  },
}));

// Set up mockTaxes for calculateTaxRate test
const mockTaxes = [
  { data: () => ({ is_inclusive: false, location_id: "loc1", rate: 0.085 }) },
  { data: () => ({ is_inclusive: true, location_id: "loc1", rate: 0.02 }) },
  { data: () => ({ is_inclusive: false, location_id: "loc2", rate: 0.05 }) },
];
mockGet.mockResolvedValue({ docs: mockTaxes });

describe("calculateTaxRate", () => {
  it("sums only non-inclusive taxes for the right location", async () => {
    const rate = await calculateTaxRate("brand1", "loc1");
    expect(rate).toBe(0.085);
  });
});

describe("formatOrder", () => {
  beforeAll(() => {
    jest.spyOn(todoModule, "queryBrand").mockResolvedValue("brand1");
    jest.spyOn(todoModule, "calculateTaxRate").mockResolvedValue(0.085);
  });

  it("returns correct order object", async () => {
    const result = await formatOrder(appOrder as any);
    expect(result.subtotal).toBe(newApiOrder.subtotal);
    expect(result.tax).toBe(newApiOrder.tax);
    expect(result.service_charge).toBe(newApiOrder.service_charge);
    expect(result.customer.name).toBe(newApiOrder.customer.name);
  });
});

describe("serializeMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("writes menu data to Firestore collections for a brand and location", async () => {
    const brandId = "brand1";
    const locationId = "loc1";
    await serializeMenu(menusIngest as any, brandId, locationId);

    // Check that taxes, holidays, menus, categories, items, etc. are written
    expect(mockCollection).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();

    // Optionally, check that set was called with expected data for taxes, menus, etc.
    // For example, check that a tax was set with the correct location_id
    const taxCall = mockSet.mock.calls.find(call => call[0]?.location_id === locationId);
    expect(taxCall).toBeDefined();
  });
}); 