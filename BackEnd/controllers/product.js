const Product = require('../models/product')
const Order = require('../models/order')
const cloudinary = require('cloudinary')
const APIFeatures = require('../utils/apiFeatures');

const badWords = require('bad-words');

const Filter = badWords.Filter || badWords.default || badWords;
const profanityFilter = new Filter();

exports.newProduct = async (req, res, next) => {
    try {
        let images = req.body.images || [];

        if (typeof images === 'string') {
            images = [images];
        }

        if (!Array.isArray(images)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product images'
            });
        }

        if (images.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'You can upload a maximum of 10 images'
            });
        }

        const imagesLinks = [];

        for (const image of images) {
            if (typeof image !== 'string' || !image.startsWith('data:image/')) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid image format'
                });
            }

            const result = await cloudinary.v2.uploader.upload(image, {
                folder: 'products',
                width: 150,
                crop: 'scale'
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url
            });
        }

        req.body.images = imagesLinks;

        const product = await Product.create(req.body);

        return res.status(201).json({
            success: true,
            product
        });

    } catch (error) {
        console.error('Create product error:', error);

        return res.status(500).json({
            success: false,
            message: error.message || 'Product creation failed'
        });
    }
}

exports.getSingleProduct = async (req, res, next) => {
    const product = await Product.findOne({
        _id: req.params.id,
        isDeleted: { $ne: true }
    });

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    return res.status(200).json({
        success: true,
        product
    });
}

exports.getProducts = async (req, res, next) => {
    const resPerPage = 4;

    const activeProducts = {
        isDeleted: { $ne: true }
    };

    const productsCount = await Product.countDocuments(activeProducts);

    const apiFeatures = new APIFeatures(
        Product.find(activeProducts),
        req.query
    ).search().filter();

    const filteredQuery = apiFeatures.query.clone();
    const filteredProductsCount = await filteredQuery.countDocuments();

    apiFeatures.pagination(resPerPage);

    const products = await apiFeatures.query;

    return res.status(200).json({
        success: true,
        products,
        filteredProductsCount,
        resPerPage,
        productsCount
    });
}

exports.updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        let removeImageIds = [];

        if (req.body.removeImages) {
            removeImageIds = JSON.parse(req.body.removeImages);
        }

        if (!Array.isArray(removeImageIds)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid image removal data'
            });
        }

        // Only remove images explicitly selected by the user.
        const removedIds = removeImageIds.filter(id =>
            product.images.some(img => img.public_id === id)
        );

        let remainingImages = product.images.filter(
            img => !removedIds.includes(img.public_id)
        );

        // Get newly added images.
        let newImages = [];

        if (req.body.images) {
            newImages = Array.isArray(req.body.images)
                ? req.body.images
                : [req.body.images];
        }

        if (remainingImages.length + newImages.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'A product can have a maximum of 10 images'
            });
        }

        const uploadedImages = [];

        for (const image of newImages) {
            if (
                typeof image !== 'string' ||
                !image.startsWith('data:image/')
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid image format'
                });
            }

            const result = await cloudinary.v2.uploader.upload(image, {
                folder: 'products',
                width: 150,
                crop: 'scale'
            });

            uploadedImages.push({
                public_id: result.public_id,
                url: result.secure_url
            });
        }

        const updatedImages = [
            ...remainingImages,
            ...uploadedImages
        ];

        const updateData = { ...req.body };

        delete updateData.images;
        delete updateData.removeImages;

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
                ...updateData,
                images: updatedImages
            },
            {
                new: true,
                runValidators: true
            }
        );

        // Delete removed Cloudinary images after the database update succeeds.
        for (const publicId of removedIds) {
            try {
                await cloudinary.v2.uploader.destroy(publicId);
            } catch (error) {
                console.error('Cloudinary image deletion failed:', publicId);
            }
        }

        return res.status(200).json({
            success: true,
            product: updatedProduct
        });

    } catch (error) {
        console.error('Update product error:', error);

        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update product'
        });
    }
}

exports.deleteProduct = async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    if (product.isDeleted === true) {
        return res.status(400).json({
            success: false,
            message: 'Product is already deleted'
        });
    }

    product.isDeleted = true;
    await product.save();

    return res.status(200).json({
        success: true,
        message: 'Product moved to deleted products'
    });
}

