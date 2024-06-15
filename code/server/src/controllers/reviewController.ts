import { ProductReview } from "../components/review";
import { User } from "../components/user";
import ReviewDAO from "../dao/reviewDAO";
import * as productError from '../errors/productError';
import { Product } from "../components/product";
import ProductDAO from "../dao/productDAO";

class ReviewController {
    private dao: ReviewDAO
    private productDao = new ProductDAO();

    constructor() {
        this.dao = new ReviewDAO
        this.productDao = new ProductDAO();
    }


    /**
     * Adds a new review for a product
     * @param model The model of the product to review
     * @param user The username of the user who made the review
     * @param score The score assigned to the product, in the range [1, 5]
     * @param comment The comment made by the user
     * @returns A Promise that resolves to nothing
     */

    async addReview(model: string, user: User, score: number, comment: string) :Promise<void> {
        let productData: Product = await this.productDao.getProductByModel(model);
		if (productData == null) {
			throw new productError.ProductNotFoundError();
		}
        return await this.dao.addReview(model, user, score, comment)
    }

    /**
     * Returns all reviews for a product
     * @param model The model of the product to get reviews from
     * @returns A Promise that resolves to an array of ProductReview objects
     */
    async getProductReviews(model: string) :Promise<ProductReview[]> {
        let productData: Product = await this.productDao.getProductByModel(model);
		if (productData == null) {
			throw new productError.ProductNotFoundError();
		}
        return this.dao.getProductReviews(model);

     }
    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param user The user who made the review to delete
     * @returns A Promise that resolves to nothing
     */


    async deleteReview(model: string, user: User) :Promise<void> {
        await this.dao.deleteReview(model, user)
     }
    /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */


    async deleteReviewsOfProduct(model: string) :Promise<void> {
        let productData: Product = await this.productDao.getProductByModel(model);
		if (productData == null) {
			throw new productError.ProductNotFoundError();
		}
        return await this.dao.deleteReviewsOfProduct(model)
     }

    /**
     * Deletes all reviews of all products
     * @returns A Promise that resolves to nothing
     */

    async deleteAllReviews():Promise<void> { 
        return await this.dao.deleteAllReviews();
    }

}

export default ReviewController;