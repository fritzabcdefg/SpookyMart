
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter product name'],
        trim: true,
        maxLength: [100, 'Product name cannot exceed 100 characters']
    },
    // price remains as a backwards-compatible alias for the selling price.
    price: {
        type: Number,
        required: [true, 'Please enter product selling price'],
        min: [0, 'Selling price cannot be negative'],
        default: 0.0
    },
    sellPrice: {
        type: Number,
        min: [0, 'Selling price cannot be negative'],
        default: null
    },
    costPrice: {
        type: Number,
        min: [0, 'Cost price cannot be negative'],
        default: null
    },
    description: {
        type: String,
        required: [true, 'Please enter product description']
    },
    ratings: {
        type: Number,
        default: 0
    },
    images: [
        {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }
    ],
    category: {
        type: String,
        required: [true, 'Please select category for this product'],
    },
    seller: {
        type: String,
        required: [true, 'Please enter product seller']
    },
    stock: {
        type: Number,
        required: [true, 'Please enter product stock'],
        maxLength: [5, 'Product name cannot exceed 5 characters'],
        default: 0
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            // Identifies which purchase this review belongs to.
            // Optional so existing reviews remain valid.
            orderId: {
                type: mongoose.Schema.ObjectId,
                ref: 'Order',
                required: false
            },
            name: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true
            },
            comment: {
                type: String,
                required: true
            }
        }
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Keep legacy product.price and the explicit sellPrice field synchronized.
productSchema.pre('validate', function (next) {
    if (this.sellPrice !== null && this.sellPrice !== undefined) {
        this.price = this.sellPrice;
    } else if (this.price !== null && this.price !== undefined) {
        this.sellPrice = this.price;
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
