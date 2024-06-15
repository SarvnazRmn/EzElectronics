import { describe, test, expect, beforeAll } from "@jest/globals"
import CartDAO from "../../src/dao/cartDAO"
import { User, Role} from "../../src/components/user"
import { Cart, ProductInCart } from "../../src/components/cart"
import { Product, Category } from "../../src/components/product" 
import db from "../../src/db/db"
import {cleanup } from "../../src/db/cleanup"

import {
    CartNotFoundError,
    ProductInCartError,
    ProductNotInCartError,
    WrongUserCartError,
    EmptyCartError,
  } from "../../src/errors/cartError";
  import {
    ProductNotFoundError,
    ProductAlreadyExistsError,
    ProductSoldError,
    EmptyProductStockError,
    LowProductStockError,
  } from "../../src/errors/productError";

beforeAll(() => {
    cleanup()
});

const cartDAO = new CartDAO();

const prodInCart = new ProductInCart('IPhone55',2,Category.SMARTPHONE,8);
const testuser1 = new User("User1", "Name1", "Surname1", Role.CUSTOMER, "Address1", "Birthdate1"); 
const userUnpaid1 = new Cart('User1',false,"",16,[prodInCart]);
const dbq_userUnpaid1 = "INSERT INTO carts (customer, paid, paymentDate, total) VALUES ('User1', 0, NULL, 16)"
const userUnpaidEmpty1 = new Cart('User1',false,"",0,[]);
const dbq_userUnpaidEmpty1 = "INSERT INTO carts (customer, paid, paymentDate, total) VALUES ('User1', 0, NULL, 0)"
const userPaid1 = new Cart('User1',true,"2024-06-15",16,[prodInCart]);
const dbq_userPaid1 = "INSERT INTO carts (customer, paid, paymentDate, total) VALUES ('User1', 1, '2024-06-15', 16)"

const testuser2 = new User("User2", "Name2", "Surname2", Role.CUSTOMER, "Address2", "Birthdate2"); 
const userUnpaid2 = new Cart('User2',false,"",16,[prodInCart]);
const dbq_userUnpaid2 = "INSERT INTO carts (customer, paid, paymentDate, total) VALUES ('User2', 0, NULL, 16)"
const userUnpaidEmpty2 = new Cart('User2',false,"",0,[]);
const dbq_userUnpaidEmpty2 = "INSERT INTO carts (customer, paid, paymentDate, total) VALUES ('User2', 0, NULL, 0)"
const userPaid2 = new Cart('User2',true,"2024-06-15",16,[prodInCart]);
const dbq_userPaid2 = "INSERT INTO carts (customer, paid, paymentDate, total) VALUES ('User2', 1, '2024-06-15', 16)"

const testproduct = new Product(8, "IPhone55", Category.SMARTPHONE, "2024-05-15", null, 50);
const oos_product = new Product(8, "oos_product", Category.LAPTOP, "2024-05-15", null, 0);
const dbq_add2ToCart = "INSERT INTO cartItems (cart_id, product_model, quantity_in_cart) VALUES (?, 'IPhone55', 2)"
const dbq_newProduct = "INSERT INTO products(model, category, quantity, details, sellingPrice, arrivalDate) VALUES VALUES ('IPhone55', 'Smartphone', 0, NULL, 8, '2024-05-15')"
const dbq_newOosProduct = "INSERT INTO products(model, category, quantity, details, sellingPrice, arrivalDate) VALUES VALUES ('oos_product', 'Laptop', 0, NULL, 8, '2024-05-15')"

describe("T1 - getCart | DAO", () => {
    let unpaidId = 0;
    let paidId = 0;
    test("T1.1.1 - empty db : It should create and return the current user cart", async () => {
        const response = await cartDAO.getCart(testuser1);
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 0", [], (err: Error , cart: any) => {
            unpaidId = cart.cart_id;
            expect(new Cart(cart.customer, cart.paid, cart.paymentDate, cart.total, [])).toEqual(userUnpaidEmpty1);
        });
        expect(response).toEqual(userUnpaidEmpty1);
    })

    test("T1.1.2 - empty cart : It should return the current user cart", async () => {
        const response = await cartDAO.getCart(testuser1);
        expect(response).toEqual(userUnpaidEmpty1);
    })

    test("T1.1.3 - two carts, one current : It should return the current user cart", async () => {
        db.run(dbq_userUnpaidEmpty1, [], () => {});
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 1", [], (err: Error , cart: any) => { paidId = cart.cart_id });
        db.run(dbq_newProduct, [], () => {});
        db.run(dbq_add2ToCart, [paidId], () => {});

        const response = await cartDAO.getCart(testuser1);
        expect(response).toEqual(userUnpaidEmpty1);
        
        cleanup();
    })
})

