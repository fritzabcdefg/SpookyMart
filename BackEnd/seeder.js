const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Models
const User = require('./models/user');
const Product = require('./models/product');
const Category = require('./models/category');
const Customer = require('./models/customer');
const Order = require('./models/order');

// Load environment variables from BackEnd/config/.env
dotenv.config({
    path: path.join(__dirname, 'config', '.env')
});

const readSeedFile = (fileName, required = true) => {
    const filePath = path.join(__dirname, fileName);

    if (!fs.existsSync(filePath)) {
        if (required) {
            throw new Error('Missing seed file: ' + fileName);
        }
        console.log('ℹ️ Optional seed file not found; skipping ' + fileName);
        return [];
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!Array.isArray(data)) {
        throw new Error(fileName + ' must contain a JSON array.');
    }

    return data;
};

const requireByEmail = (usersByEmail, email, context) => {
    const user = usersByEmail.get(String(email || '').toLowerCase());

    if (!user) {
        throw new Error('No seeded user found for ' + context + ': ' + email);
    }

    return user;
};

const seedDatabase = async () => {
    let connected = false;

    try {
        const mongoUri = process.env.DB_LOCAL_URI || process.env.DB_URI;

        if (!mongoUri) {
            throw new Error('DB_LOCAL_URI or DB_URI is missing from BackEnd/config/.env');
        }

        await mongoose.connect(mongoUri);
        connected = true;
        console.log('📦 MongoDB connected for seeding.');

        // Read all available seed data before changing the database.
        const usersData = readSeedFile('userseed.json');
        const productsData = readSeedFile('productseed.json');
        const categoriesData = readSeedFile('categoryseed.json');
        const customersData = readSeedFile('customerseed.json');
        const ordersData = readSeedFile('orderseed.json');
        const reviewsData = readSeedFile('reviewseed.json', false);

        // 1. Users: update the matching demo account or create it.
        // save() is intentional because it runs the User password-hashing hook.
        const usersByEmail = new Map();

        for (const userData of usersData) {
            if (!userData.email) {
                throw new Error('Every user seed must include an email.');
            }

            let user = await User.findOne({
                email: userData.email.toLowerCase()
            });

            const isNewUser = !user;
            if (!user) user = new User();

            user.name = userData.name;
            user.email = userData.email.toLowerCase();

            // Only set a password for new users, or when an explicit reset is requested.
            // This avoids hashing an existing password hash again on repeated seed runs.
            if (isNewUser || userData.resetPassword === true) {
                user.password = userData.password;
            }

            user.avatar = userData.avatar;
            user.role = userData.role || 'user';
            user.isActive = userData.isActive !== false;

            await user.save();
            usersByEmail.set(user.email.toLowerCase(), user);
        }

        console.log('👤 Users ready: ' + usersByEmail.size);

        // 2. Categories: upsert by their unique name.
        for (const categoryData of categoriesData) {
            await Category.findOneAndUpdate(
                { name: categoryData.name },
                { $set: categoryData },
                { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
            );
        }

        console.log('🗂️ Categories ready: ' + categoriesData.length);

        // 3. Products: upsert by name. Trim image URLs to avoid accidental whitespace.
        const productsByName = new Map();

        for (const productData of productsData) {
            if (!productData.name) {
                throw new Error('Every product seed must include a name.');
            }

            const product = {
                ...productData,
                images: (productData.images || []).map(image => ({
                    ...image,
                    url: String(image.url || '').trim()
                }))
            };

            const savedProduct = await Product.findOneAndUpdate(
                { name: product.name },
                { $set: product },
                { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
            );

            productsByName.set(savedProduct.name, savedProduct);
        }

        console.log('🎃 Products ready: ' + productsByName.size);

        // 4. Customer profiles: resolve userEmail to the required User ObjectId.
        const customersByEmail = new Map();

        for (const customerData of customersData) {
            const user = requireByEmail(
                usersByEmail,
                customerData.userEmail,
                'customer profile'
            );

            const { userEmail, ...customerFields } = customerData;

            const customer = await Customer.findOneAndUpdate(
                { user: user._id },
                { $set: { ...customerFields, user: user._id } },
                { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
            );

            customersByEmail.set(user.email.toLowerCase(), customer);
        }

        console.log('🧾 Customer profiles ready: ' + customersByEmail.size);

        // 5. Orders: resolve user, customer, and each product reference.
        for (const orderData of ordersData) {
            const user = requireByEmail(usersByEmail, orderData.userEmail, 'order');
            const customer = orderData.customerUserEmail
                ? customersByEmail.get(orderData.customerUserEmail.toLowerCase()) || null
                : null;

            const orderItems = (orderData.orderItems || []).map(item => {
                const product = productsByName.get(item.productName);

                if (!product) {
                    throw new Error(
                        'Order references a product that was not seeded: ' + item.productName
                    );
                }

                return {
                    name: product.name,
                    product: product._id,
                    quantity: item.quantity,
                    image: String(item.image || product.images?.[0]?.url || '').trim(),
                    price: item.price
                };
            });

            const {
                userEmail,
                customerUserEmail,
                orderItems: ignoredOrderItems,
                ...orderFields
            } = orderData;

            const orderPayload = {
                ...orderFields,
                user: user._id,
                customer: customer ? customer._id : null,
                orderItems
            };

            // user + createdAt gives each demo order a stable, repeatable seed key.
            await Order.findOneAndUpdate(
                { user: user._id, createdAt: orderData.createdAt },
                { $set: orderPayload },
                { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
            );
        }

        console.log('📦 Orders ready: ' + ordersData.length);

        // 6. Product reviews are embedded in Product.reviews in this application.
        // The review seed is optional until reviewseed.json has been prepared.
        for (const reviewData of reviewsData) {
            const user = requireByEmail(usersByEmail, reviewData.userEmail, 'review');
            const product = productsByName.get(reviewData.productName);

            if (!product) {
                throw new Error(
                    'Review references a product that was not seeded: ' + reviewData.productName
                );
            }

            const matchingOrder = await Order.findOne({
                user: user._id,
                orderStatus: 'Delivered',
                isReceived: true,
                'orderItems.product': product._id,
                ...(reviewData.orderCreatedAt
                    ? { createdAt: reviewData.orderCreatedAt }
                    : {})
            });

            if (!matchingOrder) {
                throw new Error(
                    'Review for "' + product.name +
                    '" needs a matching Delivered order with isReceived: true.'
                );
            }

            const alreadyReviewed = product.reviews.some(review =>
                review.user.toString() === user._id.toString() &&
                review.orderId?.toString() === matchingOrder._id.toString()
            );

            if (!alreadyReviewed) {
                product.reviews.push({
                    user: user._id,
                    orderId: matchingOrder._id,
                    name: user.name,
                    rating: reviewData.rating,
                    comment: reviewData.comment
                });
            }

            product.numOfReviews = product.reviews.length;
            product.ratings = product.reviews.length
                ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
                    product.reviews.length
                : 0;

            await product.save();
        }

        if (reviewsData.length) {
            console.log('⭐ Product reviews ready: ' + reviewsData.length);
        }

        console.log('✅ Database seeding completed. Existing unrelated records were preserved.');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exitCode = 1;
    } finally {
        if (connected) {
            await mongoose.disconnect();
            console.log('🔌 MongoDB connection closed.');
        }
    }
};

seedDatabase();
