import { test, expect, jest, afterEach, describe } from "@jest/globals"
import CartController from "../../src/controllers/cartController"
import { Cart, ProductInCart } from "../../src/components/cart"
import { Category } from "../../src/components/product"
import CartDAO from "../../src/dao/cartDAO"
import { User, Role } from "../../src/components/user"

jest.mock("../../src/dao/cartDAO")

afterEach(() => {
    jest.clearAllMocks();
});

const cartController = new CartController();
const testuser = new User("User1", "Name1", "Surname1", Role.CUSTOMER, "Address1", "Birthdate1"); 
const testerr = "Internal Server Error"
const testcart = new Cart(
    'User1',
    false,
    "",
    16,
    [new ProductInCart(
            'a',
            2,
            Category.SMARTPHONE,
            8
    )]
);

describe("T1 - getCart | CartController", () => {
    test("T2.1.1 - no errors case : It should call CartDAO.getCart and return the current user cart", async () => {
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testcart);
        
        const response = await cartController.getCart(testuser); 

        expect(CartDAO.prototype.getCart).toHaveBeenCalledTimes(1);
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testuser); 
        expect(response).toEqual(testcart);
    })
})

describe("T2 - addToCart | CartController", () => {
    test("T2.2.1 - no errors case : It should call CartDAO.addToCart", async () => {
        jest.spyOn(CartDAO.prototype, "addToCart").mockResolvedValueOnce(true);
        
        const response = await cartController.addToCart(testuser, "IPhone55"); 

        expect(CartDAO.prototype.addToCart).toHaveBeenCalledTimes(1);
        expect(CartDAO.prototype.addToCart).toHaveBeenCalledWith(testuser, "IPhone55");
    })
})

describe("T3 - checkoutCart | CartController", () => {
    test("T2.3.1 - no errors case : It should call CartDAO.checkoutCart", async () => {
        jest.spyOn(CartDAO.prototype, "checkoutCart").mockResolvedValueOnce(true);
        
        const response = await cartController.checkoutCart(testuser); 

        expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledTimes(1);
        expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith(testuser);
    })
})

describe("T4 - getCustomerCarts | CartController", () => {
    test("T2.4.1 - no errors case : It should call CartDAO.getCustomerCarts and return an array of user carts", async () => {
        jest.spyOn(CartDAO.prototype, "getCustomerCarts").mockResolvedValueOnce([testcart]);
        
        const response = await cartController.getCustomerCarts(testuser); 

        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledTimes(1);
        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledWith(testuser);
        expect(response).toEqual([testcart]);
    })
})

describe("T5 - removeProductFromCart | CartController", () => {
    test("T2.5.1 - no errors case : It should call CartDAO.removeProductFromCart", async () => {
        jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
        
        const response = await cartController.removeProductFromCart(testuser, "IPhone55"); 

        expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalledTimes(1);
        expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalledWith(testuser, "IPhone55");
    })
})

describe("T6 - clearCart | CartController", () => {
    test("T2.6.1 - no errors case : It should call CartDAO.clearCart", async () => {
        jest.spyOn(CartDAO.prototype, "clearCart").mockResolvedValueOnce(true);
        
        const response = await cartController.clearCart(testuser); 

        expect(CartDAO.prototype.clearCart).toHaveBeenCalledTimes(1);
        expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(testuser);
    })
})

describe("T7 - deleteAllCarts | CartController", () => {
    test("T2.7.1 - no errors case : It should call CartDAO.deleteAllCarts", async () => {
        jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
        
        const response = await cartController.deleteAllCarts(); 

        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);
        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledWith();
    })
})

describe("T8 - getAllCarts | CartController", () => {
    test("T2.8.1 - no errors case : It should call CartDAO.getAllCarts and return an array of users carts", async () => {
        jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValueOnce([testcart]);
        
        const response = await cartController.getAllCarts(); 

        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledTimes(1);
        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledWith();
        expect(response).toEqual([testcart]);
    })
})