describe("T2 - addToCart | DAO", () => {
    let usercartId = 0;
    test("T1.2.1 - empty db : It should create the current user cart, with new product", async () => {
        await cartDAO.addToCart(testuser1, "IPhone55");
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 0", [], (err: Error , cart: any) => { usercartId = cart.cart_id });
        db.all("SELECT * FROM cartItems WHERE cartId = ?", [usercartId], (err: Error , rows: any[]) => {
            expect(rows[0].product_model).toBe("IPhone55");
            expect(rows[0].quantity_in_cart).toBe(1);
            expect(rows).toHaveLength(1);
        });
        const response = await cartDAO.addToCart(testuser1, "IPhone55");
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 0", [], (err: Error , cart: any) => {
            usercartId = cart.cart_id;
            expect(new Cart(cart.customer, cart.paid, cart.paymentDate, cart.total, [prodInCart])).toEqual(userUnpaid1);
        });
        db.all("SELECT * FROM cartItems WHERE cartId = ?", [usercartId], (err: Error , rows: any[]) => {
            expect(rows[0].product_model).toBe("IPhone55");
            expect(rows[0].quantity_in_cart).toBe(2);
            expect(rows).toHaveLength(1);
        });
        expect(response).toBe(true);

        cleanup();
    })

    test("T1.2.2 - empty cart : It should update the current user cart with new product", async () => {
        db.run(dbq_userUnpaidEmpty1, [], () => {});
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 0", [], (err: Error , cart: any) => { usercartId = cart.cart_id });
        await cartDAO.addToCart(testuser1, "IPhone55");
        db.all("SELECT * FROM cartItems WHERE cartId = ?", [usercartId], (err: Error , rows: any[]) => {
            expect(rows[0].product_model).toBe("IPhone55");
            expect(rows[0].quantity_in_cart).toBe(1);
            expect(rows).toHaveLength(1);
        });
        const response = await cartDAO.addToCart(testuser1, "IPhone55");
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 0", [], (err: Error , cart: any) => {
            expect(new Cart(cart.customer, cart.paid, cart.paymentDate, cart.total, [prodInCart])).toEqual(userUnpaid1);
        });
        db.all("SELECT * FROM cartItems WHERE cartId = ?", [usercartId], (err: Error , rows: any[]) => {
            expect(rows[0].product_model).toBe("IPhone55");
            expect(rows[0].quantity_in_cart).toBe(2);
            expect(rows).toHaveLength(1);
        });
        expect(response).toBe(true);
    })

    test("T1.2.3 - invalid model : It should return a 404 error", async () => {
        const response = await cartDAO.addToCart(testuser1, "non_existing_product");
        expect(response).toEqual(new ProductNotFoundError());
    })

    test("T1.2.4 - product out-of-stock : It should return a 409 error", async () => {
        db.run(dbq_newOosProduct, [], () => {});
        const response = await cartDAO.addToCart(testuser1, "oos_product");
        expect(response).toEqual(new EmptyProductStockError());

        cleanup();
    })
})

describe("T3 - checkoutCart | DAO", () => {
    let usercartId = 0;
    test("T1.3.1 - empty db : It should return a 404 error", async () => {
        const response = await cartDAO.checkoutCart(testuser1);
        expect(response).toEqual(new CartNotFoundError());
    })

    test("T1.3.2 - only paid cart : It should return a 404 error", async () => {
        db.run(dbq_userPaid1, [], () => {});
        const response = await cartDAO.checkoutCart(testuser1);
        expect(response).toEqual(new CartNotFoundError());

        cleanup()
    })

    test("T1.3.3 - empty cart : It should return a 400 error", async () => {
        db.run(dbq_userUnpaidEmpty1, [], () => {});
        const response = await cartDAO.checkoutCart(testuser1);
        expect(response).toEqual(new EmptyCartError());
    })

    test("T1.3.4 - out-of-stock product : It should return a 409 error", async () => {
        db.run(dbq_newOosProduct, [], () => {});
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 0", [], (err: Error , cart: any) => { usercartId = cart.cart_id });
        db.run(dbq_add2ToCart, [usercartId], () => {});
        const response = await cartDAO.checkoutCart(testuser1);
        expect(response).toEqual(new EmptyProductStockError());

        cleanup()
    })

    test("T1.3.5 - out-of-stock product : It should return a 409 error", async () => {
        db.run("INSERT INTO products(model, category, quantity, details, sellingPrice, arrivalDate) VALUES VALUES ('oos_product', 'Laptop', 1, NULL, 8, '2024-05-15')", [], () => {});
        db.run(dbq_userUnpaidEmpty1, [], () => {});
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 0", [], (err: Error , cart: any) => { usercartId = cart.cart_id });
        db.run(dbq_add2ToCart, [usercartId], () => {});
        const response = await cartDAO.checkoutCart(testuser1);
        expect(response).toEqual(new LowProductStockError());

        cleanup();
    })

    test("T1.3.6 - no errors case : should mark the cart as sold", async () => {
        db.run(dbq_newProduct, [], () => {});
        db.run(dbq_userUnpaidEmpty1, [], () => {});
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 0", [], (err: Error , cart: any) => { usercartId = cart.cart_id });
        db.run(dbq_add2ToCart, [usercartId], () => {});
        const response = await cartDAO.checkoutCart(testuser1);
        expect(response).toBe(true);

        cleanup();
    })

    test("T1.3.7 - no errors case (using DAO) : should mark the cart as sold", async () => {
        db.run(dbq_newProduct, [], () => {});
        db.run(dbq_userUnpaidEmpty1, [], () => {});
        await cartDAO.addToCart(testuser1, "IPhone55");
        const response = await cartDAO.checkoutCart(testuser1);
        expect(response).toBe(true);

        cleanup();
    })
})

