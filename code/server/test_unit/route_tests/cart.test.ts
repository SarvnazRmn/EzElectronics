import { describe, test, expect, jest, afterEach} from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import CartController from "../../src/controllers/cartController"
import { Cart, ProductInCart } from "../../src/components/cart"
import { Category } from "../../src/components/product"
import ErrorHandler from "../../src/helper"
import Authenticator from "../../src/routers/auth"
import { User, Role } from "../../src/components/user"
import { ProductNotFoundError } from "../../src/errors/productError"

jest.mock("../../src/helper")
jest.mock("../../src/controllers/cartController")
jest.mock("../../src/routers/auth")

afterEach(() => {
    jest.clearAllMocks();
});

const baseURL = "/ezelectronics"
const testuser = { username: "User1", name: "Name1", surname: "Surname1", password: "Password1", role: "Customer" };
const testmodel = {model: "IPhone55"}
const testcart = new Cart('User1', false, "", 2400, [ new ProductInCart('IPhone', 2, Category.SMARTPHONE, 1200) ]);
const respCart = { customer: 'User1', paid: false, paymentDate: "", total: 2400, 
    products: [ { model: "IPhone", quantity: 2, category: Category.SMARTPHONE, price: 1200 }] };

describe("T1 - getCart | Route", () => {
    test("T3.1.1 - no errors case : It should return the current user cart and a 200 status code", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(CartController.prototype, "getCart").mockResolvedValue(testcart);

        const response = await request(app).get(baseURL + "/carts")
        expect(CartController.prototype.getCart).toHaveBeenCalledTimes(1)
        expect(response.body).toEqual(respCart)
        expect(response.status).toBe(200)
    })

    test("T3.1.2 - invalid access (role) : It should return a 401 status code", async () => {      
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })

        const response = await request(app).get(baseURL + "/carts")
        expect(CartController.prototype.getCart).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })

    test("T3.1.3 - invalid access (not logged) : It should return a 401 status code", async () => {   
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).get(baseURL + "/carts")
        expect(CartController.prototype.getCart).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })
})

describe("T2 - addToCart | Route", () => {
    test("T3.2.1 - no errors case : It should return a 200 status code", async () => {
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLenght: () => ({}) }),
                notEmpty: () => ({ isLenght: () => ({}) })
            }))
        }))     
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })   
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(CartController.prototype, "addToCart").mockResolvedValue(true);

        const response = await request(app).post(baseURL + "/carts").send(testmodel)
        expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1)
        expect(response.status).toBe(200)
    })

    test("T3.2.2 - no errors case (no param mock) : It should return a 200 status code", async () => {    
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(CartController.prototype, "addToCart").mockResolvedValue(true);

        const response = await request(app).post(baseURL + "/carts").send(testmodel)
        expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1)
        expect(response.status).toBe(200)
    })

    test("T3.2.3 - invalid parameters : It should return a 422 status code", async () => {
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: any) => {
            return res.status(422).json({ error: "The parameters are not formatted properly\n\n" })
        })        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).post(baseURL + "/carts").send({model: ""})
        expect(CartController.prototype.addToCart).not.toHaveBeenCalled()
        expect(response.status).toBe(422)
    })

    test("T3.2.4 - invalid parameters (no param mock, model empty) : It should return a 422 status code", async () => {   
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).post(baseURL + "/carts").send({model: ""})
        expect(CartController.prototype.addToCart).not.toHaveBeenCalled()
        expect(response.status).toBe(422)
    })

    test("T3.2.5 - invalid parameters (no param mock, model null) : It should return a 422 status code", async () => {   
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).post(baseURL + "/carts").send({model: null})
        expect(CartController.prototype.addToCart).not.toHaveBeenCalled()
        expect(response.status).toBe(422)
    })

    test("T3.2.6 - invalid access (role) : It should return a 401 status code", async () => {   
        jest.mock("express-validator", () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLenght: () => ({}) }),
                notEmpty: () => ({ isLenght: () => ({}) })
            }))
        }))     
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })       
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })

        const response = await request(app).post(baseURL + "/carts").send(testmodel)
        expect(CartController.prototype.addToCart).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })

    test("T3.2.7 - invalid access (not logged) : It should return a 401 status code", async () => {     
        jest.mock("express-validator", () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLenght: () => ({}) }),
                notEmpty: () => ({ isLenght: () => ({}) })
            }))
        }))     
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })     
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).post(baseURL + "/carts").send(testmodel)
        expect(CartController.prototype.addToCart).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })
})

describe("T3 - checkoutCart | Route", () => {
    test("T3.3.1 - no errors case : It should return a 200 status code", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValue(true);

        const response = await request(app).patch(baseURL + "/carts")
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1)
        expect(response.status).toBe(200)
    })

    test("T3.3.2 - invalid access (role) : It should return a 401 status code", async () => {       
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })

        const response = await request(app).patch(baseURL + "/carts")
        expect(CartController.prototype.checkoutCart).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })

    test("T3.3.3 - invalid access (not logged) : It should return a 401 status code", async () => {       
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).patch(baseURL + "/carts")
        expect(CartController.prototype.checkoutCart).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })
})

