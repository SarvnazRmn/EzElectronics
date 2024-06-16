import { describe, test, expect, jest, afterAll, beforeAll} from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import CartController from "../src/controllers/cartController"
import { Cart, ProductInCart } from "../src/components/cart"
import { Category } from "../src/components/product"
import ErrorHandler from "../src/helper"
import Authenticator from "../src/routers/auth"
import { User, Role } from "../src/components/user"
import {cleanup } from "../src/db/cleanup"
import { ProductNotFoundError } from "../src/errors/productError"
import { userInfo } from "os"

const baseURL = "/ezelectronics"

const customer = { username: "User1", name: "Name1", surname: "Surname1", password: "Password1", role: "Customer" };
const admin = { username: "adminuser", name: "Admin", surname: "User", password: "adminpass", role: "Admin" };
const manager = { username: "manageruser", name: "Manager", surname: "User", password: "managerpass", role: "Manager" };

const product = { model: "IPhone55", category: "Smartphone", quantity: 5, details: "Latest model with great features", sellingPrice: 1200, arrivalDate: "2023-01-01" };
const oosProduct = { model: "Laptop", category: "Laptop", quantity: 0, details: "", sellingPrice: 1200, arrivalDate: "2023-01-01" };
const product2 = { model: "Xaomi", category: "Smartphone", quantity: 1, details: "", sellingPrice: 200, arrivalDate: "2023-01-01" };

const respCart = { customer: 'User1', paid: false, paymentDate: "", total: 1200, 
    products: [ { model: "IPhone55", quantity: 1, category: Category.SMARTPHONE, price: 1200 }] };
const respCart2 = { customer: 'User1', paid: false, paymentDate: "", total: 200, 
    products: [ { model: "Xaomi", quantity: 1, category: Category.SMARTPHONE, price: 200 }] };

let customerCookie: string;
let adminCookie: string;
let managerCookie: string;

// creates a new user in the db.
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${baseURL}/users`)
        .send(userInfo)
        .expect(200);
};

// creates a product in the db
const postProduct = async (productInfo: any, mycookie: any) => {
    await request(app)
        .post(`${baseURL}/products`)
        .send(productInfo)
        .set("Cookie", mycookie)
        .expect(200);
};

const addProductToCart = async (productInfo: any, mycookie: any) => {
    await request(app)
        .post(`${baseURL}/carts`)
        .send(productInfo.model)
        .set("Cookie", mycookie)
        .expect(200);
};

// logs in a user and returns the cookie
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${baseURL}/sessions`)
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

const getCurrentCart = async (userInfo: any) => {
    return new Promise<any> ((resolve, reject) =>{
        request(app)
            .get(baseURL + "/carts")
            .set("Cookie", customerCookie)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res)
            })
    })
}

const replenishDB = async () => {
    cleanup();
    await postUser(admin);
    await postUser(customer);
    await postUser(manager);

    adminCookie = await login(admin);
    customerCookie = await login(customer);

    await postProduct(product, adminCookie);
    await postProduct(oosProduct, adminCookie);
    await postProduct(product2, adminCookie);
}

beforeAll(async () => {
    cleanup();
    await postUser(admin);
    await postUser(customer);
    await postUser(manager);

    managerCookie = await login(manager);
    adminCookie = await login(admin);
    customerCookie = await login(customer);

    await postProduct(product, adminCookie);
    await postProduct(oosProduct, adminCookie);
    await postProduct(product2, adminCookie);

    await addProductToCart(product, customerCookie);
})

afterAll(() => {
    cleanup()
});

