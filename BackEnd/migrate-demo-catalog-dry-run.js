
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');

// Load the actual backend environment file.
dotenv.config({
    path: path.join(__dirname, 'config', '.env')
});

// DNS workaround previously used successfully on your machine.
dns.setServers(['1.1.1.1', '8.8.8.8']);

const SOURCE_DB = 'SpookyMart_demo';
const TARGET_DB = 'SpookyMart';

const sourceUri = process.env.DB_SEED_URI;
const targetUri = process.env.DB_URI;

function databaseNameFromUri(uri) {
    const match = String(uri || '').match(
        /^mongodb(?:\+srv)?:\/\/[^/]+\/([^/?#]+)(?:[?#]|$)/i
    );

    if (!match) return null;

    try {
        return decodeURIComponent(match[1]);
    } catch {
        return null;
    }
}

const normalize = value =>
    String(value || '').trim().toLowerCase();

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function main() {
    console.log('\n=== SPOOKYMART CATALOG DRY RUN ===');
    console.log('READ-ONLY: No database changes will be made.\n');

    // 1. Environment checks.
    assert(sourceUri, 'DB_SEED_URI is missing from config/.env.');
    assert(targetUri, 'DB_URI is missing from config/.env.');

    const sourceName = databaseNameFromUri(sourceUri);
    const targetName = databaseNameFromUri(targetUri);

    assert(
        sourceName === SOURCE_DB,
        `Source must target ${SOURCE_DB}. Detected: ${sourceName || 'unknown'}`
    );

    assert(
        targetName === TARGET_DB,
        `Target must target ${TARGET_DB}. Detected: ${targetName || 'unknown'}`
    );

    assert(
        sourceUri !== targetUri,
        'Source and target connection strings must be different.'
    );

    console.log('Source database:', sourceName);
    console.log('Target database:', targetName);

    // 2. Connect to both databases.
    const source = await mongoose.createConnection(sourceUri, {
        dbName: SOURCE_DB
    }).asPromise();

    let target;

    try {
        target = await mongoose.createConnection(targetUri, {
            dbName: TARGET_DB
        }).asPromise();

        assert(
            source.name === SOURCE_DB,
            'Connected to the wrong source database.'
        );

        assert(
            target.name === TARGET_DB,
            'Connected to the wrong target database.'
        );

        const sourceProducts = source.collection('products');
        const sourceCategories = source.collection('categories');

        const targetProducts = target.collection('products');
        const targetCategories = target.collection('categories');

        // 3. Read demo data.
        const [demoProducts, demoCategories] = await Promise.all([
            sourceProducts.find({}).toArray(),
            sourceCategories.find({}).toArray()
        ]);

        assert(
            demoProducts.length === 17,
            `Expected 17 demo products; found ${demoProducts.length}.`
        );

        assert(
            demoCategories.length === 2,
            `Expected 2 demo categories; found ${demoCategories.length}.`
        );

        // 4. Validate demo product names.
        const productNames = demoProducts.map(p => normalize(p.name));

        assert(
            productNames.every(Boolean) &&
            new Set(productNames).size === 17,
            'Demo product names are missing or duplicated.'
        );

        // 5. Validate demo categories.
        const categoryNames = demoCategories.map(c => normalize(c.name));
        const categorySlugs = demoCategories.map(c => normalize(c.slug));

        assert(
            categoryNames.every(Boolean) &&
            categorySlugs.every(Boolean) &&
            new Set(categoryNames).size === 2 &&
            new Set(categorySlugs).size === 2,
            'Demo category names or slugs are missing or duplicated.'
        );

        const categoryNameSet = new Set(categoryNames);

        // 6. Validate product fields and images.
        for (const product of demoProducts) {
            assert(
                product.name && product.description,
                `Missing required text on product: ${product.name || 'unknown'}`
            );

            assert(
                Number.isFinite(Number(product.price)),
                `Invalid price: ${product.name}`
            );

            assert(
                Number.isFinite(Number(product.stock)),
                `Invalid stock: ${product.name}`
            );

            assert(
                product.category &&
                categoryNameSet.has(normalize(product.category)),
                `Unknown category on ${product.name}: ${product.category}`
            );

            assert(
                Array.isArray(product.images) &&
                product.images.length > 0,
                `Missing images: ${product.name}`
            );

            assert(
                product.images.every(image =>
                    image.public_id &&
                    /^https:\/\//i.test(String(image.url || '').trim())
                ),
                `Invalid image data: ${product.name}`
            );
        }

        // 7. Read existing production records.
        const [
            existingProducts,
            existingCategories,
            usersCount,
            ordersCount,
            cartsCount,
            customersCount
        ] = await Promise.all([
            targetProducts.find({}).toArray(),
            targetCategories.find({}).toArray(),
            target.collection('users').countDocuments(),
            target.collection('orders').countDocuments(),
            target.collection('carts').countDocuments(),
            target.collection('customers').countDocuments()
        ]);

        // 8. Strict baseline checks.
        assert(
            existingProducts.length === 17,
            `Expected 17 existing products; found ${existingProducts.length}.`
        );

        assert(
            existingCategories.length === 3,
            `Expected 3 existing categories; found ${existingCategories.length}.`
        );

        assert(
            usersCount === 7,
            `Expected 7 users; found ${usersCount}.`
        );

        assert(
            ordersCount === 21,
            `Expected 21 orders; found ${ordersCount}.`
        );

        assert(
            cartsCount === 3,
            `Expected 3 carts; found ${cartsCount}.`
        );

        assert(
            customersCount === 3,
            `Expected 3 customers; found ${customersCount}.`
        );

        // 9. Check duplicate product names.
        const existingProductNames = new Set(
            existingProducts.map(p => normalize(p.name))
        );

        for (const product of demoProducts) {
            assert(
                !existingProductNames.has(normalize(product.name)),
                `Product already exists in production: ${product.name}`
            );
        }

        // 10. Check category name and slug conflicts.
        for (const category of demoCategories) {
            const nameConflict = existingCategories.some(
                c => normalize(c.name) === normalize(category.name)
            );

            const slugConflict = existingCategories.some(
                c => normalize(c.slug) === normalize(category.slug)
            );

            assert(
                !nameConflict && !slugConflict,
                `Category conflict: ${category.name}`
            );
        }

        // 11. Check whether carts reference old products.
        const oldIds = existingProducts.map(p => p._id);

        const cartReferences = await target.collection('carts')
            .countDocuments({
                'items.product': { $in: oldIds }
            });

        // 12. Check whether orders reference old products.
        const orderReferences = await target.collection('orders')
            .countDocuments({
                'orderItems.product': { $in: oldIds }
            });

        // 13. Inspect demo reviews and product ownership.
        const demoReviewCount = demoProducts.reduce(
            (total, product) =>
                total + (Array.isArray(product.reviews)
                    ? product.reviews.length
                    : 0),
            0
        );

        const demoProductsWithUserReference = demoProducts.filter(
            product => product.user
        ).length;

        // 14. Display the migration plan.
        console.log('\n=== PREFLIGHT RESULTS ===');

        console.log('Current production products:', existingProducts.length);
        console.log('Demo products:', demoProducts.length);
        console.log('Demo products to insert:', demoProducts.length);
        console.log('Old products to soft-delete:', existingProducts.length);

        console.log('\nExisting records to preserve:');
        console.log('Users:', usersCount);
        console.log('Orders:', ordersCount);
        console.log('Customers:', customersCount);
        console.log('Carts:', cartsCount);

        console.log('\nReference checks:');
        console.log('Carts referencing old products:', cartReferences);
        console.log('Orders referencing old products:', orderReferences);

        console.log('\nDemo data inspection:');
        console.log('Demo embedded reviews:', demoReviewCount);
        console.log(
            'Demo products with user references:',
            demoProductsWithUserReference
        );

        console.log('\nCategories:');
        console.log('Existing categories:', existingCategories.length);
        console.log('Demo categories to add:', demoCategories.length);

        console.log('\nOld products that would be hidden:');

        for (const product of existingProducts) {
            console.log('-', product.name);
        }

        // 15. Final safety checks.
        assert(
            cartReferences === 0,
            'A cart references an old product. Stop and review.'
        );

        console.log('\n======================================');
        console.log('DRY RUN PASSED');
        console.log('======================================');

        console.log('No database records were inserted.');
        console.log('No database records were updated.');
        console.log('No database records were deleted.');

        console.log('\nProduction database is unchanged.');
        console.log('Ready for migration review.');

    } finally {
        if (target) {
            await target.close();
        }

        await source.close();
    }
}

main().catch(error => {
    console.error('\nDRY RUN FAILED:', error.message);
    process.exitCode = 1;
});
