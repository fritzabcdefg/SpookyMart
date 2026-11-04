
const Order = require('../models/order');
const Product = require('../models/product');
const Customer = require('../models/customer');
const sendEmail = require('../utils/sendEmail');
const generateReceiptPDF = require('../utils/generateReceiptPDF');
const jwt = require('jsonwebtoken');

// ============================================
// CREATE A NEW ORDER
// POST /api/v1/order/new
// ============================================
exports.newOrder = async (req, res, next) => {
    try {
        const {
            orderItems,
            shippingInfo,
            paymentInfo
        } = req.body;

        // Validate cart.
        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Your cart is empty.'
            });
        }

        // Validate shipping information.
        if (!shippingInfo) {
            return res.status(400).json({
                success: false,
                message: 'Shipping information is required.'
            });
        }

        // Rebuild checkout prices from the database; never trust browser totals.
        const requestedItems = orderItems.map(item => ({
            productId: item.product || item._id,
            quantity: Number(item.quantity)
        }));

        if (requestedItems.some(item =>
            !item.productId ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1
        )) {
            return res.status(400).json({
                success: false,
                message: 'Your cart contains an invalid product or quantity.'
            });
        }

        const productIds = requestedItems.map(item => item.productId);
        const products = await Product.find({
            _id: { $in: productIds },
            isDeleted: { $ne: true }
        });

        if (products.length !== new Set(productIds.map(String)).size) {
            return res.status(400).json({
                success: false,
                message: 'One or more products are no longer available.'
            });
        }

        const productById = new Map(products.map(product => [
            product._id.toString(),
            product
        ]));

        const trustedOrderItems = requestedItems.map(item => {
            const product = productById.get(String(item.productId));
            const sellPrice = Number(product.sellPrice);
            const costPrice = Number(product.costPrice);

            if (!Number.isFinite(sellPrice) || sellPrice < 0 ||
                product.costPrice === null || product.costPrice === undefined ||
                !Number.isFinite(costPrice) || costPrice < 0) {
                throw new Error(`Please add a valid cost and selling price for ${product.name} before checkout.`);
            }

            return {
                name: product.name,
                quantity: item.quantity,
                image: product.images?.[0]?.url || '',
                product: product._id,
                price: sellPrice,
                sellPrice,
                costPrice
            };
        });

        const itemsPrice = Number(trustedOrderItems.reduce(
            (sum, item) => sum + item.sellPrice * item.quantity, 0
        ).toFixed(2));
        const taxPrice = 0;
        const shippingPrice = 0;
        const totalPrice = itemsPrice;

        // Find the customer's separate profile, if one exists.
        const customer = await Customer.findOne({
            user: req.user._id
        });

        // Existing checkout requests without a method are treated as Card.
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

        // Reserve stock only after checkout validation.
        const reservedStock = await reserveStock(trustedOrderItems);

        // Create the order.
        let order;

        try {
            order = await Order.create({
                orderItems: trustedOrderItems,
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

        } catch (orderError) {
            // Restore stock if order creation fails.
            await restoreStock(reservedStock);
            throw orderError;
        }

        // Send order confirmation email after checkout.
        // Email failure must not undo a successfully created order.
        try {
            const customerEmail = req.user.email;
            const customerName = req.user.name || 'Valued Customer';

            if (customerEmail) {
                const formatPrice = amount =>
                    `₱${Number(amount || 0).toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`;

                const emailSubtotal = Number(order.itemsPrice || 0);
                const emailTax = Number(order.taxPrice || 0);
                const emailShipping = Number(order.shippingPrice || 0);

                const emailGrandTotal =
                    Number(order.totalPrice || 0) > 0
                        ? Number(order.totalPrice)
                        : emailSubtotal + emailTax + emailShipping;

                const receiptPDF = await generateReceiptPDF(order);

                const productRows = order.orderItems.map(item => `
                    <tr>
                        <td style="padding:12px;border-bottom:1px solid #eee;">
                            ${item.name}
                        </td>
                        <td style="padding:12px;text-align:center;border-bottom:1px solid #eee;">
                            ${item.quantity}
                        </td>
                        <td style="padding:12px;text-align:right;border-bottom:1px solid #eee;">
                            ${formatPrice(item.price * item.quantity)}
                        </td>
                    </tr>
                `).join('');

                const receiptToken = jwt.sign(
                    {
                        orderId: order._id.toString(),
                        purpose: 'receipt'
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: '7d'
                    }
                );

                const emailHTML = `
                <div style="background:#f4f1f8;padding:30px;font-family:Arial,sans-serif;">
                    <div style="max-width:600px;margin:auto;background:white;border-radius:12px;overflow:hidden;">

                        <div style="background:#24133f;padding:30px;color:white;">
                            <h1 style="margin:0;">SPOOKY<span style="color:#f28c28;">MART</span></h1>
                            <p style="color:#ddd;">ORDER CONFIRMATION</p>
                        </div>

                        <div style="padding:30px;color:#292333;">
                            <h2>Thank you for your order, ${customerName}!</h2>
                            <p>We've successfully received your order. Here are your transaction details.</p>

                            <p><strong>Order ID:</strong> ${order._id}</p>
                            <p><strong>Order Status:</strong> ${order.orderStatus}</p>

                            <h3>Order Summary</h3>

                            <table width="100%" cellspacing="0" cellpadding="0"
                                style="border-collapse:collapse;font-size:13px;">
                                <thead>
                                    <tr style="background:#24133f;color:white;">
                                        <th align="left" style="padding:12px;">Product</th>
                                        <th style="padding:12px;">Qty</th>
                                        <th align="right" style="padding:12px;">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>${productRows}</tbody>
                            </table>

                            <div style="margin-top:20px;text-align:right;">
                                <p>Subtotal: ${formatPrice(emailSubtotal)}</p>
                                                <p>Shipping: ${formatPrice(emailShipping)}</p>

                                <h2 style="color:#f28c28;">
                                    Grand Total: ${formatPrice(emailGrandTotal)}
                                </h2>
                            </div>

                            <div style="text-align:center;margin:30px 0;">
                                <a
                                    href="${process.env.BACKEND_URL}/api/v1/order/${order._id}/receipt/${receiptToken}"
                                    style="display:inline-block;background:#f28c28;color:#ffffff;padding:15px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;"
                                >
                                    Download PDF Receipt
                                </a>
                            </div>

                            <div style="background:#f7f4fa;padding:18px;border-radius:8px;margin-top:20px;">
                                <strong>Your PDF receipt is attached!</strong>
                                <p style="font-size:13px;">Keep the attached receipt for your records.</p>
                            </div>
                        </div>

                        <div style="background:#24133f;padding:22px;text-align:center;color:white;">
                            Thank you for shopping with SpookyMart!
                        </div>

                    </div>
                </div>`;

                await sendEmail({
                    email: customerEmail,
                    subject: 'SpookyMart | Your Order Confirmation',
                    html: emailHTML,
                    attachments: [{
                        filename: `SpookyMart-Receipt-${order._id}.pdf`,
                        content: receiptPDF,
                        contentType: 'application/pdf'
                    }]
                });

                console.log('Checkout confirmation email sent to:', customerEmail);

            } else {
                console.log('Checkout email skipped: customer email not found.');
            }

        } catch (emailError) {
            console.error('Checkout confirmation email failed:', emailError);
        }

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


// ============================================
// GET LOGGED-IN USER ORDERS
// ============================================
exports.myOrders = async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id });

    res.status(200).json({
        success: true,
        orders
    });
};


