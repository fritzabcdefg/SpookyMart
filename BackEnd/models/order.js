
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    shippingInfo: {
        recipientName: {
            type: String,
            default: ''
        },
        label: {
            type: String,
            default: 'Shipping address'
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        phoneNo: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        }
    },

    // Keep the User reference for existing login and order-history features.
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },

    // Optional link to the separate Customer collection.
    // Existing orders do not need this field.
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },

    orderItems: [
        {
            name: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            image: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product'
            }
        }
    ],

    paymentInfo: {
        id: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            default: 'pending'
        },
        method: {
            type: String,
            enum: ['COD', 'Card'],
            default: 'Card'
        },
        brand: {
            type: String,
            default: ''
        },
        last4: {
            type: String,
            default: ''
        }
    },

    paidAt: {
        type: Date,
        default: null
    },

    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0
    },

    taxPrice: {
        type: Number,
        required: true,
        default: 0.0
    },

    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },

    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },

    orderStatus: {
        type: String,
        required: true,
        default: 'Processing'
    },

    deliveredAt: {
        type: Date
    },

    cancelledAt: {
        type: Date,
        default: null
    },

    cancelledBy: {
        type: String,
        enum: ['admin', 'customer'],
        default: null
    },

    isReceived: {
        type: Boolean,
        default: false
    },

    receivedAt: {
        type: Date
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);
