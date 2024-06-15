import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from 'supertest';
import { app } from "../index";
import { cleanup } from "../src/db/cleanup";

const routePath = "/ezelectronics"; 

const customer = { username: "testuser1", name: "Test", surname: "User1", password: "password1", role: "Customer" };
const customer2 = { username: "testuser2", name: "Test", surname: "User2", password: "password2", role: "Customer" };
const admin = { username: "adminuser", name: "Admin", surname: "User", password: "adminpass", role: "Admin" };
const manager = { username: "manageruser", name: "Manager", surname: "User", password: "managerpass", role: "Manager" };

let customerCookie: string;
let adminCookie: string;
let managerCookie: string;
let customerCookie2: string;

const product1 = { model: "iphone12", category: "Smartphone", quantity: 5, details: "Latest model with great features", sellingPrice: 1200, arrivalDate: "2023-01-01" };
const product2 = { model: "macbookpro", category: "Laptop", quantity: 3, details: "High-performance laptop for professionals", sellingPrice: 2500 };

// creates a new user in the db.
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200);
};

// logs in a user and returns the cookie
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err);
                }
                resolve(res.header["set-cookie"][0]);
            });
    });
};

// creates a product in the db
const postProduct = async (productInfo: any, mycookie: any) => {
    await request(app)
        .post(`${routePath}/products`)
        .send(productInfo)
        .set("Cookie", mycookie)
        .expect(200);
};

beforeAll(async () => {
    cleanup();
    await postUser(admin);
    await postUser(customer);
    await postUser(manager);
    await postUser(customer2);

    adminCookie = await login(admin);
    customerCookie = await login(customer);
    managerCookie = await login(manager);
    customerCookie2 = await login(customer2);

    await postProduct(product1, adminCookie);
    await postProduct(product2, adminCookie);
});

// After executing tests
afterAll(() => {
    cleanup();
});

describe("Product API integration tests", () => {
    describe("POST /reviews/:model", () => {
        test("It should add a review of a product, expecting code 200", async () => {
            await request(app)
                .post(`${routePath}/reviews/iphone12`)
                .send({ score: 4, comment: "Great product!" })
                .set("Cookie", customerCookie)
                .expect(200);
        });

        test("Adding a review to a non-existing product, expecting error code 404", async () => {
            await request(app)
                .post(`${routePath}/reviews/nonexistant`)
                .send({ score: 3, comment: "Not found" })
                .set("Cookie", customerCookie)
                .expect(404);
        });
    });

    describe("GET /reviews/:model", () => {
        test("It retrieves all reviews of a product, expecting code 200", async () => {
            let review = await request(app)
                .get(`${routePath}/reviews/iphone12`)
                .set("Cookie", customerCookie)
                .expect(200);

            let firstReview = review.body[0];
            expect(firstReview.model).toBe("iphone12");
            expect(firstReview.score).toBe(4);
        });

        test("Retrieving reviews of a non-existing product, expecting error code 404", async () => {
            await request(app)
                .get(`${routePath}/reviews/nonexistant`)
                .set("Cookie", customerCookie)
                .expect(404);
        });
    });

    describe("DELETE /reviews/:model", () => {
        test("It deletes a user's review of a product, expecting code 200", async () => {
            await request(app)
                .delete(`${routePath}/reviews/iphone12`)
                .set("Cookie", customerCookie)
                .expect(200);
        });

        test("Deleting a review of a non-existing product, expecting error code 404", async () => {
            await request(app)
                .delete(`${routePath}/reviews/nonexistant`)
                .set("Cookie", customerCookie)
                .expect(404);
        });
    });

    describe("DELETE /reviews/:model/all", () => {
        test("It deletes all reviews of a product, expecting code 200", async () => {
            await request(app)
                .delete(`${routePath}/reviews/macbookpro/all`)
                .set("Cookie", adminCookie)
                .expect(200);
        });

        test("Deleting reviews of a non-existing product, expecting error code 404", async () => {
            await request(app)
                .delete(`${routePath}/reviews/nonexistant/all`)
                .set("Cookie", adminCookie)
                .expect(404);
        });
    });

    describe("DELETE /reviews", () => {
        test("It deletes all reviews of every product, expecting code 200", async () => {
            await request(app)
                .delete(`${routePath}/reviews`)
                .set("Cookie", adminCookie)
                .expect(200);
        });
    });
});
