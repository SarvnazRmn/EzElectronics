import { test, expect, jest } from '@jest/globals';
import ProductController from '../../src/controllers/productController';
import ProductDAO from '../../src/dao/productDAO';
import { Product, Category } from "../../src/components/product";

jest.mock('../../src/dao/productDAO');

const mockProduct = new Product (
    100,
    "mockModel",
    Category.SMARTPHONE,
    "2024-01-01",
    "details",
    10
)

describe('ProductController', () => {
    let productController: ProductController;

    beforeEach(() => {
        // Clear all instances and calls to constructor and all methods of ProductDAO mock
        jest.clearAllMocks();
        jest.resetAllMocks();
        // Initialize ProductController with mocked ProductDAO
        productController = new ProductController();
    });

    test('registerProducts - It should return true', async () => {
        const model = 'model1';
        const category = 'Laptop';
        const quantity = 10;
        const details = 'Test details';
        const sellingPrice = 100;
        const arrivalDate = '2024-06-06';

        jest.spyOn(ProductDAO.prototype, 'registerProducts').mockResolvedValueOnce(true);

        const response = await productController.registerProducts(model, category, quantity, details, sellingPrice, arrivalDate);

        expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith(model, category, quantity, details, sellingPrice, arrivalDate);
        expect(response).toBe(true);
    });

    test('changeProductQuantity - It should return the new quantity', async () => {
        const model = 'model1';
        const newQuantity = 5;
        const changeDate = '2024-06-10';

        jest.spyOn(ProductDAO.prototype, 'changeProductQuantity').mockResolvedValueOnce(newQuantity);

        const response = await productController.changeProductQuantity(model, newQuantity, changeDate);

        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledWith(model, newQuantity, changeDate);
        expect(response).toBe(newQuantity);
    });

    test('sellProduct - It should return the true', async () => {
        const model = 'model1';
        const quantity = 3;
        const sellingDate = '2024-06-10';

        jest.spyOn(ProductDAO.prototype, 'sellProduct').mockResolvedValueOnce(true);

        const response = await productController.sellProduct(model, quantity, sellingDate);

        expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(model, quantity, sellingDate);
        expect(response).toBe(true);
    });

    test('getProducts - It should return an array of products', async () => {
        const grouping = 'category';
        const category = 'Laptop';
        const testProducts = [
            { sellingPrice: 100, model: 'model1', category: Category.LAPTOP, arrivalDate: "2024-06-06", details: "details1", quantity: 5 },
            { sellingPrice: 50, model: 'model2', category: Category.SMARTPHONE, arrivalDate: "2024-06-07", details: "details2", quantity: 7  }
        ];

        jest.spyOn(ProductDAO.prototype, 'getProducts').mockResolvedValueOnce(testProducts);

        const response = await productController.getProducts(grouping, category, null);

        expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith(grouping, category, null);
        expect(response).toEqual(testProducts);
    });

    test('deleteProduct - It should return true if the product is successfully deleted', async () => {
        const model = 'model1';

        jest.spyOn(ProductDAO.prototype, 'deleteProduct').mockResolvedValueOnce(true);

        const response = await productController.deleteProduct(model);

        expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledWith(model);
        expect(response).toBe(true);
    });

    test('deleteAllProducts - It should return true if all products are successfully deleted', async () => {
        jest.spyOn(ProductDAO.prototype, 'deleteAllProducts').mockResolvedValueOnce(true);

        const response = await productController.deleteAllProducts();

        expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);
        expect(response).toBe(true);
    });
});

