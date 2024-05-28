import db from "../db/db"
import { User } from "../components/user"
import { ProductReview } from "../components/review";
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError"
/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {
    productController: any;

    addReview(review: ProductReview): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "INSERT INTO reviews (model, user, score, date, comment) VALUES (?, ?, ?, ?, ?)";
                db.run(sql, [review.model, review.user, review.score, review.date, review.comment], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: reviews.user, reviews.model")) {
                            reject(new ExistingReviewError());
                        } else if (err.message.includes("NoReviewProductError")) {
                            reject(new NoReviewProductError());
                        } else {
                            reject(err);
                        }
                        return;
                    }
                    resolve(true);
                });
            } catch (error) {
                reject(error);
            }
        });
    }


    getProductReviews(model: string): Promise<ProductReview[]> {
    return new Promise<ProductReview[]>((resolve, reject) => {
        try {
            const sql = "SELECT * FROM reviews WHERE model = ?";
            db.all(sql, [model], (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err);
                    return;
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
    
    
    deleteReview(model: string, user: User) :Promise<void> { 
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "DELETE FROM reviews WHERE model = ? AND user = ?";
                db.run(sql, [model, user.username], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: reviews.user, reviews.model")) {
                            reject(new ExistingReviewError());
                        } else if (err.message.includes("NoReviewProductError")) {
                            reject(new NoReviewProductError());
                        } else {
                            reject(err);
                        }
                        return;
                    }
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }   
 

    deleteReviewsOfProduct(model: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "DELETE FROM reviews WHERE model = ?";
                db.run(sql, [model], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("NoReviewProductError")) {
                            reject(new NoReviewProductError());
                        } else {
                            reject(err);
                        }
                        return;
                    }
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
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