describe("T4 - getCustomerCarts | DAO", () => {
    let usercartId = 0;
    test("T1.4.1 - empty db : should return an empty array", async () => {
        const response = await cartDAO.getCustomerCarts(testuser1);
        expect(response).toEqual([]);
    })

    test("T1.4.2 - two carts, one paid : should return an array with the paid cart", async () => {
        db.run(dbq_newProduct, [], () => {});
        db.run(dbq_userUnpaidEmpty1, [], () => {});
        db.run(dbq_userPaid1, [], () => {});
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 1", [], (err: Error , cart: any) => { usercartId = cart.cart_id });
        db.run(dbq_add2ToCart, [usercartId], () => {});
        const response = await cartDAO.getCustomerCarts(testuser1);
        expect(response).toEqual([userPaid1]);

        cleanup();
    })

    test("T1.4.3 - two carts, one paid (using DAO) : should return an array with the paid cart", async () => {
        db.run(dbq_newProduct, [], () => {});
        db.run(dbq_userUnpaidEmpty1, [], () => {});
        db.run(dbq_userPaid1, [], () => {});
        await cartDAO.addToCart(testuser1, "IPhone55");
        const response = await cartDAO.getCustomerCarts(testuser1);
        expect(response).toEqual([userPaid1]);

        cleanup();
    })
})

describe("T5 - removeProductFromCart | DAO", () => {
    let usercartId = 0;
    test("T1.5.1 - invalid model : It should return a 404 error", async () => {
        const response = await cartDAO.removeProductFromCart(testuser1, "non_existing_product");
        expect(response).toEqual(new ProductNotFoundError());

        cleanup()
    })

    test("T1.5.2 - only paid cart : It should return a 404 error", async () => {
        db.run(dbq_userPaid1, [], () => {});
        const response = await cartDAO.removeProductFromCart(testuser1, "IPhone55");
        expect(response).toEqual(new CartNotFoundError());

        cleanup()
    })

    test("T1.5.3 - empty cart : It should return a 404 error", async () => {
        db.run(dbq_userUnpaidEmpty1, [], () => {});
        const response = await cartDAO.removeProductFromCart(testuser1, "IPhone55");
        expect(response).toEqual(new CartNotFoundError());
        
        cleanup();
    })

    test("T1.5.4 - cart without specified model : It should return a 404 error", async () => {
        db.run("INSERT INTO products(model, category, quantity, details, sellingPrice, arrivalDate) VALUES VALUES ('DeviceAAA', 'Smartphone', 0, NULL, 8, '2024-05-15')", [], () => {});
        db.run(dbq_userUnpaid1, [], () => {});
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 0", [], (err: Error , cart: any) => { usercartId = cart.cart_id });
        db.run(dbq_add2ToCart, [usercartId], () => {});
        const response = await cartDAO.removeProductFromCart(testuser1, "DeviceAAA");
        expect(response).toEqual(new ProductNotInCartError());
        
        cleanup();
    })

    test("T1.5.5 - cart without specified model (using DAO): It should return a 404 error", async () => {
        db.run("INSERT INTO products(model, category, quantity, details, sellingPrice, arrivalDate) VALUES VALUES ('DeviceAAA', 'Smartphone', 0, NULL, 8, '2024-05-15')", [], () => {});
        db.run(dbq_userUnpaid1, [], () => {});
        cartDAO.addToCart(testuser1, "DeviceAAA");
        const response = await cartDAO.removeProductFromCart(testuser1, "DeviceAAA");
        expect(response).toEqual(new ProductNotInCartError());
        
        cleanup();
    })

    test("T1.5.6 - no errors case : should update the cart removing one product instance", async () => {
        db.run(dbq_newProduct, [], () => {});
        db.run(dbq_userUnpaidEmpty1, [], () => {});
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 0", [], (err: Error , cart: any) => { usercartId = cart.cart_id });
        db.run(dbq_add2ToCart, [usercartId], () => {});
        const response = await cartDAO.removeProductFromCart(testuser1, "IPhone55");
        db.get("SELECT quantity_in_cart FROM cartItems WHERE cartId = ? AND product_model = IPhone55", [usercartId], (err: Error , quantity: any) => {
            expect(quantity).toBe(1);
        });
        expect(response).toBe(true);

        cleanup();
    })

    test("T1.5.7 - no errors case (using DAO) : should update the cart removing one product instance", async () => {
        db.run(dbq_newProduct, [], () => {});
        db.run(dbq_userUnpaidEmpty1, [], () => {});
        await cartDAO.addToCart(testuser1, "IPhone55");
        const response = await cartDAO.removeProductFromCart(testuser1, "IPhone55");
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 0", [], (err: Error , cart: any) => { usercartId = cart.cart_id });
        db.get("SELECT quantity_in_cart FROM cartItems WHERE cartId = ? AND product_model = IPhone55", [usercartId], (err: Error , quantity: any) => {
            expect(quantity).toBe(1);
        });
        expect(response).toBe(true);

        cleanup();
    })
})

