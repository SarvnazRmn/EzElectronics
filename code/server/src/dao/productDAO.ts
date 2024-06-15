import db from "../db/db"
import { Product } from "../components/product"
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError, ProductInvalidDate, ProductInvalidGrouping} from "../errors/productError";

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {
	registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
				const currentD: Date = new Date();
				currentD.setHours(12, 0, 0, 0);
				if (!arrivalDate) {
					arrivalDate = currentD.toISOString().split('T')[0];
				}
				const arrivalD: Date = new Date(arrivalDate);
				if (arrivalD > currentD) {
					reject(new ProductInvalidDate())
					return;
				}
                const sql = "INSERT INTO products(model, category, quantity, details, sellingPrice, arrivalDate) VALUES(?, ?, ?, ?, ?, ?)"
                db.run(sql, [model, category, quantity, details, sellingPrice, arrivalDate], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: product.model")) {
							reject(new ProductAlreadyExistsError())
							return;
						}
                        reject(err)
						return;
                    }
                    else {
						resolve(true);
						return;
					}
                })
            } catch (error) {
                reject(error)
            }
        })
    }


	changeProductQuantity(model: string, newQuantity: number, changeDate: string | null): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            try {
                const sql = "SELECT arrivalDate, quantity FROM products WHERE model = ?"
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
						reject(err)
						return;
                    }
					if (!row) {
						reject(new ProductNotFoundError())
						return;
					}
					const currentD: Date = new Date();
					currentD.setHours(12, 0, 0, 0);
					if (!changeDate) {
						changeDate = currentD.toISOString().split('T')[0];
					}
					const changeD: Date = new Date(changeDate);
					const arrivalD: Date = new Date(row.arrivalDate);
					if (changeD < arrivalD) {
						reject(new ProductInvalidDate())
						return;
					}
					if (changeD > currentD) {
						reject(new ProductInvalidDate())
						return;
					}
                    else {
						const sql = "UPDATE products SET quantity = quantity + ?, arrivalDate = ? WHERE model = ?"
						db.run(sql, [newQuantity, changeDate, model], (err: Error | null) => {
							if (err) {
								reject(err)
								return;
							}
							else {
								resolve(row.quantity + newQuantity);
								return;
							}
						})
					}
                })
            } catch (error) {
                reject(error)
            }
        })
    }
	
	
	sellProduct(model: string, quantity: number, sellingDate: string | null): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "SELECT arrivalDate, quantity FROM products WHERE model = ?"
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
						reject(err)
						return;
                    }
					if (!row) {
						reject(new ProductNotFoundError())
						return;
					}
					if (row.quantity == 0) {
						reject(new EmptyProductStockError())
						return;
					}
					if (row.quantity < quantity) {
						reject(new LowProductStockError())
						return;
					}
					const currentD: Date = new Date();
					currentD.setHours(12, 0, 0, 0);
					if (!sellingDate) {
						sellingDate = currentD.toISOString().split('T')[0];
					}
					const sellingD: Date = new Date(sellingDate);
					const arrivalD: Date = new Date(row.arrivalDate);
					if (sellingD < arrivalD) {
						reject(new ProductInvalidDate())
						return;
					}
					if (sellingD > currentD) {
						reject(new ProductInvalidDate())
						return;
					}
                    else {
						const sql = "UPDATE products SET quantity = quantity - ? WHERE model = ?"
						db.run(sql, [quantity, model], (err: Error | null) => {
							if (err) {
								reject(err)
								return;
							}
							else {
								resolve(true);
								return;
							}
						})
					}
                })
            } catch (error) {
                reject(error)
            }
        })
    }
	
	
	getProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
				let products: Product[] = [];
				if (grouping == "model") {
					if (!model || category) {
						reject(new ProductInvalidGrouping())
						return;
					}
					const sql = "SELECT * FROM products WHERE model = ?"
					db.all(sql, [model], (err: Error | null, rows: any[]) => {
						if (err) {
							reject(err)
							return;
						}
						if (!rows.length) {
							reject(new ProductNotFoundError())
							return;
						}
						else {
							resolve([new Product( rows[0].sellingPrice, rows[0].model, rows[0].category, rows[0].arrivalDate, rows[0].details, rows[0].quantity),]);
							
							return;
						}
					})
				} else if (grouping == "category") {
					if (model || !category) {
							reject(new ProductInvalidGrouping())
							return;
					}
					const sql = "SELECT * FROM products WHERE category = ?"
					db.all(sql, [category], (err: Error | null, rows: any[]) => {
						if (err) {
							reject(err)
							return;
						}
						else {
							rows.forEach(function (row) {
								const product = new Product(
									row.sellingPrice,
									row.model,
									row.category,
									row.arrivalDate,
									row.details,
									row.quantity,
								);
								products.push(product);
							}); 
							resolve(products)
							return;
						}
					})
				} else {
					if (model || category) {
							reject(new ProductInvalidGrouping())
							return;
					}
					const sql = "SELECT * FROM products"
					db.all(sql, [], (err: Error | null, rows: any[]) => {
						if (err) {
							reject(err)
							return;
						}
						else {
							rows.forEach(function (row) {
								const product = new Product(
									row.sellingPrice,
									row.model,
									row.category,
									row.arrivalDate,
									row.details,
									row.quantity,
								);
								products.push(product);
							}); 
							resolve(products)
							return;
						}
					})
				}
            } catch (error) {
                reject(error)
            }
        })
    }
	
	getProductByModel(model: string): Promise<Product | null> {
		return new Promise<Product | null>((resolve, reject) => {
			try {
				const sql = 'SELECT * FROM products WHERE model = ?';
				db.get(sql, [model], (err: Error | null, row: any) => {
					if (err) {
						console.log(err.message);
						return reject(err);
					}
					if (row) {
						let product: Product = new Product(
							row.sellingPrice,
							row.model,
							row.category,
							row.arrivalDate,
							row.details,
							row.quantity,
						);
						return resolve(product);
					}
					if (!row) {
						return resolve(null);
					}
				});
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}
	
	getAvailableProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
				let products: Product[] = [];
				if (grouping == "model") {
					if (!model || category) {
							reject(new ProductInvalidGrouping())
							return;
					}
					const sql = "SELECT * FROM products WHERE model = ? AND quantity > 0"
					db.all(sql, [model], (err: Error | null, rows: any[]) => {
						if (err) {
							reject(err)
							return;
						}
						if (!rows.length) {
							reject(new ProductNotFoundError())
							return;
						}
						else {
							resolve([new Product( rows[0].sellingPrice, rows[0].model, rows[0].category, rows[0].arrivalDate, rows[0].details, rows[0].quantity),]);
							
							return;
						}
					})
				} else if (grouping == "category") {
					if (model || !category) {
							reject(new ProductInvalidGrouping())
							return;
					}
					const sql = "SELECT * FROM products WHERE category = ? AND quantity > 0"
					db.all(sql, [category], (err: Error | null, rows: any[]) => {
						if (err) {
							reject(err)
							return;
						}
						else {
							rows.forEach(function (row) {
								const product = new Product(
									row.sellingPrice,
									row.model,
									row.category,
									row.arrivalDate,
									row.details,
									row.quantity,
								);
								products.push(product);
							}); 
							resolve(products)
							return;
						}
					})
				} else {
					if (model || category) {
							reject(new ProductInvalidGrouping())
							return;
					}
					const sql = "SELECT * FROM products WHERE quantity > 0"
					db.all(sql, [], (err: Error | null, rows: any[]) => {
						if (err) {
							reject(err)
							return;
						}
						else {
							rows.forEach(function (row) {
								const product = new Product(
									row.sellingPrice,
									row.model,
									row.category,
									row.arrivalDate,
									row.details,
									row.quantity,
								);
								products.push(product);
							}); 
							resolve(products)
							return;
						}
					})
				}
            } catch (error) {
                reject(error)
            }
        })
    }
	
	
	deleteProduct(model: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "SELECT model FROM products WHERE model = ?"
                db.get(sql, [model], (err: Error | null, model: any) => {
                    if (err) {
						reject(err)
						return;
                    }
					if (!model) {
						reject(new ProductNotFoundError())
						return;
                    } else {
						const sql = "DELETE FROM reviews WHERE model = ?"
						db.run(sql, [model], (err: Error | null) => {
							if (err) {
								reject(err)
								return;
							}
							else {
								const sql = "DELETE FROM cartItems WHERE product_model = ?"
								db.run(sql, [model], (err: Error | null) => {
									if (err) {
										reject(err)
										return;
									}
									else {
										const sql = "DELETE FROM products WHERE model = ?"
										db.run(sql, [model], (err: Error | null) => {
											if (err) {
												reject(err)
												return;
											}
											else {
												resolve(true);
												return;
											}
										})
									}
								})
							}
						})
					}
                })
            } catch (error) {
                reject(error)
            }
        })
	}
	
	
	deleteAllProducts(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "DELETE FROM reviews"
                db.run(sql, [], (err: Error | null) => {
                    if (err) {
						reject(err)
						return;
                    }
                    else {
						const sql = "DELETE FROM cartItems"
						db.run(sql, [], (err: Error | null) => {
							if (err) {
								reject(err)
								return;
							}
							else {
								const sql = "DELETE FROM products"
								db.run(sql, [], (err: Error | null) => {
									if (err) {
										reject(err)
										return;
									}
									else {
										resolve(true);
										return;
									}
								})
							}
						})
					}
                })
            } catch (error) {
                reject(error)
            }
        })
	}
}

export default ProductDAO
