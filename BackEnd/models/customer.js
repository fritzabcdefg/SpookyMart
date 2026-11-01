const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    label: { type: String, trim: true, default: 'Home' },
    recipientName: { type: String, trim: true, required: true },
    phoneNo: { type: String, trim: true, required: true },
    address: { type: String, trim: true, required: true },
    city: { type: String, trim: true, required: true },
    postalCode: { type: String, trim: true, required: true },
    country: { type: String, trim: true, required: true },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

const paymentMethodSchema = new mongoose.Schema({
    label: { type: String, trim: true, default: 'My card' },
    type: { type: String, enum: ['card'], default: 'card' },
    cardholderName: { type: String, trim: true, required: true },
    brand: { type: String, trim: true, required: true },
    last4: { type: String, required: true, match: /^\d{4}$/ },
    expiryMonth: { type: Number, min: 1, max: 12, required: true },
    expiryYear: { type: Number, required: true },
    providerToken: { type: String, default: null, select: false },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    phoneNo: { type: String, trim: true, default: '' },
    addresses: [addressSchema],
    paymentMethods: [paymentMethodSchema]
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);