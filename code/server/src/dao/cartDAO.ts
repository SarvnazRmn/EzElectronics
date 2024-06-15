import db from "../db/db";
import { Cart, ProductInCart } from "../components/cart";
import { User } from "../components/user";
import { Product } from "../components/product";
import {
  CartNotFoundError,
  ProductInCartError,
  ProductNotInCartError,
  WrongUserCartError,
  EmptyCartError,
} from "../errors/cartError";
import {
  ProductNotFoundError,
  ProductAlreadyExistsError,
  ProductSoldError,
  EmptyProductStockError,
  LowProductStockError,
} from "../errors/productError";

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {
  /**
   * Adds a product to the user's cart. If the product is already in the cart, the quantity should be increased by 1.
   * If the product is not in the cart, it should be added with a quantity of 1.
   * If there is no current unpaid cart in the database, then a new cart should be created.
   * @param user - The user to whom the product should be added.
   * @param product - The model of the product to add.
   * @returns A Promise that resolves to `true` if the product was successfully added.
   */
  addToCart(user: User, product: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        let cartId: number;

        // Check if the user is a customer
        if (user.role !== "Customer") {
          reject(new WrongUserCartError());
          return;
        } else {
          // Find the product by product
          const productQuery = "SELECT * FROM products WHERE model = ?";
          db.get(
            productQuery,
            [product],
            (err: Error | null, productEl: Product) => {
              if (err) {
                reject(err);
                return;
              }

              // Check if the product exists
              else if (!productEl) {
                reject(new ProductNotFoundError());
                return;
              }

              // Check if the product quantity is greater than 0
              else if (productEl.quantity <= 0) {
                reject(new EmptyProductStockError());
                return;
              } else {
                // Find the current unpaid cart for the user
                const cartQuery =
                  "SELECT * FROM carts WHERE customer = ? AND paid = 0";
                db.get(
                  cartQuery,
                  [user.username],
                  (err: Error | null, row: any) => {
                    if (err) {
                      reject(err);
                      return;
                    }

                    // If there is no current cart, create a new one
                    if (!row) {
                      // Insert a new cart with the automatically generated cartId
                      const insertCartQuery =
                        "INSERT INTO carts (customer, paid, paymentDate, total) VALUES (?, 0, NULL, ?)";
                      db.run(
                        insertCartQuery,
                        [user.username, productEl.sellingPrice],
                        (err: Error | null) => {
                          if (err) {
                            reject(err);
                            return;
                          }

                          // Find the current unpaid cart for the user after the cartId was generated
                          const cartQuery =
                            "SELECT * FROM carts WHERE customer = ? AND paid = 0";
                          db.get(
                            cartQuery,
                            [user.username],
                            (err: Error | null, row: any) => {
                              if (err) {
                                reject(err);
                                return;
                              }

                              // Insert the cart item for the product
                              const insertCartItemQuery =
                                "INSERT INTO cartItems (cart_id, product_model, quantity_in_cart) VALUES (?, ?, 1)";
                              db.run(
                                insertCartItemQuery,
                                [row.id, product],
                                (err: Error | null) => {
                                  if (err) {
                                    reject(err);
                                    return;
                                  }
                                  resolve(true);
                                  return;
                                }
                              );
                            }
                          );
                        }
                      );
                    } else {
                      cartId = row.id;

                      // Update the total price in the database (carts table)
                      const updateTotalCartQuery =
                        "UPDATE carts SET total = total + ? WHERE id = ?";
                      db.run(
                        updateTotalCartQuery,
                        [productEl.sellingPrice, cartId],
                        (err: Error | null) => {
                          if (err) {
                            reject(err);
                            return;
                          }
                        }
                      );

                      // Check if the product exists in the cartItems table
                      const cartItemQuery =
                        "SELECT * FROM cartItems WHERE cart_id = ? AND product_model = ?";
                      db.get(
                        cartItemQuery,
                        [cartId, product],
                        (err: Error | null, row: any) => {
                          if (err) {
                            reject(err);
                            return;
                          }

                          // If the product doesn't exist, add it to the cart in the database (cartItems table)
                          if (!row) {
                            const insertCartItemQuery =
                              "INSERT INTO cartItems (cart_id, product_model, quantity_in_cart) VALUES (?, ?, 1)";
                            db.run(
                              insertCartItemQuery,
                              [cartId, product],
                              (err: Error | null) => {
                                if (err) {
                                  reject(err);
                                  return;
                                }
                              }
                            );
                          } else {
                            // If the product does exist, update the quantity of the product in the database (cartItems table)
                            const updateQuantityQuery =
                              "UPDATE cartItems SET quantity_in_cart = quantity_in_cart + 1 WHERE cart_id = ? AND product_model = ?";
                            db.run(
                              updateQuantityQuery,
                              [cartId, product],
                              (err: Error | null) => {
                                if (err) {
                                  reject(err);
                                  return;
                                }
                              }
                            );
                          }
                        }
                      );
                    }
                  }
                );
              }
            }
          );
        }
        resolve(true);
        return;
      } catch (error) {
        reject(error);
        return;
      }
    });
  }

  /**
   * Retrieves the current cart for a specific user.
   * @param user - The user for whom to retrieve the cart.
   * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
   */
  getCart(user: User): Promise<Cart> {
    return new Promise<Cart>((resolve, reject) => {
      try {
        let cartId: number;

        // Check if the user is a customer
        if (user.role !== "Customer") {
          reject(new WrongUserCartError());
          return;
        }

        // Find the current unpaid cart for the user
        const cartQuery = "SELECT * FROM carts WHERE customer = ? AND paid = 0";
        db.get(cartQuery, [user.username], (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }

          // If there is no current cart, create a new empty one
          if (!row) {
            const cart = new Cart(user.username, false, "", 0, []);
            resolve(cart);
            return;
          }
          // If there is a cart, return all the cart information
          else {
            const cart = new Cart(
              row.customer,
              row.paid,
              row.paymentDate,
              row.total,
              []
            );

            cartId = row.id;

            // Select all the products in the current cart (cartItems table)
            const getCartItemsQuery =
              "SELECT  ci.quantity_in_cart, p.model, p.category, p.sellingPrice FROM cartItems ci, products p WHERE ci.product_model=p.model AND ci.cart_id=?";
            db.all(
              getCartItemsQuery,
              [cartId],
              (err: Error | null, rows: any[]) => {
                if (err) {
                  reject(err);
                  return;
                } else {
                  cart.products = rows.map(
                    (row) =>
                      new ProductInCart(
                        row.model,
                        row.quantity_in_cart,
                        row.category,
                        row.sellingPrice
                      )
                  );
                }
                resolve(cart);
                return;
              }
            );
          }
        });
      } catch (error) {
        reject(error);
        return;
      }
    });
  }

  /**
   * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
   * @param user - The user whose cart should be checked out.
   * @returns A Promise that resolves to `true` if the cart was successfully checked out.
   *
   */
  checkoutCart(user: User): Promise<Boolean> {
  return new Promise<boolean>((resolve, reject) => {
    try {
      // Check if the user is a customer
      if (user.role !== "Customer") {
        reject(new WrongUserCartError());
        return;
      } 

      // Find the current unpaid cart for the user
      const cartQuery = "SELECT * FROM carts WHERE customer = ? AND paid = 0";
      db.get(cartQuery, [user.username], (err: Error | null, row: any) => {
        if (err) {
          reject(err);
          return;
        }

        // If there is no current cart, return error
        if (!row) {
          reject(new CartNotFoundError());
          return;
        }

        // If the cart is empty, return error
        if (row.total === 0) {
          reject(new EmptyCartError());
          return;
        }

        const cartId = row.id;

        // Check availability of all the products in the cart
        const cartItemQuery = "SELECT p.model, ci.quantity_in_cart, p.quantity FROM cartItems ci, products p WHERE ci.cart_id = ? AND p.model = ci.product_model";
        db.all(cartItemQuery, [cartId], async (err: Error | null, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }

          for (const row of rows) {
            if (row.quantity < row.quantity_in_cart || row.quantity === 0) {
              reject(new EmptyProductStockError());
              return;
            }
          }

          // Update the total state of the cart in the database (carts table)
          const updateTotalCartQuery = "UPDATE carts SET paid = 1, paymentDate = CURRENT_DATE WHERE id = ?";
          db.run(updateTotalCartQuery, [cartId], async (err: Error | null) => {
            if (err) {
              reject(err);
              return;
            }

            try {
              await Promise.all(rows.map(row => new Promise<void>((resolve, reject) => {
                const updateProductAmountQuery = "UPDATE products SET quantity = quantity - ? WHERE model = ?";
                db.run(updateProductAmountQuery, [row.quantity_in_cart, row.model], (err: Error | null) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  resolve();
                });
              })));

              resolve(true);
            } catch (error) {
              reject(error);
            }
          });
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

  /**
   * Retrieves all paid carts for a specific customer.
   * @param user - The customer for whom to retrieve the carts.
   * @returns A Promise that resolves to an array of carts belonging to the customer.
   * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
   */
  getCustomerCarts(user: User): Promise<Cart[]> {
    return new Promise<Cart[]>((resolve, reject) => {
      try {
        let carts: Cart[] = [];
  
        // Check if the user is a customer
        if (user.role !== "Customer") {
          reject(new WrongUserCartError());
          return;
        }
  
        // Find all the paid carts for the user
        const cartQuery = "SELECT * FROM carts WHERE customer = ? AND paid = 1";
        db.all(cartQuery, [user.username], (err: Error | null, cartRows: any[]) => {
          if (err) {
            reject(err);
            return;
          }
  
          // If there are no paid carts, return empty array
          if (!cartRows || cartRows.length === 0) {
            resolve(carts);
            return;
          }
  
          // Create an array of promises to fetch products for each cart
          const cartPromises = cartRows.map(cartRow => {
            return new Promise<Cart>((resolve, reject) => {
              const cart = new Cart(
                cartRow.customer,
                cartRow.paid,
                cartRow.paymentDate,
                cartRow.total,
                []
              );
  
              const cartId = cartRow.id;
  
              // Select all the products in the current cart (cartItems table)
              const getCartItemsQuery =
                "SELECT ci.quantity_in_cart, p.model, p.category, p.sellingPrice FROM cartItems ci, products p WHERE ci.product_model = p.model AND ci.cart_id = ?";
              db.all(getCartItemsQuery, [cartId], (err: Error | null, productRows: any[]) => {
                if (err) {
                  reject(err);
                  return;
                }
  
                cart.products = productRows.map(productRow =>
                  new ProductInCart(
                    productRow.model,
                    productRow.quantity_in_cart,
                    productRow.category,
                    productRow.sellingPrice
                  )
                );
  
                resolve(cart);
              });
            });
          });
  
          // Wait for all cart product fetching promises to complete
          Promise.all(cartPromises)
            .then(fetchedCarts => {
              carts = fetchedCarts;
              resolve(carts);
            })
            .catch(err => {
              reject(err);
            });
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  

  /**
   * Removes one product unit from the current cart. In case there is more than one unit in the cart, only one should be removed.
   * @param user The user who owns the cart.
   * @param product The model of the product to remove.
   * @returns A Promise that resolves to `true` if the product was successfully removed.
   */
  removeProductFromCart(user: User, product: string): Promise<Boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        let cartId: number;

        // Check if the user is a customer
        if (user.role !== "Customer") {
          reject(new WrongUserCartError());
          return;
        } else {
          // Find the product by product model (passed as argument)
          const productQuery = "SELECT * FROM products WHERE model = ?";
          db.get(
            productQuery,
            [product],
            (err: Error | null, productEl: Product) => {
              if (err) {
                reject(err);
                return;
              }

              // Check if the product exists
              else if (!productEl) {
                reject(new ProductNotFoundError());
                return;
              } else {
                // Find the current unpaid cart for the user
                const cartQuery =
                  "SELECT * FROM carts WHERE customer = ? AND paid = 0";
                db.get(
                  cartQuery,
                  [user.username],
                  (err: Error | null, row: any) => {
                    if (err) {
                      reject(err);
                      return;
                    }

                    // If there is no current cart, return an error
                    if (!row) {
                      reject(new CartNotFoundError());
                      return;
                    } else {
                      cartId = row.id;

                      // Check if the product exists in the cartItems table
                      const cartItemQuery =
                        "SELECT * FROM cartItems WHERE cart_id = ? AND product_model = ?";
                      db.get(
                        cartItemQuery,
                        [cartId, product],
                        (err: Error | null, row: any) => {
                          if (err) {
                            reject(err);
                            return;
                          }

                          // If the product doesn't exist, return an error
                          if (!row) {
                            reject(new ProductNotInCartError());
                            return;
                          } else {
                            // Update the total price in the database (carts table)
                            const updateTotalCartQuery =
                              "UPDATE carts SET total = total - ? WHERE id = ?";
                            db.run(
                              updateTotalCartQuery,
                              [productEl.sellingPrice, cartId],
                              (err: Error | null) => {
                                if (err) {
                                  reject(err);
                                  return;
                                }

                                // Update the quantity of the product in the database (cartItems table)
                                const updateQuantityQuery =
                                  "UPDATE cartItems SET quantity_in_cart = quantity_in_cart - 1 WHERE cart_id = ? AND product_model = ?";
                                db.run(
                                  updateQuantityQuery,
                                  [cartId, product],
                                  (err: Error | null) => {
                                    if (err) {
                                      reject(err);
                                      return;
                                    }

                                    // Remove the product from the database if the quantity is zero in the cartItems table
                                    const cartItemQuery =
                                      "DELETE FROM cartItems WHERE quantity_in_cart = 0";
                                    db.run(
                                      cartItemQuery,
                                      [],
                                      (err: Error | null, row: any) => {
                                        if (err) {
                                          reject(err);
                                          return;
                                        }
                                      }
                                    );
                                  }
                                );
                              }
                            );
                          }
                        }
                      );
                    }
                  }
                );
              }
            }
          );
          resolve(true);
          return;
        }
      } catch (error) {
        reject(error);
        return;
      }
    });
  }

  /**
   * Removes all products from the current cart.
   * @param user - The user who owns the cart.
   * @returns A Promise that resolves to `true` if the cart was successfully cleared.
   */
  async clearCart(user: User): Promise<Boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        let cartId: number;

        // Check if the user is a customer
        if (user.role !== "Customer") {
          reject(new WrongUserCartError());
          return;
        } else {
          // Find the current unpaid cart for the user
          const cartQuery =
            "SELECT * FROM carts WHERE customer = ? AND paid = 0";
          db.get(cartQuery, [user.username], (err: Error | null, row: any) => {
            if (err) {
              reject(err);
              return;
            }

            // If there is no current cart, return an error
            if (!row) {
              reject(new CartNotFoundError());
              return;
            } else {
              cartId = row.id;

              // Update the total price in the database to zero (carts table)
              const updateTotalCartQuery =
                "UPDATE carts SET total = 0 WHERE id = ?";
              db.run(updateTotalCartQuery, [cartId], (err: Error | null) => {
                if (err) {
                  reject(err);
                  return;
                }

                // Update the quantity of the product in the database (cartItems table)
                const updateQuantityQuery =
                  "DELETE FROM cartItems WHERE cart_id = ?";
                db.run(updateQuantityQuery, [cartId], (err: Error | null) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                });
              });
            }
          });
        }
        resolve(true);
        return;
      } catch (error) {
        reject(error);
        return;
      }
    });
  }

  /**
   * Deletes all carts of all users.
   * @returns A Promise that resolves to `true` if all carts were successfully deleted.
   */
  async deleteAllCarts(): Promise<Boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const sql = "DELETE FROM carts";
        db.run(sql, (err: Error | null) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(true);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Retrieves all carts in the database.
   * @returns A Promise that resolves to an array of Cart objects representing all carts in the database.
   */
  async getAllCarts(): Promise<Cart[]> {
    return new Promise<Cart[]>((resolve, reject) => {
      try {
        let carts: Cart[] = [];
  
        // Find all the paid carts for the user
        const cartQuery = "SELECT * FROM carts";
        db.all(cartQuery, [], (err: Error | null, cartRows: any[]) => {
          if (err) {
            reject(err);
            return;
          }
  
          // If there are no paid carts, return empty array
          if (!cartRows || cartRows.length === 0) {
            resolve(carts);
            return;
          }
  
          // Create an array of promises to fetch products for each cart
          const cartPromises = cartRows.map(cartRow => {
            return new Promise<Cart>((resolve, reject) => {
              const cart = new Cart(
                cartRow.customer,
                cartRow.paid,
                cartRow.paymentDate,
                cartRow.total,
                []
              );
  
              const cartId = cartRow.id;
  
              // Select all the products in the current cart (cartItems table)
              const getCartItemsQuery =
                "SELECT ci.quantity_in_cart, p.model, p.category, p.sellingPrice FROM cartItems ci, products p WHERE ci.product_model = p.model AND ci.cart_id = ?";
              db.all(getCartItemsQuery, [cartId], (err: Error | null, productRows: any[]) => {
                if (err) {
                  reject(err);
                  return;
                }
  
                cart.products = productRows.map(productRow =>
                  new ProductInCart(
                    productRow.model,
                    productRow.quantity_in_cart,
                    productRow.category,
                    productRow.sellingPrice
                  )
                );
  
                resolve(cart);
              });
            });
          });
  
          // Wait for all cart product fetching promises to complete
          Promise.all(cartPromises)
            .then(fetchedCarts => {
              carts = fetchedCarts;
              resolve(carts);
            })
            .catch(err => {
              reject(err);
            });
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default CartDAO;
