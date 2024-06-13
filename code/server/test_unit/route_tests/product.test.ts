import { describe, test, expect, jest, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";
import ProductController from "../../src/controllers/productController";
import Authenticator from "../../src/routers/auth";
import { Server } from "http";

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

    beforeAll(() => {
        server = app.listen(4000);
    });

    afterAll((done) => {
        server.close(done);
    });

    describe("POST /ezelectronics/products", () => {
        test("It should return a 200 success code for registering a product arrival", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser;
                return next();
            });

            const mockController = jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce();

            const response = await request(app).post(`${baseURL}/products`).send(testProduct);

            expect(response.status).toBe(200);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(
                testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate
            );

            mockController.mockRestore();
        });

        test("It should return a 409 error if model represents an already existing set of products in the database", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser;
                return next();
            });

            const mockController = jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce({ code: 409, message: "Model already exists" });

            const response = await request(app).post(`${baseURL}/products`).send(testProduct);

            expect(response.status).toBe(409);
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
            expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled();
        });

        test("It should return a 422 status code if model is missing", async () => {
            const { model, ...invalidProduct } = testProduct;

            const response = await request(app).post(`${baseURL}/products`).send(invalidProduct);

            expect(response.status).toBe(422);
            expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled();
        });

        test("It should return a 422 status code if category is missing", async () => {
            const { category, ...invalidProduct } = testProduct;

            const response = await request(app).post(`${baseURL}/products`).send(invalidProduct);

            expect(response.status).toBe(422);
            expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled();
        });

        test("It should return a 422 status code if quantity is missing", async () => {
            const { quantity, ...invalidProduct } = testProduct;

            const response = await request(app).post(`${baseURL}/products`).send(invalidProduct);

            expect(response.status).toBe(422);
            expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled();
        });

        test("It should return a 422 status code if sellingPrice is missing", async () => {
            const { sellingPrice, ...invalidProduct } = testProduct;

            const response = await request(app).post(`${baseURL}/products`).send(invalidProduct);

            expect(response.status).toBe(422);
            expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled();
        });
    });
});