// ============================================
// GET SINGLE ORDER
// ============================================
exports.getSingleOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name email');

    if (!order) {
        return res.status(404).json({
            message: 'No Order found with this ID'
        });
    }

    return res.status(200).json({
        success: true,
        order
    });
};


// ============================================
// GET ALL ORDERS (ADMIN)
// ============================================
exports.allOrders = async (req, res, next) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        const activeOrders = orders.filter(order => order.orderStatus !== 'Cancelled');

        // Dashboard Total Sales is product margin only:
        // (selling price - cost price) x quantity. Shipping and tax are excluded.
        const totalAmount = activeOrders.reduce(
            (total, order) => total + (order.orderItems || []).reduce(
                (orderTotal, item) => {
                    const sellPrice = Number(item.sellPrice ?? item.price);
                    const costPrice = Number(item.costPrice);
                    const quantity = Number(item.quantity || 0);

                    // Do not guess costs for legacy order items without a cost snapshot.
                    if (
                        item.costPrice === null ||
                        item.costPrice === undefined ||
                        !Number.isFinite(sellPrice) ||
                        !Number.isFinite(costPrice) ||
                        !Number.isFinite(quantity)
                    ) return orderTotal;

                    return orderTotal + (sellPrice - costPrice) * quantity;
                },
                0
            ),
            0
        );

        return res.status(200).json({
            success: true,
            orders,
            totalAmount
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to retrieve orders'
        });
    }
};


