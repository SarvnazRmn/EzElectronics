import { describe, test, expect, jest, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";
import ProductController from "../../src/controllers/productController";
import Authenticator from "../../src/routers/auth";
import { Product, Category } from "../../src/components/product"
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError, ProductInvalidDate, ProductInvalidGrouping} from "../../src/errors/productError"
import { Server } from "http";
import { error } from "console";

jest.mock("../../src/routers/auth");

const baseURL = "/ezelectronics";

describe("ProductRoutes", () => {
    const testProduct = {
        model: "testModel",
        category: "Smartphone",
        quantity: 10,
        details: "Test details",
        sellingPrice: 999.99,
        arrivalDate: "2024-06-01"
    };
    const testUser = { id: "userId", role: "Admin" };
    let server: Server;

    describe("POST /ezelectronics/products", () => {
        test("It should return a 200 success code for registering a product arrival", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser;
                return next();
            });

            const mockController = jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(true);

            const response = await request(app).post(`${baseURL}/products`).send(testProduct);

            expect(response.status).toBe(200);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(
                testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate
            );

            mockController.mockRestore();
        });

        test("It should return an error if model represents an already existing set of products in the database", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser;
                return next();
            });

            const mockController = jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(409);

            const response = await request(app).post(`${baseURL}/products`).send(testProduct);

            expect(response.status).toBe(503);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(
                testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate
            );

            mockController.mockRestore();
        });

        test("It should return a 400 error when arrivalDate is after the current date", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser;
                return next();
            });

            const futureProduct = { ...testProduct, arrivalDate: "2999-12-31" };

            const response = await request(app).post(`${baseURL}/products`).send(futureProduct);

            expect(response.status).toBe(400);
        });

        test("It should return a 422 status code if model is missing", async () => {
            const { model, ...invalidProduct } = testProduct;

            const response = await request(app).post(`${baseURL}/products`).send(invalidProduct);

            expect(response.status).toBe(422);
        });

        test("It should return a 422 status code if category is missing", async () => {
            const { category, ...invalidProduct } = testProduct;

            const response = await request(app).post(`${baseURL}/products`).send(invalidProduct);

            expect(response.status).toBe(422);
        });

        test("It should return a 422 status code if quantity is missing", async () => {
            const { quantity, ...invalidProduct } = testProduct;

            const response = await request(app).post(`${baseURL}/products`).send(invalidProduct);

            expect(response.status).toBe(422);
        });

        test("It should return a 422 status code if sellingPrice is missing", async () => {
            const { sellingPrice, ...invalidProduct } = testProduct;

            const response = await request(app).post(`${baseURL}/products`).send(invalidProduct);

            expect(response.status).toBe(422);
        });
    });

    describe("PATCH /ezelectronics/products/:model", () => {
        test("It should return a 200 success code for changing product quantity", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser;
                return next();
            });

            const mockController = jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(15);

            const response = await request(app).patch(`${baseURL}/products/testModel`).send({ quantity: 5 });

            expect(response.status).toBe(200);
            expect(response.body.quantity).toBe(15);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("testModel", 5, undefined);

            mockController.mockRestore();
        });

        test("It should return a 404 status code if model is missing", async () => {
            const response = await request(app).patch(`${baseURL}/products/`).send({ quantity: 5 });

            expect(response.status).toBe(404);  // Missing parameter
        });

        test("It should return a 422 status code if quantity is missing", async () => {
            const response = await request(app).patch(`${baseURL}/products/${testProduct}`).send({});

            expect(response.status).toBe(422);
        });
    });

    describe("PATCH /ezelectronics/products/:model/sell", () => {
        test("It should return a 200 success code for selling a product", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser;
                return next();
            });

            const mockController = jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(true);

            const response = await request(app).patch(`${baseURL}/products/testModel/sell`).send({ sellingDate: "2024-01-02", quantity: 5 });

            expect(response.status).toBe(200);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("testModel", 5, "2024-01-02");

            mockController.mockRestore();
        });

        test("It should return a 422 status code if model is missing", async () => {
            const response = await request(app).patch(`${baseURL}/products/${testProduct}/sell`).send({ quantity: 5 });

            expect(response.status).toBe(404);  // Missing parameter
        });

        test("It should return a 422 status code if quantity is missing", async () => {
            const response = await request(app).patch(`${baseURL}/products/${testProduct}/sell`).send({});

            expect(response.status).toBe(422);
        });
    });

    describe("GET /ezelectronics/products", () => {
        test("It should return a 200 success code for retrieving all products", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser;
                return next();
            });

            const testProducts = [
                new Product(599.99, "testModel1", Category.SMARTPHONE, "2024-05-01", "Details 1", 10),
                new Product(999.99, "testModel2", Category.LAPTOP, "2024-05-02", "Details 2", 5)
                ];

            const mockController = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(testProducts);

            const response = await request(app).get(`${baseURL}/products`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(testProducts);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(undefined, undefined, undefined);

            mockController.mockRestore();
        });

        test("It should return a 422 status code if invalid query parameters are provided", async () => {
            const response = await request(app).get(`${baseURL}/products`).query({ grouping: "invalid" });

            expect(response.status).toBe(422);
        });

        test("It should return an error message for catching an internal error", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser;
                return next();
            });

            const mockController = jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(ProductInvalidGrouping);

            const response = await request(app).get(`${baseURL}/products`);

            expect(response.status).toBe(503);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(undefined, undefined, undefined);

            mockController.mockRestore();
        });

    });

    describe("GET /ezelectronics/products/available", () => {
        test("It should return a 200 success code for retrieving all available products", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser;
                return next();
            });

            const testProducts = [
                new Product(599.99, "testModel1", Category.SMARTPHONE, "2024-05-01", "Details 1", 10),
                new Product(999.99, "testModel2", Category.LAPTOP, "2024-05-02", "Details 2", 5)
                ];

            const mockController = jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce(testProducts);

            const response = await request(app).get(`${baseURL}/products/available`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(testProducts);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(undefined, undefined, undefined);

            mockController.mockRestore();
        });

        test("It should return a 422 status code if invalid query parameters are provided", async () => {
            const response = await request(app).get(`${baseURL}/products/available`).query({ grouping: "invalid" });

            expect(response.status).toBe(422);
        });
    });

    describe("DELETE /ezelectronics/products", () => {
        test("It should return a 200 success code for deleting all products", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser;
                return next();
            });

            const mockController = jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true);

            const response = await request(app).delete(`${baseURL}/products`);

            expect(response.status).toBe(200);
            expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);

            mockController.mockRestore();
        });
    });

    describe("DELETE /ezelectronics/products/:model", () => {
        test("It should return a 200 success code for deleting a product", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser;
                return next();
            });

            const mockController = jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true);

            const response = await request(app).delete(`${baseURL}/products/testModel`);

            expect(response.status).toBe(200);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith("testModel");

            mockController.mockRestore();
        });

        test("It should return a 404 status code if model is missing", async () => {
            const response = await request(app).delete(`${baseURL}/products/wrongName`);

            expect(response.status).toBe(404);  // Missing parameter
        });
    });
});
