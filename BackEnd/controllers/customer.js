
const Customer = require('../models/customer');

// Find the customer's record, or create an empty one.
const getOrCreateCustomer = async (userId) => {
    let customer = await Customer.findOne({ user: userId });

    if (!customer) {
        customer = await Customer.create({ user: userId });
    }

    return customer;
};

// GET /api/v1/customer/me
exports.getCustomer = async (req, res) => {
    try {
        const customer = await getOrCreateCustomer(req.user._id);

        return res.status(200).json({
            success: true,
            customer
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// PUT /api/v1/customer/me
exports.updateCustomer = async (req, res) => {
    try {
        const customer = await getOrCreateCustomer(req.user._id);

        if (typeof req.body.phoneNo === 'string') {
            customer.phoneNo = req.body.phoneNo.trim();
        }

        await customer.save();

        return res.status(200).json({
            success: true,
            customer
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// POST /api/v1/customer/me/addresses
exports.addAddress = async (req, res) => {
    try {
        const {
            label,
            recipientName,
            phoneNo,
            address,
            city,
            postalCode,
            country,
            isDefault
        } = req.body;

        if (
            !recipientName ||
            !phoneNo ||
            !address ||
            !city ||
            !postalCode ||
            !country
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required shipping address details.'
            });
        }

        const customer = await getOrCreateCustomer(req.user._id);

        const makeDefault =
            isDefault === true ||
            customer.addresses.length === 0;

        if (makeDefault) {
            customer.addresses.forEach(item => {
                item.isDefault = false;
            });
        }

        customer.addresses.push({
            label: label || 'Home',
            recipientName,
            phoneNo,
            address,
            city,
            postalCode,
            country,
            isDefault: makeDefault
        });

        await customer.save();

        return res.status(201).json({
            success: true,
            message: 'Shipping address saved.',
            addresses: customer.addresses
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// PUT /api/v1/customer/me/addresses/:addressId
exports.updateAddress = async (req, res) => {
    try {
        const customer = await getOrCreateCustomer(req.user._id);
        const address = customer.addresses.id(req.params.addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Shipping address not found.'
            });
        }

        const allowedFields = [
            'label',
            'recipientName',
            'phoneNo',
            'address',
            'city',
            'postalCode',
            'country'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                address[field] = req.body[field];
            }
        });

        if (req.body.isDefault === true) {
            customer.addresses.forEach(item => {
                item.isDefault = false;
            });

            address.isDefault = true;
        }

        await customer.save();

        return res.status(200).json({
            success: true,
            message: 'Shipping address updated.',
            addresses: customer.addresses
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE /api/v1/customer/me/addresses/:addressId
exports.deleteAddress = async (req, res) => {
    try {
        const customer = await getOrCreateCustomer(req.user._id);
        const address = customer.addresses.id(req.params.addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Shipping address not found.'
            });
        }

        const wasDefault = address.isDefault;

        address.deleteOne();

        if (wasDefault && customer.addresses.length > 0) {
            customer.addresses[0].isDefault = true;
        }

        await customer.save();

        return res.status(200).json({
            success: true,
            message: 'Shipping address deleted.',
            addresses: customer.addresses
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// PUT /api/v1/customer/me/addresses/:addressId/default
exports.setDefaultAddress = async (req, res) => {
    try {
        const customer = await getOrCreateCustomer(req.user._id);
        const address = customer.addresses.id(req.params.addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Shipping address not found.'
            });
        }

        customer.addresses.forEach(item => {
            item.isDefault = false;
        });

        address.isDefault = true;

        await customer.save();

        return res.status(200).json({
            success: true,
            message: 'Default shipping address updated.',
            addresses: customer.addresses
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// POST /api/v1/customer/me/payment-methods
// This stores card metadata only. Never send or save a full card number or CVV here.
exports.addPaymentMethod = async (req, res) => {
    try {
        const {
            label,
            cardholderName,
            brand,
            last4,
            expiryMonth,
            expiryYear,
            isDefault
        } = req.body;

        if (
            !cardholderName ||
            !brand ||
            !/^\d{4}$/.test(String(last4 || '')) ||
            !expiryMonth ||
            !expiryYear
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid card metadata.'
            });
        }

        const month = Number(expiryMonth);
        const year = Number(expiryYear);

        if (
            !Number.isInteger(month) ||
            month < 1 ||
            month > 12 ||
            !Number.isInteger(year)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid card expiry date.'
            });
        }

        const customer = await getOrCreateCustomer(req.user._id);

        const makeDefault =
            isDefault === true ||
            customer.paymentMethods.length === 0;

        if (makeDefault) {
            customer.paymentMethods.forEach(method => {
                method.isDefault = false;
            });
        }

        customer.paymentMethods.push({
            label: label || 'My card',
            type: 'card',
            cardholderName,
            brand,
            last4: String(last4),
            expiryMonth: month,
            expiryYear: year,
            isDefault: makeDefault
        });

        await customer.save();

        return res.status(201).json({
            success: true,
            message: 'Card metadata saved.',
            paymentMethods: customer.paymentMethods
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE /api/v1/customer/me/payment-methods/:paymentMethodId
exports.deletePaymentMethod = async (req, res) => {
    try {
        const customer = await getOrCreateCustomer(req.user._id);
        const method = customer.paymentMethods.id(
            req.params.paymentMethodId
        );

        if (!method) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found.'
            });
        }

        const wasDefault = method.isDefault;

        method.deleteOne();

        if (wasDefault && customer.paymentMethods.length > 0) {
            customer.paymentMethods[0].isDefault = true;
        }

        await customer.save();

        return res.status(200).json({
            success: true,
            message: 'Payment method deleted.',
            paymentMethods: customer.paymentMethods
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// PUT /api/v1/customer/me/payment-methods/:paymentMethodId/default
exports.setDefaultPaymentMethod = async (req, res) => {
    try {
        const customer = await getOrCreateCustomer(req.user._id);
        const method = customer.paymentMethods.id(
            req.params.paymentMethodId
        );

        if (!method) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found.'
            });
        }

        customer.paymentMethods.forEach(item => {
            item.isDefault = false;
        });

        method.isDefault = true;

        await customer.save();

        return res.status(200).json({
            success: true,
            message: 'Default payment method updated.',
            paymentMethods: customer.paymentMethods
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