// ============================================
// CANCEL ORDER (CUSTOMER)
// POST /api/v1/order/:id/cancel
// ============================================
exports.cancelMyOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to cancel this order'
            });
        }

        if (order.orderStatus !== 'Processing') {
            return res.status(400).json({
                success: false,
                message: 'Only processing orders can be cancelled'
            });
        }

        await restoreStock(order.orderItems.map(item => ({
            productId: item.product,
            quantity: item.quantity
        })));

        order.orderStatus = 'Cancelled';
        order.paymentInfo.status = 'cancelled';
        order.cancelledAt = Date.now();
        order.cancelledBy = 'customer';
        await order.save();

        // Email confirmation is best-effort; the cancellation remains saved if email fails.
        if (order.user?.email) {
            try {
                const safeName = String(order.user.name || 'Customer')
                    .replace(/[&<>"']/g, character => ({
                        '&': '&amp;', '<': '&lt;', '>': '&gt;',
                        '"': '&quot;', "'": '&#39;'
                    })[character]);

                const safeOrderId = String(order._id);
                const productRows = order.orderItems.map(item => {
                    const safeProduct = String(item.name || 'Product')
                        .replace(/[&<>"']/g, character => ({
                            '&': '&amp;', '<': '&lt;', '>': '&gt;',
                            '"': '&quot;', "'": '&#39;'
                        })[character]);
                    return `<tr>
                        <td style="padding:10px;border-bottom:1px solid #eee;">${safeProduct}</td>
                        <td style="padding:10px;text-align:center;border-bottom:1px solid #eee;">${Number(item.quantity || 0)}</td>
                    </tr>`;
                }).join('');

                const html = `<div style="background:#f4f1f8;padding:30px;font-family:Arial,sans-serif;color:#292333;">
                    <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
                        <div style="background:#24133f;padding:25px;color:#fff;">
                            <h1 style="margin:0;">SPOOKY<span style="color:#f28c28;">MART</span></h1>
                            <p style="margin-bottom:0;">ORDER CANCELLATION CONFIRMATION</p>
                        </div>
                        <div style="padding:30px;">
                            <h2>Hello ${safeName},</h2>
                            <p>Your order has been successfully cancelled as requested.</p>
                            <p><strong>Order ID:</strong> ${safeOrderId}</p>
                            <p><strong>Status:</strong> <span style="color:#dc2626;font-weight:bold;">CANCELLED</span></p>
                            <h3>Cancelled items</h3>
                            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                                <thead><tr style="background:#24133f;color:#fff;">
                                    <th align="left" style="padding:10px;">Product</th>
                                    <th style="padding:10px;">Quantity</th>
                                </tr></thead>
                                <tbody>${productRows}</tbody>
                            </table>
                            <p style="margin-top:24px;">If you did not request this cancellation, please contact our support team.</p>
                        </div>
                        <div style="background:#24133f;padding:20px;text-align:center;color:#fff;">Thank you for choosing SpookyMart.</div>
                    </div>
                </div>`;

                await sendEmail({
                    email: order.user.email,
                    subject: `SpookyMart | Order ${safeOrderId} Cancelled`,
                    html
                });
            } catch (emailError) {
                console.error('Order cancellation email failed:', emailError);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Your order has been cancelled successfully.',
            order
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to cancel order'
        });
    }
};