describe("T1 - getCart | Route", () => {
    test("T3.1.1 - no errors case : It should return the current user cart and a 200 status code", async () => {
        //await addProductToCart(product, customerCookie);
        const response = await request(app)
        .get(baseURL + "/carts")
        .expect(200)
        expect(response.body).toEqual(respCart)   
        expect(CartController.prototype.getCart).toHaveBeenCalledWith(customer)
    })

    test("T3.1.2 - invalid access (role) : It should return a 401 status code", async () => {      
        await request(app)
        .get(baseURL + "/carts")
        .set("Cookie", adminCookie)
        .expect(401)
    })

    test("T3.1.3 - invalid access (not logged) : It should return a 401 status code", async () => {   
        await request(app)
        .get(baseURL + "/carts")
        .expect(401)
    })
})

describe("T2 - addToCart | Route", () => {
    test("T3.2.1 - no errors case : It should return a 200 status code", async () => {
        await request(app)
        .post(baseURL + "/carts").send({model: product.model})
        .set("Cookie", customerCookie)
        .expect(200)
        expect(CartController.prototype.addToCart).toHaveBeenCalledWith(customer, product.model)
    })

    test("T3.2.2 - non existing model : It should return a 404 status code", async () => {
        await request(app)
        .post(baseURL + "/carts").send({model: "non_existing_model"})
        .set("Cookie", customerCookie)
        .expect(404)
        expect(CartController.prototype.addToCart).toHaveBeenCalledWith(customer, "non_existing_model")
    })

    test("T3.2.3 - out-of-stock model : It should return a 409 status code", async () => {
        await request(app)
        .post(baseURL + "/carts").send({model: oosProduct.model})
        .set("Cookie", customerCookie)
        .expect(409)
        expect(CartController.prototype.addToCart).toHaveBeenCalledWith(customer, oosProduct.model)
    })

    test("T3.2.4 -invalid parameters (model empty) : It should return a 422 status code", async () => {
        await request(app)
        .post(baseURL + "/carts").send({model: ""})
        .set("Cookie", customerCookie)
        .expect(422)
    })

    test("T3.2.5 - invalid parameters (model null) : It should return a 422 status code", async () => {
        await request(app)
        .post(baseURL + "/carts").send({model: null})
        .set("Cookie", customerCookie)
        .expect(422)
    })

    test("T3.2.6 - invalid access (role) : It should return a 401 status code", async () => {       
        await request(app)
        .post(baseURL + "/carts").send({model: product.model})
        .set("Cookie", adminCookie)
        .expect(401)
    })

    test("T3.2.7 - invalid access (not logged) : It should return a 401 status code", async () => {       
        await request(app)
        .post(baseURL + "/carts").send({model: product.model})
        .expect(401)
    })
})

describe("T3 - checkoutCart | Route", () => {
    test("T3.3.1 - no errors case : It should return a 200 status code", async () => {
        await request(app)
        .patch(baseURL + "/carts")
        .set("Cookie", customerCookie)
        .expect(200)
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(customer)
    })

    test("T3.3.2 - invalid access (role) : It should return a 401 status code", async () => {       
        await request(app)
        .patch(baseURL + "/carts")
        .set("Cookie", adminCookie)
        .expect(401)
    })

    test("T3.3.3 - invalid access (not logged) : It should return a 401 status code", async () => {       
        await request(app)
        .patch(baseURL + "/carts")
        .expect(401)
    })
})

describe("T4 - getCustomerCarts | Route", () => {
    test("T3.4.1 - no errors case : It should return an array of user carts and a 200 status code", async () => {
        const response = await request(app)
        .get(baseURL + "/carts/history")
        .set("Cookie", customerCookie)
        .expect(200)
        expect(response.body).toEqual([respCart])
        expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledWith(customer)
    })

    test("T3.4.2 - invalid access (role) : It should return a 401 status code", async () => {       
        await request(app)
        .get(baseURL + "/carts/history")
        .set("Cookie", adminCookie)
        .expect(401)
    })

    test("T3.4.3 - invalid access (not logged) : It should return a 401 status code", async () => {       
        await request(app)
        .get(baseURL + "/carts/history")
        .expect(401)
    })
})

