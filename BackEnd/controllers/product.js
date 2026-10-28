const Product = require('../models/product')
const Order = require('../models/order')
const cloudinary = require('cloudinary')
const APIFeatures = require('../utils/apiFeatures');

exports.newProduct = async (req, res, next) => {
    console.log(req.files)
    let images = []
    // if (typeof req.files === 'string') {
    //     images.push(req.files)
    // } else {
    //     images = req.files
    // }

    if (typeof req.body.images === 'string') {
        images.push(req.body.images)
    } else {
        images = req.body.images
    }

    let imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
        try {
            // const result = await cloudinary.v2.uploader.upload(images[i].path, {
            const result = await cloudinary.v2.uploader.upload(images[i], {

                folder: 'products',
                width: 150,
                crop: "scale",
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url
            })

        } catch (error) {
            console.log(error)
        }

    }

    req.body.images = imagesLinks
    // req.body.user = req.user.id;

    const product = await Product.create(req.body);

    if (!product)
        return res.status(400).json({
            success: false,
            message: 'Product not created'
        })


    return res.status(201).json({
        success: true,
        product
    })
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
};

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
};

exports.updateProduct = async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Only upload and replace images when new images are provided.
        if (req.body.images !== undefined) {
            let images = [];

            if (typeof req.body.images === 'string') {
                images.push(req.body.images);
            } else if (Array.isArray(req.body.images)) {
                images = req.body.images;
            }

            // Do not erase existing images if the submitted array is empty.
            if (images.length > 0) {
                const imagesLinks = [];

                for (let i = 0; i < images.length; i++) {
                    const result = await cloudinary.v2.uploader.upload(
                        images[i],
                        {
                            folder: 'products',
                            width: 150,
                            crop: 'scale'
                        }
                    );

                    imagesLinks.push({
                        public_id: result.public_id,
                        url: result.secure_url
                    });
                }

                req.body.images = imagesLinks;
            } else {
                delete req.body.images;
            }
        }

        product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        return res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Update product error:', error);

        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update product'
        });
    }
};


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
};

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
};

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
};


exports.createProductReview = async (req, res, next) => {
    try {
        const { rating, comment, productId } = req.body;

        if (!productId || !comment?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a rating and comment'
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

        // Only customers who confirmed receipt of an order
        // containing this product can review it.
        const hasReceivedProduct = await Order.exists({
            user: req.user._id,
            orderStatus: 'Delivered',
            isReceived: true,
            'orderItems.product': product._id
        });

        if (!hasReceivedProduct) {
            return res.status(403).json({
                success: false,
                message: 'You can review this product after confirming receipt of an order containing it'
            });
        }

        const existingReview = product.reviews.find(
            review => review.user.toString() === req.user._id.toString()
        );

        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: 'You have already reviewed this product. Update your review from your Orders page.'
            });
        }

        product.reviews.push({
            user: req.user._id,
            name: req.user.name,
            rating: numericRating,
            comment: comment.trim()
        });

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
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to submit review'
        });
    }
};

exports.updateProductReview = async (req, res, next) => {
    try {
        const { rating, comment, productId } = req.body;

        if (!productId || !comment?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a rating and comment'
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

        const hasReceivedProduct = await Order.exists({
            user: req.user._id,
            orderStatus: 'Delivered',
            isReceived: true,
            'orderItems.product': product._id
        });

        if (!hasReceivedProduct) {
            return res.status(403).json({
                success: false,
                message: 'You can update this review only after confirming receipt of the product'
            });
        }

        const existingReview = product.reviews.find(
            review => review.user.toString() === req.user._id.toString()
        );

        if (!existingReview) {
            return res.status(404).json({
                success: false,
                message: 'You have not reviewed this product yet'
            });
        }

        existingReview.rating = numericRating;
        existingReview.comment = comment.trim();

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

// Authenticated endpoint: returns the current customer's review.
exports.getMyProductReview = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const hasReceivedProduct = await Order.exists({
            user: req.user._id,
            orderStatus: 'Delivered',
            isReceived: true,
            'orderItems.product': product._id
        });

        const review = product.reviews.find(
            item => item.user.toString() === req.user._id.toString()
        );

        return res.status(200).json({
            success: true,
            eligible: Boolean(hasReceivedProduct),
            review: review || null
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to get your review'
        });
    }
}


exports.deleteReview = async (req, res, next) => {
    console.log(req.query)
    const product = await Product.findById(req.query.productId);
    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());
    const numOfReviews = reviews.length;

    const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,    
        ratings,
        numOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    return res.status(200).json({
        success: true
    })
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
    console.log(totalSales)
    const sales = await Order.aggregate([
        { $project: { _id: 0, "orderItems": 1, totalPrice: true } },
        { $unwind: "$orderItems" },

        {
            $group: {
                _id: { product: "$orderItems.name" },
                total: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
            },
        },
    ])
    console.log(sales)

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

        // console.log( ((item.total/totalSales[0].total) * 100).toFixed(2))
        percent = Number(((item.total / totalSales[0].total) * 100).toFixed(2))
        total = {
            name: item._id.product,
            percent
        }
        return total
    })
    console.log(totalPercentage)
    res.status(200).json({
        success: true,
        totalPercentage,
        sales,
        totalSales
    })

}