exports.bulkDeleteProducts = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please select at least one product'
            });
        }

        const validIds = [...new Set(ids.map(String))];

        if (validIds.some(id => !/^[0-9a-fA-F]{24}$/.test(id))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        const result = await Product.updateMany(
            {
                _id: { $in: validIds },
                isDeleted: { $ne: true }
            },
            {
                $set: { isDeleted: true }
            }
        );

        return res.status(200).json({
            success: true,
            message: `${result.modifiedCount} product(s) moved to Deleted Products`,
            deletedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Bulk delete error:', error);

        return res.status(500).json({
            success: false,
            message: 'Bulk deletion failed'
        });
    }
}

exports.restoreProduct = async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    if (product.isDeleted !== true) {
        return res.status(400).json({
            success: false,
            message: 'Product is not deleted'
        });
    }

    product.isDeleted = false;
    await product.save();

    return res.status(200).json({
        success: true,
        message: 'Product restored successfully',
        product
    });
}

exports.getAdminProducts = async (req, res, next) => {
    const showDeleted = req.query.deleted === 'true';

    const filter = showDeleted
        ? { isDeleted: true }
        : { isDeleted: { $ne: true } };

    const products = await Product.find(filter);

    return res.status(200).json({
        success: true,
        products
    });
}


exports.createProductReview = async (req, res, next) => {
    try {
        const { rating, comment, productId, orderId } = req.body;

        if (!productId || !comment?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a rating and comment'
            });
        }

        if (orderId && !/^[0-9a-fA-F]{24}$/.test(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID'
            });
        }

        const numericRating = Number(rating);

        if (!Number.isInteger(numericRating) ||
            numericRating < 1 ||
            numericRating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const product = await Product.findOne({
            _id: productId,
            isDeleted: { $ne: true }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // If an order ID is provided, verify that exact order.
        // Otherwise, preserve the old eligibility check.
        const orderFilter = {
            user: req.user._id,
            orderStatus: 'Delivered',
            isReceived: true,
            'orderItems.product': product._id
        };

        if (orderId) {
            orderFilter._id = orderId;
        }

        const eligibleOrder = await Order.exists(orderFilter);

        if (!eligibleOrder) {
            return res.status(403).json({
                success: false,
                message: 'You can review this product only after confirming receipt of the order containing it'
            });
        }

        // A customer can review the same product again in another order.
        // Within the same order, only one review is allowed.
        const existingReview = product.reviews.find(review => {
            const sameUser =
                review.user.toString() === req.user._id.toString();

            if (!sameUser) return false;

            // Keep the old behavior for requests without an order ID.
            if (!orderId) return true;

            return review.orderId &&
                review.orderId.toString() === orderId.toString();
        });

        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: 'You have already reviewed this product for this order. You can edit your review.'
            });
        }

        // Filter inappropriate words before saving the review.
        const filteredComment = profanityFilter.clean(comment.trim());

        const newReview = {
            user: req.user._id,
            name: req.user.name,
            rating: numericRating,
            comment: filteredComment
        }

        if (orderId) {
            newReview.orderId = orderId;
        }

        product.reviews.push(newReview);

        product.numOfReviews = product.reviews.length;
        product.ratings = product.reviews.reduce(
            (sum, review) => sum + review.rating,
            0
        ) / product.reviews.length;

        await product.save();

        return res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            reviews: product.reviews,
            ratings: product.ratings,
            numOfReviews: product.numOfReviews
        });

    } catch (error) {
        console.error('Create product review error:', error);

        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to submit review'
        });
    }
};


exports.updateProductReview = async (req, res, next) => {
    try {
        const { rating, comment, productId, orderId } = req.body;

        if (!productId || !comment?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a rating and comment'
            });
        }

        if (orderId && !/^[0-9a-fA-F]{24}$/.test(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID'
            });
        }

        const numericRating = Number(rating);

        if (!Number.isInteger(numericRating) ||
            numericRating < 1 ||
            numericRating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const product = await Product.findOne({
            _id: productId,
            isDeleted: { $ne: true }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const orderFilter = {
            user: req.user._id,
            orderStatus: 'Delivered',
            isReceived: true,
            'orderItems.product': product._id
        };

        if (orderId) {
            orderFilter._id = orderId;
        }

        const eligibleOrder = await Order.exists(orderFilter);

        if (!eligibleOrder) {
            return res.status(403).json({
                success: false,
                message: 'You can update this review only after confirming receipt of the order containing this product'
            });
        }

        // Find the review belonging to this customer and this order.
        const existingReview = product.reviews.find(review => {
            const sameUser =
                review.user.toString() === req.user._id.toString();

            if (!sameUser) return false;

            // Preserve compatibility for requests without an order ID.
            if (!orderId) return true;

            return review.orderId &&
                review.orderId.toString() === orderId.toString();
        });

        if (!existingReview) {
            return res.status(404).json({
                success: false,
                message: 'You have not reviewed this product for this order yet'
            });
        }

        // Filter inappropriate words when a customer edits a review.
        existingReview.rating = numericRating;
        existingReview.comment = profanityFilter.clean(comment.trim());

        product.numOfReviews = product.reviews.length;
        product.ratings = product.reviews.reduce(
            (sum, review) => sum + review.rating,
            0
        ) / product.reviews.length;

        await product.save();

        return res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            reviews: product.reviews,
            ratings: product.ratings,
            numOfReviews: product.numOfReviews
        });

    } catch (error) {
        console.error('Update product review error:', error);

        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to update review'
        });
    }
};