// ============================================
// UPDATE ORDER STATUS (ADMIN)
// ============================================
exports.updateOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email');

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
            'Delivered',
            'Cancelled'
        ];

        const status = req.body.status;

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order status'
            });
        }

        const previousStatus = order.orderStatus;

        // Cancellation is only permitted before the order is shipped.
        if (status === 'Cancelled' && previousStatus !== 'Processing') {
            return res.status(400).json({
                success: false,
                message: 'Only processing orders can be cancelled'
            });
        }

        // Restore stock once when a Processing order is cancelled by admin.
        if (status === 'Cancelled' && previousStatus === 'Processing') {
            await restoreStock(order.orderItems.map(item => ({
                productId: item.product,
                quantity: item.quantity
            })));
            order.paymentInfo.status = 'cancelled';
            order.cancelledAt = Date.now();
            order.cancelledBy = 'admin';
        }

        // Delivery only updates the delivery date.
        if (status === 'Delivered') {
            order.deliveredAt = Date.now();
        }

        order.orderStatus = status;
        await order.save();

        // Send an email only when the order status changes.
        if (previousStatus !== status && order.user?.email) {
            try {
                const formatPrice = amount =>
                    `₱${Number(amount || 0).toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`;

                const escapeHTML = value =>
                    String(value ?? '').replace(/[&<>"']/g, character => ({
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;',
                        '"': '&quot;',
                        "'": '&#39;'
                    })[character]);

                const productRows = order.orderItems.map(item => {
                    const quantity = Number(item.quantity || 0);
                    const price = Number(item.price || 0);

                    return `
                        <tr>
                            <td style="padding:14px 10px;border-bottom:1px solid #eee;color:#292333;">
                                ${escapeHTML(item.name)}
                            </td>
                            <td style="padding:14px 10px;border-bottom:1px solid #eee;text-align:center;color:#555;">
                                ${quantity}
                            </td>
                            <td style="padding:14px 10px;border-bottom:1px solid #eee;text-align:right;color:#555;">
                                ${formatPrice(price)}
                            </td>
                            <td style="padding:14px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;color:#292333;">
                                ${formatPrice(quantity * price)}
                            </td>
                        </tr>
                    `;
                }).join('');

                const customerName = escapeHTML(
                    order.user.name || 'Valued Customer'
                );

                const statusColors = {
                    Processing: '#B7791F',
                    Shipped: '#2563EB',
                    Delivered: '#15803D',
                    Cancelled: '#DC2626'
                };

                const statusColor = statusColors[status] || '#6B21A8';

                const emailHTML = `
                <!DOCTYPE html>
                <html>
                <body style="margin:0;padding:0;background:#f4f1f8;font-family:Arial,Helvetica,sans-serif;color:#292333;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1f8;padding:30px 12px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

                                    <tr>
                                        <td style="background:#24133f;padding:30px 35px;">
                                            <div style="font-size:25px;font-weight:800;letter-spacing:2px;color:#ffffff;">
                                                SPOOKY<span style="color:#f28c28;">MART</span>
                                            </div>
                                            <div style="font-size:11px;letter-spacing:2px;color:#d8cde8;margin-top:7px;">
                                                YOUR SPOOKY SHOPPING DESTINATION
                                            </div>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding:35px 35px 20px;">
                                            <div style="font-size:12px;font-weight:bold;letter-spacing:1.5px;color:#f28c28;">
                                                ORDER UPDATE
                                            </div>

                                            <h1 style="font-size:25px;color:#24133f;margin:12px 0;">
                                                Your order has been updated!
                                            </h1>

                                            <p style="font-size:14px;line-height:1.7;color:#625b6b;margin:0;">
                                                Hello ${customerName}, your SpookyMart order has a new status.
                                                Here are your updated transaction details.
                                            </p>

                                            <div style="margin-top:22px;padding:17px;background:#f7f4fa;border-radius:9px;">
                                                <div style="font-size:11px;color:#777;margin-bottom:7px;">
                                                    CURRENT ORDER STATUS
                                                </div>
                                                <span style="display:inline-block;padding:8px 14px;border-radius:20px;background:${statusColor};color:#ffffff;font-size:12px;font-weight:bold;">
                                                    ${escapeHTML(status.toUpperCase())}
                                                </span>
                                                <div style="font-size:12px;color:#777;margin-top:12px;">
                                                    Order ID: <strong style="color:#24133f;">${escapeHTML(order._id)}</strong>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding:10px 35px 25px;">
                                            <h2 style="font-size:17px;color:#24133f;margin-bottom:15px;">
                                                Your transaction summary
                                            </h2>

                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:12px;">
                                                <thead>
                                                    <tr style="background:#24133f;color:#ffffff;">
                                                        <th align="left" style="padding:12px 10px;">Product / Service</th>
                                                        <th align="center" style="padding:12px 5px;">Qty</th>
                                                        <th align="right" style="padding:12px 5px;">Price</th>
                                                        <th align="right" style="padding:12px 10px;">Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${productRows}
                                                </tbody>
                                            </table>

                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;font-size:13px;">
                                                <tr>
                                                    <td style="padding:6px 0;color:#777;">Subtotal</td>
                                                    <td align="right" style="padding:6px 0;color:#292333;">${formatPrice(order.itemsPrice)}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:6px 0;color:#777;">Tax</td>
                                                    <td align="right" style="padding:6px 0;color:#292333;">${formatPrice(order.taxPrice)}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:6px 0;color:#777;">Shipping</td>
                                                    <td align="right" style="padding:6px 0;color:#292333;">${formatPrice(order.shippingPrice)}</td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding-top:12px;border-top:2px solid #f28c28;"></td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0;font-size:16px;font-weight:bold;color:#24133f;">GRAND TOTAL</td>
                                                    <td align="right" style="padding:8px 0;font-size:19px;font-weight:bold;color:#f28c28;">${formatPrice(order.totalPrice)}</td>
                                                </tr>
                                            </table>

                                            <div style="margin-top:22px;padding:17px;border:1px solid #eee;border-radius:9px;background:#fff;">
                                                <div style="font-weight:bold;color:#24133f;font-size:13px;">
                                                    Your receipt is attached!
                                                </div>
                                                <p style="font-size:12px;line-height:1.6;color:#777;margin:7px 0 0;">
                                                    We've included a PDF receipt with your order details.
                                                    You can download it, save it, or print it for your records.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="background:#24133f;padding:25px 35px;text-align:center;">
                                            <div style="font-size:15px;font-weight:bold;color:#ffffff;">
                                                Thank you for shopping with SpookyMart!
                                            </div>
                                            <div style="font-size:11px;color:#c9bdd9;margin-top:9px;">
                                                Keep your receipt safe. We appreciate your order.
                                            </div>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>`;

                // Generate the PDF receipt.
                const receiptPDF = await generateReceiptPDF(order);

                // Send the email with the PDF attached.
                await sendEmail({
                    email: order.user.email,
                    subject: `SpookyMart | Order ${status} - Receipt Attached`,
                    html: emailHTML,
                    attachments: [
                        {
                            filename: `SpookyMart-Receipt-${order._id}.pdf`,
                            content: receiptPDF,
                            contentType: 'application/pdf'
                        }
                    ]
                });

                console.log(`Order update email sent to ${order.user.email}`);

            } catch (emailError) {
                // Do not undo a successfully saved order update if email fails.
                console.error('Order update email / PDF failed:', emailError);
            }
        }

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
};


