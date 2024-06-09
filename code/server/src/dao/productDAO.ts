import db from "../db/db"
import { Product } from "../components/product"
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError } from "../errors/productError";

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {
	registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "INSERT INTO products(model, category, quantity, details, sellingPrice, arrivalDate) VALUES(?, ?, ?, ?, ?, ?)"
                db.get(sql, [model, category, quantity, details, sellingPrice, arrivalDate], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: product.model")) reject(new ProductAlreadyExistsError())
                        reject(err)
                    }
                    else resolve(true);
                })
            } catch (error) {
                reject(error)
            }
        })
    }


	changeProductQuantity(model: string, newQuantity: number, changeDate: string | null): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            try {
                const sql = "SELECT quantity FROM products WHERE model = ?"
                db.get(sql, [model], (err: Error | null, stock: any) => {
                    if (err) {
						reject(err)
                    }
					if (!stock) {
						reject(new ProductNotFoundError())
					}
                    else {
						const sql = "UPDATE products SET quantity = ? WHERE model = ?"
						db.get(sql, [newQuantity, model], (err: Error | null) => {
							if (err) {
								reject(err)
							}
							else resolve(stock + newQuantity);
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
                const sql = "SELECT quantity FROM products WHERE model = ?"
                db.get(sql, [model], (err: Error | null, stock: any) => {
                    if (err) {
						reject(err)
                    }
					if (!stock) {
						reject(new ProductNotFoundError())
					}
					if (stock == 0) {
						reject(new EmptyProductStockError())
					}
					if (stock < quantity) {
						reject(new LowProductStockError())
					}
                    else {
						const sql = "UPDATE products SET quantity = quantity - ? WHERE model = ?"
						db.get(sql, [quantity, model], (err: Error | null) => {
							if (err) {
								reject(err)
							}
							else resolve(true);
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
					const sql = "SELECT * FROM products WHERE model = ?"
					db.get(sql, [model], (err: Error | null, row: any) => {
						if (err) {
							reject(err)
						}
						if (!row) {
							reject(new ProductNotFoundError())
						}
						else resolve(products)
					})
				} else if (grouping == "category") {
					const sql = "SELECT * FROM products WHERE category = ?"
					db.get(sql, [category], (err: Error | null, rows: any[]) => {
						if (err) {
							reject(err)
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
						}
					})
				} else {
					const sql = "SELECT * FROM products"
					db.get(sql, [], (err: Error | null, rows: any[]) => {
						if (err) {
							reject(err)
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
						}
					})
				}
            } catch (error) {
                reject(error)
            }
        })
    }
	
	
	getAvailableProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
				let products: Product[] = [];
				if (grouping == "model") {
					const sql = "SELECT * FROM products WHERE model = ? AND quantity > 0"
					db.get(sql, [model], (err: Error | null, row: any) => {
						if (err) {
							reject(err)
						}
						if (!row) {
							reject(new ProductNotFoundError())
						}
						else resolve(products)
					})
				} else if (grouping == "category") {
					const sql = "SELECT * FROM products WHERE category = ? AND quantity > 0"
					db.get(sql, [category], (err: Error | null, rows: any[]) => {
						if (err) {
							reject(err)
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
						}
					})
				} else {
					const sql = "SELECT * FROM products WHERE quantity > 0"
					db.get(sql, [], (err: Error | null, rows: any[]) => {
						if (err) {
							reject(err)
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
                    }
					if (!model) {
						reject(new ProductNotFoundError())
                    } else {
						const sql = "DELETE FROM products WHERE model = ?"
						db.get(sql, [model], (err: Error | null) => {
							if (err) {
								reject(err)
							}
							else resolve(true);
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
                const sql = "DELETE FROM products"
                db.get(sql, [], (err: Error | null) => {
                    if (err) {
						reject(err)
                    }
                    else resolve(true);
                })
            } catch (error) {
                reject(error)
            }
        })
	}
}

export default ProductDAO