describe("T4 - getCustomerCarts | Route", () => {
    test("T3.4.1 - no errors case : It should return an array of user carts and a 200 status code", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValue([testcart]);

        const response = await request(app).get(baseURL + "/carts/history")
        expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledTimes(1)
        expect(response.body).toEqual([respCart]);
        expect(response.status).toBe(200)
    })

    test("T3.4.2 - invalid access (role) : It should return a 401 status code", async () => {       
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })

        const response = await request(app).get(baseURL + "/carts/history")
        expect(CartController.prototype.getCustomerCarts).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })

    test("T3.4.3 - invalid access (not logged) : It should return a 401 status code", async () => {       
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).get(baseURL + "/carts/history")
        expect(CartController.prototype.getCustomerCarts).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })
})

describe("T5 - removeProductFromCart | Route", () => {
    test("T3.5.1 - no errors case : It should return a 200 status code", async () => {
        jest.mock("express-validator", () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLenght: () => ({}) }),
                notEmpty: () => ({ isLenght: () => ({}) })
            }))
        }))
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValue(true);

        const response = await request(app).delete(baseURL + "/carts/products/IPhone55")
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledTimes(1)
        expect(response.status).toBe(200)
    })

    test("T3.5.2 - no errors case (no param mock) : It should return a 200 status code", async () => {    
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValue(true);

        const response = await request(app).delete(baseURL + "/carts/products/IPhone55")
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledTimes(1)
        expect(response.status).toBe(200)
    })

    test("T3.5.3 - invalid parameters : It should return a 422 status code", async () => {
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: any) => {
            return res.status(422).json({ error: "The parameters are not formatted properly\n\n" })
        })        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).delete(baseURL + "/carts/products/IPhone55")
        expect(CartController.prototype.removeProductFromCart).not.toHaveBeenCalled()
        expect(response.status).toBe(422)
    })

    test("T3.5.4 - invalid access (role) : It should return a 401 status code", async () => {  
        jest.mock("express-validator", () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLenght: () => ({}) }),
                notEmpty: () => ({ isLenght: () => ({}) })
            }))
        }))     
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })   
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })

        const response = await request(app).delete(baseURL + "/carts/products/IPhone55")
        expect(CartController.prototype.removeProductFromCart).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })

    test("T3.5.5 - invalid access (not logged) : It should return a 401 status code", async () => {       
        jest.mock("express-validator", () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLenght: () => ({}) }),
                notEmpty: () => ({ isLenght: () => ({}) })
            }))
        }))
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })   
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).delete(baseURL + "/carts/products/IPhone55")
        expect(CartController.prototype.removeProductFromCart).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })
})

describe("T6 - clearCart | Route", () => {
    test("T3.6.1 - no errors case : It should return a 200 status code", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(CartController.prototype, "clearCart").mockResolvedValue(true);

        const response = await request(app).delete(baseURL + "/carts/current")
        expect(CartController.prototype.clearCart).toHaveBeenCalledTimes(1)
        expect(response.status).toBe(200)
    })

    test("T3.6.2 - invalid access (role) : It should return a 401 status code", async () => {       
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })

        const response = await request(app).delete(baseURL + "/carts/current")
        expect(CartController.prototype.clearCart).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })

    test("T3.6.3 - invalid access (not logged) : It should return a 401 status code", async () => {       
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).delete(baseURL + "/carts/current")
        expect(CartController.prototype.clearCart).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })
})

describe("T7 - deleteAllCarts | Route", () => {
    test("T3.7.1 - no errors case : It should return a 200 status code", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValue(true);

        const response = await request(app).delete(baseURL + "/carts")
        expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledTimes(1)
        expect(response.status).toBe(200)
    })

    test("T3.7.2 - invalid access (role) : It should return a 401 status code", async () => {       
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })

        const response = await request(app).delete(baseURL + "/carts")
        expect(CartController.prototype.deleteAllCarts).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })

    test("T3.7.3 - invalid access (not logged) : It should return a 401 status code", async () => {       
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).delete(baseURL + "/carts")
        expect(CartController.prototype.deleteAllCarts).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })
})

describe("T8 - getAllCarts | Route", () => {
    test("T3.8.1 - no errors case : It should return an array of users carts and a 200 status code", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValue([testcart]);

        const response = await request(app).get(baseURL + "/carts/all")
        expect(CartController.prototype.getAllCarts).toHaveBeenCalledTimes(1)
        expect(response.body).toEqual([respCart])
        expect(response.status).toBe(200)
    })

    test("T3.8.2 - invalid access (role) : It should return a 401 status code", async () => {       
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })

        const response = await request(app).get(baseURL + "/carts/all")
        expect(CartController.prototype.getAllCarts).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })

    test("T3.8.3 - invalid access (not logged) : It should return a 401 status code", async () => {       
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized" })
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).get(baseURL + "/carts/all")
        expect(CartController.prototype.getAllCarts).not.toHaveBeenCalled()
        expect(response.status).toBe(401)
    })
})