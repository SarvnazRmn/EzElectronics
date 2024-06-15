import { describe, test, expect, jest, beforeEach } from "@jest/globals";

import db from "../../src/db/db";
import { Database } from "sqlite3"

import ProductDAO from "../../src/dao/productDAO";
import { Product, Category } from "../../src/components/product";
import { 
    ProductNotFoundError, 
    ProductAlreadyExistsError, 
    ProductSoldError, 
    EmptyProductStockError, 
    LowProductStockError, 
    ProductInvalidDate, 
    ProductInvalidGrouping 
} from "../../src/errors/productError";
import { error, log } from "console";

jest.mock("../../src/db/db.ts");

describe("ProductDAO", () => {
    let productDAO = new ProductDAO();

    beforeEach(() => {
        productDAO = new ProductDAO();
    });

    describe("registerProducts", () => {
        test("should resolve true on successful registration", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            const result = await productDAO.registerProducts("model", Category.LAPTOP, 10, "details", 100, "2024-06-07");
            expect(result).toBe(true);

            mockDBRun.mockRestore();
        });

        test("should reject with ProductAlreadyExistsError if the product already exists", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("UNIQUE constraint failed: product.model"));
                return {} as Database;
            });

            await expect(productDAO.registerProducts("model", Category.LAPTOP, 10, "details", 100, "2024-06-07"))
                .rejects.toThrow(ProductAlreadyExistsError);

            mockDBRun.mockRestore();
        });

        test("should reject with Error if there is a database error", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("QueryError"));
                return {} as Database;
            });

            await expect(productDAO.registerProducts("model", Category.LAPTOP, 10, "details", 100, "2024-06-07"))
                .rejects.toThrow(Error("QueryError"));

            mockDBRun.mockRestore();
        });

        test("should reject with ProductInvalidDate if the arrival date is after the current date", async () => {
            await expect(productDAO.registerProducts("model", Category.LAPTOP, 10, "details", 100, "2025-07-07"))
                .rejects.toThrow(ProductInvalidDate);
        });

        test("should resolve true when no arrival date is provided", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            const result = await productDAO.registerProducts("model", Category.LAPTOP, 10, "details", 100, "");
            expect(result).toBe(true);

            mockDBRun.mockRestore();
        });
    });

    describe("changeProductQuantity", () => {
        test("should resolve with the new quantity on successful update", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { arrivalDate: "2024-06-06", quantity: 5 });
                return {} as Database;
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            const result = await productDAO.changeProductQuantity("model", 5, "2024-06-07");
            expect(result).toBe(10);

            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });

        test("should reject with Error if there is a database error", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { arrivalDate: "2024-06-06", quantity: 5 });
                return {} as Database;
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("QueryError"));
                return {} as Database;
            });

            await expect(productDAO.changeProductQuantity("model", 5, "2024-06-07"))
            .rejects.toThrow(Error("QueryError"));

            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });

        test("should reject with ProductNotFoundError if the product does not exist", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });

            await expect(productDAO.changeProductQuantity("nonexistingmodel", 5, "2024-06-07"))
                .rejects.toThrow(ProductNotFoundError);

            mockDBGet.mockRestore();
        });

        test("should reject with Error if there is a database error", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("QueryError"));
                return {} as Database;
            });

            await expect(productDAO.changeProductQuantity("nonexistingmodel", 5, "2024-06-07"))
                .rejects.toThrow(Error("QueryError"));

                mockDBGet.mockRestore();
        });

        test("should reject with ProductInvalidDate if the change date is before the product's arrival date", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { arrivalDate: "2024-06-08", quantity: 5 });
                return {} as Database;
            });

            await expect(productDAO.changeProductQuantity("model", 5, "2024-06-07"))
                .rejects.toThrow(ProductInvalidDate);

            mockDBGet.mockRestore();
        });

        test("should reject with ProductInvalidDate if the change date is after the current date", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { arrivalDate: "2024-06-08", quantity: 5 });
                return {} as Database;
            });

            await expect(productDAO.changeProductQuantity("model", 5, "2025-06-07"))
                .rejects.toThrow(ProductInvalidDate);

            mockDBGet.mockRestore();
        });

        test("should resolve with the new quantity when no change date is provided", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { arrivalDate: "2024-06-06", quantity: 5 });
                return {} as Database;
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            const result = await productDAO.changeProductQuantity("model", 5, "");
            expect(result).toBe(10);

            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });
    });

    describe("sellProduct", () => {
        test("should resolve true on successful sale", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { arrivalDate: "2024-06-06", quantity: 10 });
                return {} as Database;
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            const result = await productDAO.sellProduct("model", 5, "2024-06-07");
            expect(result).toBe(true);

            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });

        test("should reject with Error if there is a database error", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("QueryError"));
                return {} as Database;
            });

            await expect(productDAO.sellProduct("model", 5, "2024-06-07")).rejects.toThrow(Error("QueryError"));

            mockDBGet.mockRestore();
        });

        test("should reject with Error if there is a database error", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { arrivalDate: "2024-06-06", quantity: 10 });
                return {} as Database;
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("QueryError"));
                return {} as Database;
            });

            await expect(productDAO.sellProduct("model", 5, "2024-06-07")).rejects.toThrow(Error("QueryError"));

            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });

        test("should reject with ProductNotFoundError if the product does not exist", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });

            await expect(productDAO.sellProduct("nonexistingmodel", 5, "2024-06-07"))
                .rejects.toThrow(ProductNotFoundError);

            mockDBGet.mockRestore();
        });

        test("should reject with EmptyProductStockError if the product stock is empty", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {
                    sellingPrice: 100,
                    model: "model",
                    category: Category.LAPTOP,
                    arrivalDate: "2024-06-06",
                    details: "details",
                    quantity: 0
                });
                return {} as Database;
            });

            await expect(productDAO.sellProduct("model", 5, "2024-06-07"))
                .rejects.toThrow(EmptyProductStockError);

            mockDBGet.mockRestore();
        });

        test("should reject with LowProductStockError if the requested quantity is greater than available stock", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {
                    sellingPrice: 100,
                    model: "model",
                    category: Category.LAPTOP,
                    arrivalDate: "2024-06-06",
                    details: "details",
                    quantity: 3
                });
                return {} as Database;
            });

            await expect(productDAO.sellProduct("model", 5, "2024-06-07"))
                .rejects.toThrow(LowProductStockError);

            mockDBGet.mockRestore();
        });

        test("should reject with ProductInvalidDate if the selling date is after the current date", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {
                    sellingPrice: 100,
                    model: "model",
                    category: Category.LAPTOP,
                    arrivalDate: "2024-06-06",
                    details: "details",
                    quantity: 5
                });
                return {} as Database;
            });
            
            await expect(productDAO.sellProduct("model", 1, "2024-08-07"))
                .rejects.toThrow(ProductInvalidDate);

            mockDBGet.mockRestore();
        });

        test("should reject with ProductInvalidDate if the selling date is before the product's arrivalDate", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {
                    sellingPrice: 100,
                    model: "model",
                    category: Category.LAPTOP,
                    arrivalDate: "2024-06-06",
                    details: "details",
                    quantity: 5
                });
                return {} as Database;
            });

            await expect(productDAO.sellProduct("model", 1, "2024-06-04"))
                .rejects.toThrow(ProductInvalidDate);

            mockDBGet.mockRestore();
        });

        test("should resolve true when no selling date is provided", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { arrivalDate: "2024-06-06", quantity: 10 });
                return {} as Database;
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            const result = await productDAO.sellProduct("model", 5, "");
            expect(result).toBe(true);

            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });
    });

    describe("getProducts", () => {
        test("should resolve with a list of products for a valid model grouping", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [
                    {
                        sellingPrice: 100,
                        model: "model1",
                        category: Category.LAPTOP,
                        arrivalDate: "2024-06-06",
                        details: "details1",
                        quantity: 10
                    }
                ]);
                return {} as Database;
            });

             expect(await productDAO.getProducts("model", null, "model1")).toEqual([new Product(100, "model1", Category.LAPTOP, "2024-06-06", "details1", 10)]);
            
            mockDBAll.mockRestore();
        });

        test("should reject with ProductInvalidGrouping for invalid model grouping", async () => {
            await expect(productDAO.getProducts("model", Category.LAPTOP, null))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should reject with ProductInvalidGrouping for invalid model grouping (model empty)", async () => {
            await expect(productDAO.getProducts("model", null, null))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should reject with ProductNotFoundError for a valid model grouping of a non-existing product", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, []);
                return {} as Database;
            });

            await expect(productDAO.getProducts("model", null, "model4"))
                .rejects.toThrow(ProductNotFoundError);

            mockDBAll.mockRestore();
        });

        test("should resolve with a list of products for a valid category grouping", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [
                    {
                        sellingPrice: 100,
                        model: "model1",
                        category: Category.LAPTOP,
                        arrivalDate: "2024-06-06",
                        details: "details1",
                        quantity: 10
                    },
                    {
                        sellingPrice: 15,
                        model: "model4",
                        category: Category.LAPTOP,
                        arrivalDate: "2024-06-09",
                        details: "details4",
                        quantity: 0
                    }
                ]);
                return {} as Database;
            });

            const result = await productDAO.getProducts("category", Category.LAPTOP, null);
            expect(result).toEqual([
                new Product(100, "model1", Category.LAPTOP, "2024-06-06", "details1", 10),
                new Product(15, "model4", Category.LAPTOP, "2024-06-09", "details4", 0)
            ]);

            mockDBAll.mockRestore();
        });

        test("should reject with ProductInvalidGrouping for invalid category grouping", async () => {
            await expect(productDAO.getProducts("category", null, "model"))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should reject with ProductInvalidGrouping for invalid category grouping (category empty)", async () => {
            await expect(productDAO.getProducts("category", null, null))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should resolve with a list of all products for no grouping", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [
                    {
                        sellingPrice: 100,
                        model: "model1",
                        category: Category.LAPTOP,
                        arrivalDate: "2024-06-06",
                        details: "details1",
                        quantity: 10
                    },
                    {
                        sellingPrice: 150,
                        model: "model2",
                        category: Category.SMARTPHONE,
                        arrivalDate: "2024-06-07",
                        details: "details2",
                        quantity: 5
                    },
                    {
                        sellingPrice: 150,
                        model: "model3",
                        category: Category.APPLIANCE,
                        arrivalDate: "2024-06-07",
                        details: "details3",
                        quantity: 5
                    }
                ]);
                return {} as Database;
            });

            const result = await productDAO.getProducts(null, null, null);
            expect(result).toEqual([
                new Product(100, "model1", Category.LAPTOP, "2024-06-06", "details1", 10),
                new Product(150, "model2", Category.SMARTPHONE, "2024-06-07", "details2", 5),
                new Product(150, "model3", Category.APPLIANCE, "2024-06-07", "details3", 5)
            ]);

            mockDBAll.mockRestore();
        });

        test("should reject with ProductInvalidGrouping for invalid grouping (grouping null, category not empty)", async () => {
            await expect(productDAO.getProducts(null, Category.LAPTOP, null))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should reject with ProductInvalidGrouping for invalid grouping (grouping null, model not empty)", async () => {
            await expect(productDAO.getProducts(null, null, "model1"))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should reject with ProductInvalidGrouping for invalid grouping (grouping null, category and model not empty)", async () => {
            await expect(productDAO.getProducts(null, Category.LAPTOP, "model1"))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should reject with ProductInvalidGrouping for invalid grouping (group model, category not empty)", async () => {
            await expect(productDAO.getProducts("model", Category.LAPTOP, "model1"))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should reject with ProductInvalidGrouping for invalid grouping (group category, model not empty)", async () => {
            await expect(productDAO.getProducts("category", Category.LAPTOP, "model1"))
                .rejects.toThrow(ProductInvalidGrouping);
        });


    });

    describe("getAvailableProducts", () => {
        test("should resolve with a list of products for a valid model grouping", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [
                    {
                        sellingPrice: 100,
                        model: "model1",
                        category: Category.LAPTOP,
                        arrivalDate: "2024-06-06",
                        details: "details1",
                        quantity: 10
                    }
                ]);
                return {} as Database;
            });

            const result = await productDAO.getAvailableProducts("model", null, "model1");
            expect(result).toEqual([new Product(100, "model1", Category.LAPTOP, "2024-06-06", "details1", 10)]);

            mockDBAll.mockRestore();
        });

        test("should reject with ProductNotFoundError for a valid model grouping (model stock is empty)", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, []);
                return {} as Database;
            });

            await expect(productDAO.getAvailableProducts("model", null, "model4"))
                .rejects.toThrow(ProductNotFoundError);

            mockDBAll.mockRestore();
        });

        test("should reject with ProductInvalidGrouping for invalid model grouping", async () => {
            await expect(productDAO.getAvailableProducts("model", Category.LAPTOP, null))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should reject with ProductInvalidGrouping for invalid model grouping (model empty)", async () => {
            await expect(productDAO.getAvailableProducts("model", null, null))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should reject with ProductNotFoundError for a valid model grouping of a non-existing product", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, []);
                return {} as Database;
            });

            await expect(productDAO.getAvailableProducts("model", null, "model4"))
                .rejects.toThrow(ProductNotFoundError);

            mockDBAll.mockRestore();
        });

        test("should resolve with a list of products for a valid category grouping", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [
                    {
                        sellingPrice: 100,
                        model: "model1",
                        category: Category.LAPTOP,
                        arrivalDate: "2024-06-06",
                        details: "details1",
                        quantity: 10
                    },
                    {
                        sellingPrice: 15,
                        model: "model4",
                        category: Category.LAPTOP,
                        arrivalDate: "2024-06-09",
                        details: "details4",
                        quantity: 1
                    }
                ]);
                return {} as Database;
            });

            const result = await productDAO.getAvailableProducts("category", Category.LAPTOP, null);
            expect(result).toEqual([
                new Product(100, "model1", Category.LAPTOP, "2024-06-06", "details1", 10),
                new Product(15, "model4", Category.LAPTOP, "2024-06-09", "details4", 1)
            ]);

            mockDBAll.mockRestore();
        });

        test("should reject with ProductInvalidGrouping for invalid category grouping", async () => {
            await expect(productDAO.getAvailableProducts("category", null, "model"))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should reject with ProductInvalidGrouping for invalid category grouping (category empty)", async () => {
            await expect(productDAO.getAvailableProducts("category", null, null))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should resolve with a list of all products for no grouping", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [
                    {
                        sellingPrice: 100,
                        model: "model1",
                        category: Category.LAPTOP,
                        arrivalDate: "2024-06-06",
                        details: "details1",
                        quantity: 10
                    },
                    {
                        sellingPrice: 150,
                        model: "model3",
                        category: Category.APPLIANCE,
                        arrivalDate: "2024-06-08",
                        details: "details3",
                        quantity: 5
                    }
                ]);
                return {} as Database;
            });

            const result = await productDAO.getAvailableProducts(null, null, null);
            expect(result).toEqual([
                new Product(100, "model1", Category.LAPTOP, "2024-06-06", "details1", 10),
                new Product(150, "model3", Category.APPLIANCE, "2024-06-08", "details3", 5)
            ]);

            mockDBAll.mockRestore();
        });

        test("should reject with ProductInvalidGrouping for invalid grouping (grouping null, category not empty)", async () => {
            await expect(productDAO.getAvailableProducts(null, Category.LAPTOP, null))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should reject with ProductInvalidGrouping for invalid grouping (grouping null, model not empty)", async () => {
            await expect(productDAO.getAvailableProducts(null, null, "model1"))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should reject with ProductInvalidGrouping for invalid grouping (grouping null, category and model not empty)", async () => {
            await expect(productDAO.getAvailableProducts(null, Category.LAPTOP, "model1"))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should reject with ProductInvalidGrouping for invalid grouping (group model, category not empty)", async () => {
            await expect(productDAO.getAvailableProducts("model", Category.LAPTOP, "model1"))
                .rejects.toThrow(ProductInvalidGrouping);
        });

        test("should reject with ProductInvalidGrouping for invalid grouping (group category, model not empty)", async () => {
            await expect(productDAO.getAvailableProducts("category", Category.LAPTOP, "model1"))
                .rejects.toThrow(ProductInvalidGrouping);
        });


    });

    describe('deleteProduct', () => {
        test('should resolve true on successful deletion of a product', async () => {
            const mockDBGet = jest.spyOn(db, 'get').mockImplementation(
                (sql, param, callback) => {
                    callback(null, { model: 'iphone' });
                    return {} as Database;
                }
            );

            const mockDBRun = jest.spyOn(db, 'run').mockImplementation(
                (sql, param, callback) => {
                    callback(null);
                    return {} as Database;
                }
            );

            const result = await productDAO.deleteProduct('iphone');

            expect(result).toBe(true);
        });

        test('should reject with ProductNotFoundError if the product does not exist', async () => {
            const mockDBGet = jest.spyOn(db, 'get').mockImplementation(
                (sql, param, callback) => {
                    callback(null, null);
                    return {} as Database;
                }
            );

            await expect(productDAO.deleteProduct('nonexistent')).rejects.toThrow(ProductNotFoundError);

            mockDBGet.mockRestore();
        });
    });

    describe("deleteAllProducts", () => {
        test("should resolve true on successful deletion of all products", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            const result = await productDAO.deleteAllProducts();
            expect(result).toBe(true);

            mockDBRun.mockRestore();
        });
        
    });
});
