const product = require("../models/product");


class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    // Search products by name
    search() {
        const keyword = this.queryStr.keyword
            ? {
                name: {
                    $regex: this.queryStr.keyword,
                    $options: "i"
                }
            }
            : {};

        this.query = this.query.find(keyword);
        return this;
    }

    // Filter products by price, category, ratings, and reviews
    filter() {
        const queryCopy = { ...this.queryStr };

        // Remove fields that are not database filters
        const removeFields = ["keyword", "page", "ratings", "reviews"];
        removeFields.forEach((field) => delete queryCopy[field]);

        const filters = {};

        // PRICE FILTER
        if (queryCopy["price[gte]"] || queryCopy["price[lte]"]) {
            filters.price = {};

            if (queryCopy["price[gte]"]) {
                filters.price.$gte = Number(queryCopy["price[gte]"]);
            }

            if (queryCopy["price[lte]"]) {
                filters.price.$lte = Number(queryCopy["price[lte]"]);
            }
        }

        // CATEGORY FILTER
        if (queryCopy.category) {
            filters.category = queryCopy.category;
        }

        // RATINGS FILTER
        if (queryCopy["ratings[gte]"]) {
            filters.ratings = {
                $gte: Number(queryCopy["ratings[gte]"])
            };
        }

        // REVIEW COUNT FILTER
        if (queryCopy["numOfReviews[gte]"]) {
            filters.numOfReviews = {
                $gte: Number(queryCopy["numOfReviews[gte]"])
            };
        }

        this.query = this.query.find(filters);

        return this;
    }

    // PAGINATION
    pagination(resPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resPerPage * (currentPage - 1);

        this.query = this.query.limit(resPerPage).skip(skip);

        return this;
    }
}

module.exports = APIFeatures