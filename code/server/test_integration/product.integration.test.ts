import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../index";
import { cleanup } from "../src/db/cleanup";
import { Category } from "../src/components/product";

const routePath = "/ezelectronics";

// Default user information
const users = {
  customer: { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" },
  admin: { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" },
  manager: { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" },
};

let cookies = {
  customer: "",
  admin: "",
  manager: "",
};

// Test products
const products = [
  { model: "product1", category: Category.SMARTPHONE, quantity: 3, details: "details1", sellingPrice: 50, arrivalDate: "2011-01-01" },
  { model: "product2", category: Category.LAPTOP, quantity: 2, details: "details2", sellingPrice: 100 },
  { model: "product3", category: Category.APPLIANCE, quantity: 1, details: "details3", sellingPrice: 120, arrivalDate: "2050-01-01" },
];

// Helper function to create a new user
const createUser = async (userInfo: any) => {
  await request(app).post(`${routePath}/users`).send(userInfo).expect(200);
};

// Helper function to log in a user and return the cookie
const loginUser = async (userInfo: any) => {
  return new Promise<string>((resolve, reject) => {
    request(app)
      .post(`${routePath}/sessions`)
      .send(userInfo)
      .expect(200)
      .end((err, res) => {
        if (err) reject(err);
        resolve(res.header["set-cookie"][0]);
      });
  });
};

// Initialize users and log them in before tests
beforeAll(async () => {
  await cleanup();
  await Promise.all(Object.values(users).map(createUser));
  cookies.admin = await loginUser(users.admin);
  cookies.customer = await loginUser(users.customer);
  cookies.manager = await loginUser(users.manager);
});

// Cleanup after tests
afterAll(async () => {
  await cleanup();
});

describe("Product routes integration tests", () => {
  describe("POST /products", () => {
    test("It should return a 401 error code Unauthorized", async () => {
      await request(app)
        .post(`${routePath}/products`)
        .send(products[0])
        .set("Cookie", cookies.customer)
        .expect(401);
    });

    test("It should return a 200 success code and create a new product", async () => {
      for (const product of products.slice(0, 2)) {
        await request(app)
          .post(`${routePath}/products`)
          .send(product)
          .set("Cookie", cookies.admin)
          .expect(200);
      }
    });

    test("It should return a 422 error code as the date is invalid", async () => {
      await request(app)
        .post(`${routePath}/products`)
        .send(products[2])
        .set("Cookie", cookies.admin)
        .expect(422);
    });
  });

  describe("PATCH /products/:model", () => {
    test("Changing the quantity of a product, expecting 200 success code", async () => {
      const updates = [
        { model: "product1", quantity: 2, changeDate: "2014-12-12" },
        { model: "product2", quantity: 2 },
      ];

      for (const update of updates) {
        const response = await request(app)
          .patch(`${routePath}/products/${update.model}`)
          .send(update)
          .set("Cookie", cookies.admin)
          .expect(200);

        const updatedProduct = response.body;
        const originalProduct = products.find((p) => p.model === update.model);
        expect(updatedProduct.quantity).toBe(originalProduct!.quantity + 2);
      }
    });

    test("Changing the quantity of a product that doesn't exist, expecting 404 error code", async () => {
      await request(app)
        .patch(`${routePath}/products/nonexistent`)
        .send({ quantity: 2, changeDate: "2014-12-12" })
        .set("Cookie", cookies.admin)
        .expect(404);
    });

    test("Changing the quantity of a product with invalid data, expecting error codes", async () => {
      const invalidUpdates = [
        { model: "product1", quantity: 2, changeDate: "2055-01-01" },
        { model: "product2", quantity: 0 },
      ];

      for (const update of invalidUpdates) {
        await request(app)
          .patch(`${routePath}/products/${update.model}`)
          .send(update)
          .set("Cookie", cookies.admin)
          .expect(422);
      }
    });
  });

  describe("PATCH /products/:model/sell", () => {
    test("Selling a product, expecting 200 success code", async () => {
      const sales = [
        { model: "product1", quantity: 2, sellingDate: "2014-12-12" },
        { model: "product2", quantity: 1 },
      ];

      for (const sale of sales) {
        const response = await request(app)
          .patch(`${routePath}/products/${sale.model}/sell`)
          .send(sale)
          .set("Cookie", cookies.admin)
          .expect(200);

        const updatedProduct = response.body;
        const originalProduct = products.find((p) => p.model === sale.model);
        expect(updatedProduct.quantity).toBe(originalProduct!.quantity - sale.quantity);
      }
    });

    test("Selling a product that doesn't exist, expecting 404 error code", async () => {
      await request(app)
        .patch(`${routePath}/products/nonexistent/sell`)
        .send({ quantity: 2, sellingDate: "2014-12-12" })
        .set("Cookie", cookies.admin)
        .expect(404);
    });

    test("Selling a product with invalid data, expecting error codes", async () => {
      const invalidSales = [
        { model: "product1", quantity: 2, sellingDate: "2025-10-10" },
        { model: "product2", quantity: 0 },
      ];

      for (const sale of invalidSales) {
        await request(app)
          .patch(`${routePath}/products/${sale.model}/sell`)
          .send(sale)
          .set("Cookie", cookies.admin)
          .expect(422);
      }
    });
  });

  describe("GET /products", () => {
    test("Getting a product list by category", async () => {
      const response = await request(app)
        .get(`${routePath}/products`)
        .query({ grouping: "category", category: "Laptop" })
        .set("Cookie", cookies.admin)
        .expect(200);

      const [product] = response.body;
      expect(product.model).toBe(products[1].model);
      expect(product.category).toBe(products[1].category);
      expect(product.quantity).toBe(3);
    });

    test("Getting a product list by model name", async () => {
      const response = await request(app)
        .get(`${routePath}/products`)
        .query({ grouping: "model", model: "product1" })
        .set("Cookie", cookies.admin)
        .expect(200);

      const [product] = response.body;
      expect(product.model).toBe(products[0].model);
      expect(product.category).toBe(products[0].category);
      expect(product.quantity).toBe(products[0].quantity);
    });

    const badRequests = [
      { query: { grouping: "model", category: "Smartphone" }, line: 195 },
      { query: { grouping: "category", category: "bad" }, line: 202 },
      { query: { grouping: "category", model: "product1" }, line: 210 },
      { query: { grouping: "model", model: " " }, line: 217 },
    ];

    badRequests.forEach(({ query, line }) => {
      test(`Getting a product list: bad request, expecting an error (line ${line})`, async () => {
        await request(app)
          .get(`${routePath}/products`)
          .query(query)
          .set("Cookie", cookies.admin)
          .expect(422);
      });
    });

    test("Getting a product that doesn't exist: expecting error", async () => {
      await request(app)
        .get(`${routePath}/products`)
        .query({ grouping: "model", model: "nonexistent" })
        .set("Cookie", cookies.admin)
        .expect(404);
    });
  });

  describe("GET /products/available", () => {
    test("Getting available product list by model", async () => {
      const response = await request(app)
        .get(`${routePath}/products/available`)
        .query({ grouping: "model", model: "product1" })
        .set("Cookie", cookies.admin)
        .expect(200);

      const [product] = response.body;
      expect(product.model).toBe(products[0].model);
      expect(product.category).toBe(products[0].category);
      expect(product.quantity).toBe(products[0].quantity);
    });

    test("Getting available product list by category", async () => {
      const response = await request(app)
        .get(`${routePath}/products/available`)
        .query({ grouping: "category", category: "Laptop" })
        .set("Cookie", cookies.admin)
        .expect(200);

      const products = response.body;
      expect(products).toHaveLength(1);
      expect(products[0].model).toBe("product2");
    });

    const badRequests = [
      { query: { grouping: "category", model: "product1" }, line: 268 },
      { query: { grouping: "model", model: " " }, line: 274 },
      { query: { grouping: "model", category: "Laptop" }, line: 280 },
    ];

    badRequests.forEach(({ query, line }) => {
      test(`Getting available product list: bad request, expecting error (line ${line})`, async () => {
        await request(app)
          .get(`${routePath}/products/available`)
          .query(query)
          .set("Cookie", cookies.admin)
          .expect(422);
      });
    });

    test("Getting available products: non-existing, expecting error", async () => {
      await request(app)
        .get(`${routePath}/products/available`)
        .query({ grouping: "model", model: "nonexistent" })
        .set("Cookie", cookies.admin)
        .expect(404);
    });
  });
});