describe("T5 - removeProductFromCart | Route", () => {
    test("T3.5.1 - no errors case : It should return a 200 status code", async () => {
        await request(app)
        .delete(baseURL + "/carts/products/" + product.model)
        .set("Cookie", customerCookie)
        .expect(200)
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(customer)
    })

    test("T3.5.2 - model not in cart : It should return a 404 status code", async () => {   
        await request(app)
        .delete(baseURL + "/carts/products/" + product2.model)
        .set("Cookie", customerCookie)
        .expect(404)
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(customer)
    })

    test("T3.5.3 - no current cart : It should return a 404 status code", async () => { 
        //replenishDB(); 
        await request(app)
        .delete(baseURL + "/carts/products/" + product.model)
        .set("Cookie", customerCookie)
        .expect(404)
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(customer)
    })

    test("T3.5.4 - empty cart : It should return a 404 status code", async () => { 
        //getCurrentCart(customer); 
        await request(app)
        .delete(baseURL + "/carts/products/" + product.model)
        .set("Cookie", customerCookie)
        .expect(404)
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(customer)
    })

    test("T3.5.5 - non existing model : It should return a 404 status code", async () => {   
        await request(app)
        .delete(baseURL + "/carts/products/non_existing_model")
        .set("Cookie", customerCookie)
        .expect(404)
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(customer)
    })

    test("T3.5.6 - invalid access (role) : It should return a 401 status code", async () => {  
        await request(app)
        .delete(baseURL + "/carts/products/" + product.model)
        .set("Cookie", adminCookie)
        .expect(401)
    })

    test("T3.5.7 - invalid access (not logged) : It should return a 401 status code", async () => {       
        await request(app)
        .delete(baseURL + "/carts/products/" + product.model)
        .expect(401)
    })
})

describe("T6 - clearCart | Route", () => {
    test("T3.6.1 - no errors case : It should return a 200 status code", async () => {
        await request(app)
        .delete(baseURL + "/carts/current")
        .set("Cookie", customerCookie)
        .expect(200)
        expect(CartController.prototype.clearCart).toHaveBeenCalledWith(customer)
    })

    test("T3.6.2 - invalid access (role) : It should return a 401 status code", async () => {       
        await request(app)
        .delete(baseURL + "/carts/current")
        .set("Cookie", adminCookie)
        .expect(401)
    })

    test("T3.6.3 - invalid access (not logged) : It should return a 401 status code", async () => {       
        await request(app)
        .delete(baseURL + "/carts/current")
        .expect(401)
    })
})

describe("T7 - deleteAllCarts | Route", () => {
    test("T3.7.1 - no errors case : It should return a 200 status code", async () => {
        await request(app)
        .delete(baseURL + "/carts")
        .set("Cookie", adminCookie)
        .expect(200)
        expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledWith()
    })

    test("T3.7.2 - invalid access (role) : It should return a 401 status code", async () => {       
        await request(app)
        .delete(baseURL + "/carts")
        .set("Cookie", customerCookie)
        .expect(401)
    })

    test("T3.7.3 - invalid access (not logged) : It should return a 401 status code", async () => {       
        await request(app)
        .delete(baseURL + "/carts")
        .expect(401)
    })
})

describe("T8 - getAllCarts | Route", () => {
    test("T3.8.1 - no errors case : It should return an array of users carts and a 200 status code", async () => {
        const response = await request(app)
        .get(baseURL + "/carts/all")
        .set("Cookie", adminCookie)
        .expect(200)
        expect(response.body).toEqual([respCart])
        expect(CartController.prototype.getAllCarts).toHaveBeenCalledWith()
    })

    test("T3.8.2 - invalid access (role) : It should return a 401 status code", async () => {       
        await request(app)
        .get(baseURL + "/carts/all")
        .set("Cookie", customerCookie)
        .expect(401)
    })

    test("T3.8.3 - invalid access (not logged) : It should return a 401 status code", async () => {       
        await request(app)
        .get(baseURL + "/carts/all")
        .expect(401)
    })
})