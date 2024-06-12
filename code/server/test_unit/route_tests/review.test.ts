import { describe, test, expect, jest, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";
import ReviewController from "../../src/controllers/reviewController";
import Authenticator from "../../src/routers/auth";
import { Server } from "http";


jest.mock("../../src/routers/auth")

const baseURL = "/ezelectronics";

describe("ReviewRoutes", () => {

    const testReview = { score: 5, comment: "comment" }
    const testModel = "model" 
    const testUser = { id: "userId", role: "Customer"}
    let server: Server;

    describe("POST", () => {
        test("It should return a 200 success code for adding a review", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser
                return next()
            })
        
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
                return next()
            })

            const mockController = jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce() 

            const response = await request(app).post(`${baseURL}/reviews/${testModel}`)
            .send(testReview) 

            expect(response.status).toBe(200)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1) 
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(testModel, testUser, testReview.score, testReview.comment)

            mockController.mockRestore()
        })
   
        test("It should return a 422 status code if score is missing", async () => {
            const testReview = { comment: "Excellent product!" };
            const testModel = "model";

            const mockController = jest.spyOn(ReviewController.prototype, "addReview");

            const response = await request(app).post(`${baseURL}/reviews/${testModel}`).send(testReview);

            expect(response.status).toBe(422);
            expect(mockController).not.toHaveBeenCalled();
        });

        test("It should return a 422 status code if comment is missing", async () => {
            const testReview = { score: 5 };
            const testModel = "model";
            const mockController = jest.spyOn(ReviewController.prototype, "addReview");

            const response = await request(app).post(`${baseURL}/reviews/${testModel}`).send(testReview);

            expect(response.status).toBe(422);
            expect(mockController).not.toHaveBeenCalled();
        });
    });

    describe("GET /ezelectronics/reviews/:model", () => {
        test("It should return a 200 success code and the reviews", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser
                return next()
            })

            const testModel = "testmodel";
            const testReviews = [
                { score: 5, comment: "Excellent product!", model:'Iphone', date:'12/01/03', user: "user1" },
                { score: 4, comment: "Very good product.", model:'Iphone', date:'12/01/03', user: "user2" } 
            ];
            const testUser = { id: "userId", role: "Customer" };

            const mockController = jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce(testReviews);

            const response = await request(app).get(`${baseURL}/reviews/${testModel}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(testReviews);
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(1);
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(testModel);

            mockController.mockRestore();
        });
        test("It should return a 404 status code if model parameter is missing", async () => {
            const mockController = jest.spyOn(ReviewController.prototype, "getProductReviews");

            const response = await request(app).get(`${baseURL}/reviews/`);

            expect(response.status).toBe(404);
            expect(mockController).not.toHaveBeenCalled();
        });
    });

    describe("DELETE /ezelectronics/reviews/:model", () => {
        
        test("It should return a 200 success code for deleting a review by a user", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser
                return next()
            })
        
            const mockCustomer = jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
                return next()
            })
            const testModel = "model";
            const testUser = { id: "userId", role: "Customer" };

            const mockController = jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce(undefined);

            const response = await request(app).delete(`${baseURL}/reviews/${testModel}`);

            expect(response.status).toBe(200);
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1);
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(testModel, testUser);

            mockController.mockRestore();
            mockCustomer.mockRestore();
        });
    });

    describe("DELETE /ezelectronics/reviews/:model/all", () => {
        test("It should return a 200 success code for deleting all reviews of a product", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser
                return next()
            })
        
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
                return next()
            })
            const testModel = "test-model";
            const testUser = { id: "test-user-id", role: "Admin" };

            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(undefined);

            const response = await request(app).delete(`${baseURL}/reviews/${testModel}/all`);

            expect(response.status).toBe(200);
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(testModel);
        });

    });

    describe("DELETE /ezelectronics/reviews/", () => {
        test("It should return a 200 success code for deleting all reviews", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
                req.user = testUser
                return next()
            })
        
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
                return next()
            })
            const testUser = { id: "test-user-id", role: "Admin" };

            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce(undefined);

            const response = await request(app).delete(`${baseURL}/reviews/`);

            expect(response.status).toBe(200);
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledWith();
        }); 

    }); 
});
