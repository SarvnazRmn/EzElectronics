import { test, expect, jest } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";
import ReviewController from "../../src/controllers/reviewController";
import ReviewRoutes from "../../src/routers/reviewRoutes";
import { Request, Response, NextFunction } from "express";
import { User } from "../../src/components/user";
import Authenticator from "../../src/routers/auth";
import { ProductReview } from "../../src/components/review";
declare global {
    namespace Express {
        interface User {
            id: string;
            role: string;
        }

        interface Request {
            user?: User;
        }
    }
}

const baseURL = "/ezelectronics";

describe("ReviewRoutes", () => {
    let reviewController;
    let reviewRoutes;
    let requestAgent;
    let mockAuthenticator;

    beforeEach(() => {
        reviewController = new ReviewController();
        mockAuthenticator = {
            isLoggedIn: jest.fn((req: Request, res: Response, next: NextFunction) => {
                req.user = { id: "test-user-id", role: "Customer" };
                next();
            }),
            isCustomer: jest.fn((req: Request, res: Response, next: NextFunction) => {
                next();
            }),
            isAdminOrManager: jest.fn((req: Request, res: Response, next: NextFunction) => {
                next();
            })
        };

        reviewRoutes = new ReviewRoutes(mockAuthenticator as Authenticator);  
        requestAgent = request(app);
    });

    describe("POST /ezelectronics/reviews/:model", () => {
        test("It should return a 200 success code for adding a review", async () => {
            const testReview = { score: 5, comment: "Excellent product!" };
            const testModel = "test-model";
            const testUser = { id: "test-user-id", role: "Customer" };

            jest.spyOn(reviewController, "addReview").mockResolvedValueOnce(undefined);

            const response = await requestAgent.post(`${baseURL}/reviews/${testModel}`).send(testReview);

            expect(response.status).toBe(200);
            expect(reviewController.addReview).toHaveBeenCalledTimes(1);
            expect(reviewController.addReview).toHaveBeenCalledWith(testModel, testUser, testReview.score, testReview.comment);
        });
        test("It should return a 400 status code if score is missing", async () => {
            const testReview = { comment: "Excellent product!" };
            const testModel = "test-model";

            const response = await requestAgent.post(`${baseURL}/reviews/${testModel}`).send(testReview);

            expect(response.status).toBe(400);
            expect(reviewController.addReview).not.toHaveBeenCalled();
        });
        test("It should return a 400 status code if comment is missing", async () => {
            const testReview = { score: 5 };
            const testModel = "test-model";

            const response = await requestAgent.post(`${baseURL}/reviews/${testModel}`).send(testReview);

            expect(response.status).toBe(400);
            expect(reviewController.addReview).not.toHaveBeenCalled();
        });
    });

    describe("GET /ezelectronics/reviews/:model", () => {
        test("It should return a 200 success code and the reviews", async () => {
            const testModel = "test-model";
            const testReviews = [
                { score: 5, comment: "Excellent product!", user: { id: "user1" } },
                { score: 4, comment: "Very good product.", user: { id: "user2" } }
            ];
            const testUser = { id: "test-user-id", role: "Customer" };

            jest.spyOn(reviewController, "getProductReviews").mockResolvedValueOnce(testReviews);

            const response = await requestAgent.get(`${baseURL}/reviews/${testModel}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(testReviews);
            expect(reviewController.getProductReviews).toHaveBeenCalledTimes(1);
            expect(reviewController.getProductReviews).toHaveBeenCalledWith(testModel);
        });
        test("It should return a 404 status code if model parameter is missing", async () => {
            const response = await requestAgent.get(`${baseURL}/reviews/`);

            expect(response.status).toBe(404);
            expect(reviewController.getProductReviews).not.toHaveBeenCalled();
        });
    });

    describe("DELETE /ezelectronics/reviews/:model", () => {
        test("It should return a 200 success code for deleting a review by a user", async () => {
            const testModel = "test-model";
            const testUser = { id: "test-user-id", role: "Customer" };

            jest.spyOn(reviewController, "deleteReview").mockResolvedValueOnce(undefined);

            const response = await requestAgent.delete(`${baseURL}/reviews/${testModel}`);

            expect(response.status).toBe(200);
            expect(reviewController.deleteReview).toHaveBeenCalledTimes(1);
            expect(reviewController.deleteReview).toHaveBeenCalledWith(testModel, testUser);
        });
        test("It should return a 403 status code if user is not authorized to delete the review", async () => {
            const testModel = "test-model";
            const testUser = { id: "test-user-id", role: "Guest" };

            const response = await requestAgent.delete(`${baseURL}/reviews/${testModel}`);

            expect(response.status).toBe(403);
            expect(reviewController.deleteReview).not.toHaveBeenCalled();
        });
        test("It should return a 403 forbidden error if user is not admin or manager", async () => {
            const testUser = { id: "test-user-id", role: "Customer" };
    
            const response = await requestAgent.delete(`${baseURL}/reviews/`).set("Cookie", "role=customer");
    
            expect(response.status).toBe(403);
            expect(reviewController.deleteAllReviews).not.toHaveBeenCalled();
        });
    });

    describe("DELETE /ezelectronics/reviews/:model/all", () => {
        test("It should return a 200 success code for deleting all reviews of a product", async () => {
            const testModel = "test-model";
            const testUser = { id: "test-user-id", role: "Admin" };

            jest.spyOn(reviewController, "deleteReviewsOfProduct").mockResolvedValueOnce(undefined);

            const response = await requestAgent.delete(`${baseURL}/reviews/${testModel}/all`);

            expect(response.status).toBe(200);
            expect(reviewController.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
            expect(reviewController.deleteReviewsOfProduct).toHaveBeenCalledWith(testModel);
        });
    });

    describe("DELETE /ezelectronics/reviews/", () => {
        test("It should return a 200 success code for deleting all reviews", async () => {
            const testUser = { id: "test-user-id", role: "Admin" };

            jest.spyOn(reviewController, "deleteAllReviews").mockResolvedValueOnce(undefined);

            const response = await requestAgent.delete(`${baseURL}/reviews/`);

            expect(response.status).toBe(200);
            expect(reviewController.deleteAllReviews).toHaveBeenCalledTimes(1);
            expect(reviewController.deleteAllReviews).toHaveBeenCalledWith();
        }); 
    });
});
