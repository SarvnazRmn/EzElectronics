import { User } from "../components/user";
import { ProductReview } from "../components/review";
import ReviewDAO from "../dao/reviewDAO";
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError"
import ProductController from "../controllers/productController"

class ReviewController {
    private dao: ReviewDAO
    private productController: ProductController;
    constructor() {
        this.dao = new ReviewDAO;
        this.productController = new ProductController(); 
    }

    /**
     * Adds a new review for a product
     * @param model The model of the product to review
     * @param user The username of the user who made the review
     * @param score The score assigned to the product, in the range [1, 5]
     * @param comment The comment made by the user
     * @returns A Promise that resolves to nothing
     */

    async addReview(model: string, user: User, score: number, comment: string): Promise<void> {
        const product = await this.dao.productController.getProducts("model", null, model);
        if (product===null) {
            throw new NoReviewProductError();
        }

        const reviews = await this.dao.getProductReviews(model);
        const existingReview = reviews.find(review => review.user === user.username);
        if (existingReview) {
            throw new ExistingReviewError();
        }
        const review: ProductReview = new ProductReview(model, user.username, score, new Date().toISOString(), comment);
        await this.dao.addReview(review);
    }
    /**
     * Returns all reviews for a product
     * @param model The model of the product to get reviews from
     * @returns A Promise that resolves to an array of ProductReview objects
     */


    async getProductReviews(model: string) : Promise<ProductReview[]>  {
        return await this.dao.getProductReviews(model);
    
    }
    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param user The user who made the review to delete
     * @returns A Promise that resolves to nothing
     */


    async deleteReview(model: string, user: User) :Promise<void> { 
            const product = await this.productController.getProducts("model", null, model);
            if (product===null) {
                throw new NoReviewProductError();
            }
            const reviews = await this.dao.getProductReviews(model);
            const existingReview = reviews.find(review => review.user === user.username);
        if (!existingReview) {
            throw new NoReviewProductError();
        }

        await this.dao.deleteReview(model, user);
    }
    /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */


    async deleteReviewsOfProduct(model: string):Promise<void> {
        const product = await this.dao.productController.getProducts("model", null, model);
        if (product===null) {
            throw new NoReviewProductError();
        }

        await this.dao.deleteReviewsOfProduct(model);
    }
    /**
     * Deletes all reviews of all products
     * @returns A Promise that resolves to nothing
     */

    async deleteAllReviews():Promise<void> { 
            await this.dao.deleteAllReviews();
    }

}

export default ReviewController;