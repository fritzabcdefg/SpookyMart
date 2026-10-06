const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

// 1. Import your Mongoose Product Model 
// (Adjust this path to point to your exact product model file!)
const Product = require('./models/product'); 

// 2. Load environment variables from your root config.env
dotenv.config({ path: './config/.env' })

// 3. Connect to your SpookyMart MongoDB
mongoose.connect(process.env.DB_LOCAL_URI || process.env.DB_URI)
    .then(() => console.log('📦 MongoDB Connected for Seeding...'))
    .catch(err => console.error('Connection Error:', err));

// 4. Read and parse your local products.json file
const products = JSON.parse(fs.readFileSync('./products.json', 'utf-8'));

const seedProducts = async () => {
    try {
        // Clear out any old test data in the collection first
        await Product.deleteMany();
        console.log('🗑️ Old products cleared.');

        // Insert all JSON items automatically into your cluster
        await Product.insertMany(products);
        console.log('🎉 All products from JSON imported to SpookyMart successfully!');
        
        process.exit();
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

// Run the script function
seedProducts();