// Public endpoint: everyone can read reviews.
exports.getProductReviews = async (req, res, next) => {
    try {
        const product = await Product.findOne({
            _id: req.query.id,
            isDeleted: { $ne: true }
        }).select('reviews ratings numOfReviews');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        return res.status(200).json({
            success: true,
            reviews: product.reviews,
            ratings: product.ratings,
            numOfReviews: product.numOfReviews
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to get reviews'
        });
    }
};


// Authenticated endpoint: returns the customer's review.
// With orderId: returns only the review for that specific order.
// Without orderId: preserves the existing product-page behavior.
exports.getMyProductReview = async (req, res, next) => {
    try {
        const { orderId } = req.query;

        if (orderId && !/^[0-9a-fA-F]{24}$/.test(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID'
            });
        }

        const product = await Product.findOne({
            _id: req.params.productId,
            isDeleted: { $ne: true }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const orderFilter = {
            user: req.user._id,
            orderStatus: 'Delivered',
            isReceived: true,
            'orderItems.product': product._id
        };

        if (orderId) {
            orderFilter._id = orderId;
        }

        const eligibleOrder = await Order.exists(orderFilter);

        // Find this customer's review.
        let review = null;

        for (let i = product.reviews.length - 1; i >= 0; i--) {
            const item = product.reviews[i];

            const sameUser =
                item.user.toString() === req.user._id.toString();

            const sameOrder = !orderId || (
                item.orderId &&
                item.orderId.toString() === orderId.toString()
            );

            if (sameUser && sameOrder) {
                review = item;
                break;
            }
        }

        return res.status(200).json({
            success: true,
            eligible: Boolean(eligibleOrder),
            review: review || null
        });

    } catch (error) {
        console.error('Get my product review error:', error);

        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to get your review'
        });
    }
};


exports.deleteReview = async (req, res, next) => {
    try {
        const { id, productId } = req.query;

        // Validate required IDs
        if (
            !productId ||
            !id ||
            !/^[0-9a-fA-F]{24}$/.test(productId) ||
            !/^[0-9a-fA-F]{24}$/.test(id)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID or review ID'
            });
        }

        // Find the product containing the review
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Find the exact review
        const reviewIndex = product.reviews.findIndex(
            review => review._id.toString() === id
        );

        if (reviewIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Delete only the selected review
        product.reviews.splice(reviewIndex, 1);

        // Recalculate review count and average rating
        product.numOfReviews = product.reviews.length;

        product.ratings = product.reviews.length > 0
            ? product.reviews.reduce(
                (total, review) => total + review.rating,
                0
            ) / product.reviews.length
            : 0;

        await product.save();

        return res.status(200).json({
            success: true,
            message: 'Review deleted successfully',
            numOfReviews: product.numOfReviews,
            ratings: product.ratings
        });

    } catch (error) {
        console.error('Delete review error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to delete review'
        });
    }
}

exports.productSales = async (req, res, next) => {
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: "$itemsPrice" }

            },

        },
    ])
    //console.log(totalSales)
    const sales = await Order.aggregate([
        { $project: { _id: 0, orderItems: 1 } },
        { $unwind: "$orderItems" },

        {
            $group: {
                _id: { product: "$orderItems.name" },
                total: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
            },
        },
    ])
    //console.log(sales)

    if (!totalSales) {
        return res.status(404).json({
            message: 'error sales'
        })

    }
    if (!sales) {
        return res.status(404).json({
            message: 'error sales'
        })

    }

    let totalPercentage = {}
    totalPercentage = sales.map(item => {

        // //console.log( ((item.total/totalSales[0].total) * 100).toFixed(2))
        percent = Number(((item.total / totalSales[0].total) * 100).toFixed(2))
        total = {
            name: item._id.product,
            percent
        }
        return total
    })
    //console.log(totalPercentage)
    res.status(200).json({
        success: true,
        totalPercentage,
        sales,
        totalSales
    })

}

