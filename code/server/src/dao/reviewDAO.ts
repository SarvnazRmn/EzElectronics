import db from "../db/db"
import dayjs from "dayjs"
import { User } from "../components/user"
import { ProductReview } from "../components/review";
import { ProductNotFoundError } from "../errors/productError";
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError"
/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {
    /**
  * Adds a new review for a product
  * @param model The model of the product to review
  * @param user The username of the user who made the review
  * @param score The score assigned to the product, in the range [1, 5]
  * @param comment The comment made by the user
  * @returns A Promise that resolves to nothing
  */

    
    addReview(model: string, user: User, score: number, comment: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const checkReviewSql = "SELECT COUNT(*) as count FROM reviews WHERE model = ? AND user = ?";
            
            db.get(checkReviewSql, [model, user.username], (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (row.count > 0) {
                    reject(new ExistingReviewError());
                    return;
                }
    
                const now = dayjs().format('YYYY-MM-DD');
                const insertSql = "INSERT INTO reviews (model, user, score, comment, date) VALUES (?, ?, ?, ?, ?)";
                
                db.run(insertSql, [model, user.username, score, comment, now], (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    resolve();
                });
            });
        });
    }
    

    getProductReviews(model: string): Promise<ProductReview[]> {
        return new Promise<ProductReview[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM reviews WHERE model = ?";
                db.all(sql, [model], (err: Error, rows: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!rows || rows.length === 0) {
                        resolve([]);
                    }
                    const reviews: ProductReview[] = rows.map(row => new ProductReview(
                        row.model,
                        row.user,
                        row.score,
                        row.date,
                        row.comment
                    ));
                    resolve(reviews);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
            
    deleteReview(model: string, user: User): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const checkProductSql = "SELECT * FROM reviews WHERE model = ?";
            db.get(checkProductSql, [model], (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!row) {
                    reject(new ProductNotFoundError());
                    return;
                }

                const checkReviewSql = "SELECT * FROM reviews WHERE model = ? AND user = ?";
                db.get(checkReviewSql, [model, user.username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!row) {
                        reject(new NoReviewProductError());
                        return;
                    }

                    const deleteSql = "DELETE FROM reviews WHERE model = ? AND user = ?";
                    db.run(deleteSql, [model, user.username], (err: Error | null) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                });
            });
        });
    }

 
    deleteReviewsOfProduct(model: string): Promise<void> {

        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "DELETE FROM reviews WHERE model = ?";
                db.run(sql, [model], (err: Error | null) => {
                    if (err) {
                        reject(err)
                        return
                      }
                      resolve()
                    })
                  } 
            catch (error) {
                reject(error)
            }   
        })
    }

    deleteAllReviews(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "DELETE FROM reviews";
                db.run(sql, (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default ReviewDAO;