// ============================================
// CUSTOMER CONFIRMS ORDER RECEIVED
// ============================================
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
};


// ============================================
// RESERVE PRODUCT STOCK AT CHECKOUT
// ============================================
async function reserveStock(orderItems) {
    const reserved = [];

    try {
        for (const item of orderItems) {
            const quantity = Number(item.quantity);
            const productId = item.product?._id || item.product;

            if (
                !Number.isSafeInteger(quantity) ||
                quantity <= 0
            ) {
                throw new Error('Invalid product quantity.');
            }

            // Atomic update: deduct only if enough stock is available.
            const product = await Product.findOneAndUpdate(
                {
                    _id: productId,
                    isDeleted: { $ne: true },
                    stock: { $gte: quantity }
                },
                {
                    $inc: { stock: -quantity }
                },
                {
                    new: true
                }
            );

            if (!product) {
                const existingProduct = await Product.findById(productId);

                if (!existingProduct) {
                    throw new Error(
                        'A product in your cart no longer exists.'
                    );
                }

                throw new Error(
                    `Insufficient stock for ${item.name}. Available stock: ${existingProduct.stock}.`
                );
            }

            reserved.push({
                productId,
                quantity
            });
        }

        return reserved;

    } catch (error) {
        // Restore any stock already reserved if another item fails.
        await restoreStock(reserved);
        throw error;
    }
}


