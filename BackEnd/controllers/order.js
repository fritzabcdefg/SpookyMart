const Order = require('../models/order');
const Product = require('../models/product');
const Customer = require('../models/customer');

// Create a new order   =>  /api/v1/order/new

// Create a new order => /api/v1/order/new
exports.newOrder = async (req, res, next) => {
    try {
        const {
            orderItems,
            shippingInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentInfo
        } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Your cart is empty.'
            });
        }

        if (!shippingInfo) {
            return res.status(400).json({
                success: false,
                message: 'Shipping information is required.'
            });
        }

        // Find the customer's separate profile, if one exists.
        const customer = await Customer.findOne({
            user: req.user._id
        });

        // Existing checkout requests without a method are treated as Card
        // to preserve compatibility with the previous checkout frontend.
        const method = paymentInfo?.method || 'Card';

        if (!['COD', 'Card'].includes(method)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method.'
            });
        }

        // Card checkout is simulated in this project.
        // COD orders are not marked as paid at order creation.
        const isCardPaid =
            method === 'Card' &&
            paymentInfo?.status === 'succeeded';

        const order = await Order.create({
            orderItems,
            shippingInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,

            paymentInfo: {
                id: method === 'Card' ? (paymentInfo?.id || '') : '',
                status: isCardPaid ? 'succeeded' : 'pending',
                method,
                brand: method === 'Card' ? (paymentInfo?.brand || '') : '',
                last4: method === 'Card' ? (paymentInfo?.last4 || '') : ''
            },

            paidAt: isCardPaid ? Date.now() : null,

            user: req.user._id,
            customer: customer ? customer._id : null
        });

        return res.status(201).json({
            success: true,
            order
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


exports.myOrders = async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id })
    // console.log(req.user)
    res.status(200).json({
        success: true,
        orders
    })
}

exports.getSingleOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email')
    if (!order) {
        res.status(404).json({
            message: 'No Order found with this ID',

        })
    }
    res.status(200).json({
        success: true,
        order
    })
}

exports.allOrders = async (req, res, next) => {
    const orders = await Order.find();

    let totalAmount = 0;

    orders.forEach(order => {
        totalAmount +=
            Number(order.itemsPrice || 0) +
            Number(order.taxPrice || 0) +
            Number(order.shippingPrice || 0);
    });

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    });
}


exports.updateOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.orderStatus === 'Delivered') {
            return res.status(400).json({
                success: false,
                message: 'This order has already been delivered'
            });
        }

        const allowedStatuses = [
            'Processing',
            'Shipped',
            'Delivered'
        ];

        const status = req.body.status;

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order status'
            });
        }

        if (status === 'Delivered') {
            for (const item of order.orderItems) {
                await updateStock(item.product, item.quantity);
            }

            order.deliveredAt = Date.now();
        }

        order.orderStatus = status;
        await order.save();

        return res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to update order'
        });
    }
}


exports.confirmOrderReceived = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Customers may confirm only their own orders.
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only confirm receipt of your own order'
            });
        }

        if (order.orderStatus !== 'Delivered') {
            return res.status(400).json({
                success: false,
                message: 'You can confirm receipt only after delivery'
            });
        }

        if (order.isReceived) {
            return res.status(400).json({
                success: false,
                message: 'You have already confirmed receipt'
            });
        }

        order.isReceived = true;
        order.receivedAt = Date.now();

        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Order marked as completed',
            order
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to confirm receipt'
        });
    }
}


async function updateStock(id, quantity) {
    const product = await Product.findById(id);

    product.stock = product.stock - quantity;

    await product.save({ validateBeforeSave: false })
}

exports.totalOrders = async (req, res, next) => {
    const totalOrders = await Order.aggregate([
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ])
    if (!totalOrders) {
        return res.status(404).json({
            message: 'error total orders',
        })
    }
    res.status(200).json({
        success: true,
        totalOrders
    })

}

exports.totalSales = async (req, res, next) => {
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalSales: {
                    $sum: {
                        $add: [
                            { $ifNull: ['$itemsPrice', 0] },
                            { $ifNull: ['$taxPrice', 0] },
                            { $ifNull: ['$shippingPrice', 0] }
                        ]
                    }
                }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        totalSales
    });
}

exports.customerSales = async (req, res, next) => {
    const customerSales = await Order.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        {
            $unwind: '$userDetails'
        },
        {
            $group: {
                _id: '$user',
                total: {
                    $sum: {
                        $add: [
                            { $ifNull: ['$itemsPrice', 0] },
                            { $ifNull: ['$taxPrice', 0] },
                            { $ifNull: ['$shippingPrice', 0] }
                        ]
                    }
                },
                doc: { $first: '$$ROOT' }
            }
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        { total: '$total' },
                        '$doc'
                    ]
                }
            }
        },
        {
            $project: {
                _id: 0,
                'userDetails.name': true,
                total: true
            }
        },
        {
            $sort: {
                total: 1
            }
        }
    ]);

    res.status(200).json({
        success: true,
        customerSales
    });
}

exports.salesPerMonth = async (req, res, next) => {
    const salesPerMonth = await Order.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: '$paidAt' },
                    month: { $month: '$paidAt' }
                },
                total: {
                    $sum: {
                        $add: [
                            { $ifNull: ['$itemsPrice', 0] },
                            { $ifNull: ['$taxPrice', 0] },
                            { $ifNull: ['$shippingPrice', 0] }
                        ]
                    }
                }
            }
        },
        {
            $addFields: {
                month: {
                    $let: {
                        vars: {
                            monthsInString: [
                                '',
                                'Jan',
                                'Feb',
                                'Mar',
                                'Apr',
                                'May',
                                'Jun',
                                'Jul',
                                'Aug',
                                'Sep',
                                'Oct',
                                'Nov',
                                'Dec'
                            ]
                        },
                        in: {
                            $arrayElemAt: [
                                '$$monthsInString',
                                '$_id.month'
                            ]
                        }
                    }
                }
            }
        },
        {
            $sort: {
                '_id.year': 1,
                '_id.month': 1
            }
        },
        {
            $project: {
                _id: 0,
                month: true,
                total: true
            }
        }
    ]);

    res.status(200).json({
        success: true,
        salesPerMonth
    });
}