describe("T6 - clearCart | DAO", () => {
    let usercartId = 0;
    test("T1.6.1 - only paid cart : It should return a 404 error", async () => {
        db.run(dbq_userPaid1, [], () => {});
        const response = await cartDAO.clearCart(testuser1);
        expect(response).toEqual(new CartNotFoundError());

        cleanup()
    })

    test("T1.6.2 - no errors case (empty cart) : should do nothing", async () => {
        db.run(dbq_userUnpaidEmpty1, [], () => {});
        const response = await cartDAO.clearCart(testuser1);
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 0", [], (err: Error , cart: any) => { usercartId = cart.cart_id });
        db.all("SELECT quantity_in_cart FROM cartItems WHERE cartId = ?", [usercartId], (err: Error , rows: any[]) => {
            expect(rows).toHaveLength(0);
        });
        expect(response).toBe(true);
        
        cleanup();
    })

    test("T1.6.3 - no errors case : should update clear the cart", async () => {
        db.run(dbq_newProduct, [], () => {});
        db.run(dbq_userUnpaidEmpty1, [], () => {});
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 0", [], (err: Error , cart: any) => { usercartId = cart.cart_id });
        db.run(dbq_add2ToCart, [usercartId], () => {});
        const response = await cartDAO.clearCart(testuser1);
        db.all("SELECT quantity_in_cart FROM cartItems WHERE cartId = ?", [usercartId], (err: Error , rows: any[]) => {
            expect(rows).toHaveLength(0);
        });
        expect(response).toBe(true);

        cleanup();
    })

    test("T1.6.4 - no errors case (using DAO) : should update clear the cart", async () => {
        db.run(dbq_newProduct, [], () => {});
        db.run(dbq_userUnpaidEmpty1, [], () => {});
        await cartDAO.addToCart(testuser1, "IPhone55");
        const response = await cartDAO.clearCart(testuser1);
        db.get("SELECT * FROM carts WHERE customer = 'User1' AND paid = 0", [], (err: Error , cart: any) => { usercartId = cart.cart_id });
        db.all("SELECT quantity_in_cart FROM cartItems WHERE cartId = ?", [usercartId], (err: Error , rows: any[]) => {
            expect(rows).toHaveLength(0);
        });
        expect(response).toBe(true);

        cleanup();
    })
})

describe("T7 - deleteAllCarts | DAO", () => {
    test("T1.7.2 - multiple carts : should delete all carts in db", async () => {
        db.run(dbq_userUnpaidEmpty2, [], () => {});
        db.run(dbq_userPaid2, [], () => {});
        db.run(dbq_userPaid1, [], () => {});
        db.run(dbq_userUnpaid1, [], () => {});
        const response = await cartDAO.deleteAllCarts();
        db.all("SELECT * FROM carts", [], (err: Error , carts: any[]) => {  
            expect(carts).toHaveLength(0);
        });
        expect(response).toBe(true);

        cleanup();
    })
})

describe("T8 - getAllCarts | DAO", () => {
    let usercartId = 0;
    test("T1.8.1 - empty db : should return an empty array", async () => {
        const response = await cartDAO.getAllCarts();
        expect(response).toEqual([]);
    })

    test("T1.8.2 - multiple carts : should return an array with all the carts in db", async () => {
        db.run(dbq_userUnpaidEmpty2, [], () => {});
        db.run(dbq_userPaid2, [], () => {});
        db.run(dbq_userPaid1, [], () => {});
        db.run(dbq_userUnpaid1, [], () => {});
        const response = await cartDAO.getAllCarts();
        expect(response).toEqual([userUnpaidEmpty2, userPaid2, userPaid1, userUnpaid1]);

        cleanup();
    })
})