// ============================================
// RESTORE RESERVED STOCK
// ============================================
async function restoreStock(items) {
    for (const item of items) {
        try {
            await Product.updateOne(
                { _id: item.productId },
                {
                    $inc: { stock: item.quantity }
                }
            );

        } catch (error) {
            console.error(
                'Stock restoration failed:',
                item.productId,
                error
            );
        }
    }
}


// ============================================
// TOTAL ORDERS
// ============================================
exports.totalOrders = async (req, res, next) => {
    const totalOrders = await Order.aggregate([
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ]);

    if (!totalOrders) {
        return res.status(404).json({
            message: 'error total orders'
        });
    }

    res.status(200).json({
        success: true,
        totalOrders
    });
};


// ============================================
// TOTAL SALES
// ============================================
exports.totalSales = async (req, res, next) => {
    const totalSales = await Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        {
            $group: {
                _id: null,
                totalSales: {
                    $sum: {
                        $reduce: {
                            input: { $ifNull: ['$orderItems', []] },
                            initialValue: 0,
                            in: {
                                $add: [
                                    '$value',
                                    {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $ne: ['$this.costPrice', null] },
                                                    { $ne: ['$this.costPrice', undefined] }
                                                ]
                                            },
                                            {
                                                $multiply: [
                                                    {
                                                        $subtract: [
                                                            { $ifNull: ['$this.sellPrice', '$this.price'] },
                                                            '$this.costPrice'
                                                        ]
                                                    },
                                                    { $ifNull: ['$this.quantity', 0] }
                                                ]
                                            },
                                            0
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        totalSales
    });
};


// ============================================
// CUSTOMER SALES
// ============================================
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
                total: { $sum: {
                        $reduce: {
                            input: { $ifNull: ['$orderItems', []] },
                            initialValue: 0,
                            in: {
                                $add: [
                                    '$value',
                                    {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $ne: ['$this.costPrice', null] },
                                                    { $ne: ['$this.costPrice', undefined] }
                                                ]
                                            },
                                            {
                                                $multiply: [
                                                    {
                                                        $subtract: [
                                                            { $ifNull: ['$this.sellPrice', '$this.price'] },
                                                            '$this.costPrice'
                                                        ]
                                                    },
                                                    { $ifNull: ['$this.quantity', 0] }
                                                ]
                                            },
                                            0
                                        ]
                                    }
                                ]
                            }
                        }
                    } },
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
};


