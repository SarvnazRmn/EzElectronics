import { test, expect, jest, describe } from "@jest/globals";
import ReviewController from "../../src/controllers/reviewController";
import ReviewDAO from "../../src/dao/reviewDAO";
import ProductDAO from "../../src/dao/productDAO";
import { User } from "../../src/components/user";
import { Product, Category } from "../../src/components/product";

jest.mock("../../src/dao/reviewDAO");
jest.mock("../../src/dao/productDAO");

describe("ReviewController", () => {
    describe("addReview", () => {
        test("Adds a new review for a product", async () => {
            const testModel = "iphone";
            const testUser = { username: "testUser" } as User;
            const testScore = 4;
            const testComment = "Great product";

            // Mock the addReview method of the DAO
            const mockGetProduct = jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new Product(1200, testModel, Category.SMARTPHONE,"2023-01-01" , "Latest model with great features",5));
            const mockAddReview = jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValueOnce(undefined);

            const controller = new ReviewController();
            await controller.addReview(testModel, testUser, testScore, testComment);

            // Check if the addReview method of the DAO has been called once with the correct parameters
            expect(mockAddReview).toHaveBeenCalledTimes(1);
            expect(mockAddReview).toHaveBeenCalledWith(testModel, testUser, testScore, testComment);
            expect(mockGetProduct).toHaveBeenCalledTimes(1);

            mockGetProduct.mockRestore()

        });
    });
});
describe("getProductReviews", () => {
    test("Returns reviews for a product", async () => {
        const testModel = "iphone";
        const expectedReviews = [
            { model: testModel, user: "user1", score: 5, date: "2023-01-01", comment: "Great product" },
            { model: testModel, user: "user2", score: 4, date: "2023-01-02", comment: "Good product" }
        ];

        const mockGetProduct = jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new Product(1200, testModel, Category.SMARTPHONE,"2023-01-01" , "Latest model with great features",5));
        const mockGetProductReviews = jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValueOnce(expectedReviews);

        const controller = new ReviewController();
        const result = await controller.getProductReviews(testModel);

        expect(mockGetProductReviews).toHaveBeenCalledTimes(1);
        expect(mockGetProductReviews).toHaveBeenCalledWith(testModel);
        expect(mockGetProduct).toHaveBeenCalledTimes(1);

      
        expect(result).toEqual(expectedReviews);

        mockGetProduct.mockRestore()

    });
    describe("deleteReview", () => {
        test("Deletes a review for a product", async () => {
            const testModel = "iphone";
            const testUser = { username: "testUser" } as User;

            const mockDeleteReview = jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce(undefined);
            const controller = new ReviewController();
            await controller.deleteReview(testModel, testUser);
            expect(mockDeleteReview).toHaveBeenCalledTimes(1);
            expect(mockDeleteReview).toHaveBeenCalledWith(testModel, testUser);
        });
    });

    describe("deleteReviewsOfProduct", () => {
        test("Deletes all reviews of a product", async () => {
            const testModel = "iphone";

            const mockGetProduct = jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new Product(1200, testModel, Category.SMARTPHONE,"2023-01-01" , "Latest model with great features",5));
            const mockDeleteReviewsOfProduct = jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(undefined);
            const controller = new ReviewController();
            await controller.deleteReviewsOfProduct(testModel);
            expect(mockDeleteReviewsOfProduct).toHaveBeenCalledTimes(1);
            expect(mockDeleteReviewsOfProduct).toHaveBeenCalledWith(testModel);
            expect(mockGetProduct).toHaveBeenCalledTimes(1);

            mockGetProduct.mockRestore()
        });
    });

    describe("deleteAllReviews", () => {
        test("Deletes all reviews of all products", async () => {
            const mockDeleteAllReviews = jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce(undefined);
            const controller = new ReviewController();
            await controller.deleteAllReviews();
            expect(mockDeleteAllReviews).toHaveBeenCalledTimes(1);
        });
    });
   
});
