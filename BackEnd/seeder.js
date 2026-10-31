const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Import models
const Product = require('./models/product');
const User = require('./models/user');

// Load environment variables
dotenv.config({
    path: path.join(__dirname, 'config', '.env')
});

// JSON file paths
const productsPath = path.join(__dirname, 'productseed.json');
const usersPath = path.join(__dirname, 'userseed.json');

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(
            process.env.DB_LOCAL_URI || process.env.DB_URI
        );

        console.log('📦 MongoDB Connected for Seeding...');

        // Read seed files
        const products = JSON.parse(
            fs.readFileSync(productsPath, 'utf-8')
        );

        const users = JSON.parse(
            fs.readFileSync(usersPath, 'utf-8')
        );

        // Reset products collection
        await Product.deleteMany({});
        console.log('🗑️ Existing products deleted.');

        // Reset users collection
        await User.deleteMany({});
        console.log('🗑️ Existing users deleted.');

        // Insert seeded products
        await Product.insertMany(products);
        console.log(`🎃 Imported ${products.length} products.`);

        // Insert seeded users
        // User.create() triggers the password-hashing pre-save hook
        for (const userData of users) {
            await User.create(userData);
        }

        console.log(`👤 Imported ${users.length} users.`);
        console.log('✅ Database seeding completed successfully!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB connection closed.');
    }
};

const correctedProducts = products.map(product => ({
    ...product,
    numOfReviews: product.reviews?.length || 0,
    ratings: product.reviews?.length
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0
}));
seedDatabase();