// ============================================
// SALES PER MONTH
// ============================================
exports.salesPerMonth = async (req, res, next) => {
    try {
        const salesPerMonth = await Order.aggregate([
            {
                $match: {
                    orderStatus: { $ne: 'Cancelled' },
                    createdAt: { $ne: null }
                }
            },
            {
                $group: {
                    _id: {
                        year: {
                            $year: {
                                date: '$createdAt',
                                timezone: 'Asia/Manila'
                            }
                        },
                        month: {
                            $month: {
                                date: '$createdAt',
                                timezone: 'Asia/Manila'
                            }
                        }
                    },
                    month: {
                        $first: {
                            $dateToString: {
                                format: '%b %Y',
                                date: '$createdAt',
                                timezone: 'Asia/Manila'
                            }
                        }
                    },
                    total: {
                        $sum: {
                            $reduce: {
                                input: { $ifNull: ['$orderItems', []] },
                                initialValue: 0,
                                in: {
                                    $add: [
                                        '$$value',
                                        {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $ne: ['$$this.costPrice', null] },
                                                        { $ne: ['$$this.costPrice', undefined] }
                                                    ]
                                                },
                                                {
                                                    $multiply: [
                                                        {
                                                            $subtract: [
                                                                { $ifNull: ['$$this.sellPrice', '$$this.price'] },
                                                                '$$this.costPrice'
                                                            ]
                                                        },
                                                        { $ifNull: ['$$this.quantity', 0] }
                                                    ]
                                                },
                                                0
                                            ]
                                        }
                                    ]
                                }
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
                    month: 1,
                    total: 1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            salesPerMonth
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to retrieve monthly sales.'
        });
    }
};

// Get daily sales within a selected date range (Admin)
exports.salesByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate date format
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;

        if (
            !datePattern.test(startDate || '') ||
            !datePattern.test(endDate || '')
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid start and end dates.'
            });
        }

        // Use Philippine local dates for the report
        const start = new Date(`${startDate}T00:00:00.000+08:00`);
        const endExclusive = new Date(`${endDate}T00:00:00.000+08:00`);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(endExclusive.getTime()) ||
            start > endExclusive
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date range.'
            });
        }

        // Include the entire selected end date
        endExclusive.setDate(endExclusive.getDate() + 1);

        const salesByDate = await Order.aggregate([
            {
                $match: {
                    orderStatus: { $ne: 'Cancelled' },
                    createdAt: {
                        $gte: start,
                        $lt: endExclusive
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt',
                            timezone: 'Asia/Manila'
                        }
                    },
                    totalSales: { $sum: {
                        $reduce: {
                            input: { $ifNull: ['$orderItems', []] },
                            initialValue: 0,
                            in: {
                                $add: [
                                    '$value',
                                    {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $ne: ['$this.costPrice', null] },
                                                    { $ne: ['$this.costPrice', undefined] }
                                                ]
                                            },
                                            {
                                                $multiply: [
                                                    {
                                                        $subtract: [
                                                            { $ifNull: ['$this.sellPrice', '$this.price'] },
                                                            '$this.costPrice'
                                                        ]
                                                    },
                                                    { $ifNull: ['$this.quantity', 0] }
                                                ]
                                            },
                                            0
                                        ]
                                    }
                                ]
                            }
                        }
                    } },
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    totalSales: 1,
                    totalOrders: 1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            salesByDate
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to retrieve sales report.'
        });
    }
};

// ============================================
// DOWNLOAD ORDER RECEIPT PDF
// ============================================
exports.downloadOrderReceipt = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Customers can only download their own receipts.
        if (
            req.user.role !== 'admin' &&
            order.user.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to download this receipt'
            });
        }

        const receiptPDF = await generateReceiptPDF(order);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="SpookyMart-Receipt-${order._id}.pdf"`
        );

        return res.send(receiptPDF);

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to download receipt'
        });
    }
};


// ============================================
// DOWNLOAD RECEIPT USING SECURE EMAIL TOKEN
// ============================================
exports.downloadReceiptWithToken = async (req, res) => {
    try {
        const { id, token } = req.params;

        // Verify the download token.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ensure this token is specifically for this receipt.
        if (
            decoded.purpose !== 'receipt' ||
            decoded.orderId !== id
        ) {
            return res.status(403).json({
                success: false,
                message: 'Invalid receipt download link'
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const receiptPDF = await generateReceiptPDF(order);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="SpookyMart-Receipt-${order._id}.pdf"`
        );

        return res.send(receiptPDF);

    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Receipt link is invalid or has expired'
        });
    }
};
