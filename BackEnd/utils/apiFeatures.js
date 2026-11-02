class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    search() {
        const keyword = this.queryStr.keyword
            ? {
                name: {
                    $regex: this.queryStr.keyword,
                    $options: 'i'
                }
            }
            : {};

        this.query = this.query.find(keyword);
        return this;
    }

    filter() {
        const queryCopy = { ...this.queryStr };

        const removeFields = [
            'keyword',
            'page',
            'ratings',
            'reviews'
        ];

        removeFields.forEach(field => delete queryCopy[field]);

        const filters = {};

        if (queryCopy['price[gte]'] || queryCopy['price[lte]']) {
            filters.price = {};

            if (queryCopy['price[gte]']) {
                filters.price.$gte = Number(queryCopy['price[gte]']);
            }

            if (queryCopy['price[lte]']) {
                filters.price.$lte = Number(queryCopy['price[lte]']);
            }
        }

        if (queryCopy.category) {
            filters.category = queryCopy.category;
        }

        if (queryCopy['ratings[gte]']) {
            filters.ratings = {
                $gte: Number(queryCopy['ratings[gte]'])
            };
        }

        if (queryCopy['numOfReviews[gte]']) {
            filters.numOfReviews = {
                $gte: Number(queryCopy['numOfReviews[gte]'])
            };
        }

        this.query = this.query.find(filters);
        return this;
    }

    pagination(resPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resPerPage * (currentPage - 1);

        this.query = this.query.limit(resPerPage).skip(skip);
        return this;
    }
}

module.exports = APIFeatures;
