
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');

dotenv.config({
    path: path.join(__dirname, 'config', '.env')
});

// DNS workaround previously used successfully.
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
    console.log('\n=== SPOOKYMART PRODUCTION CATALOG MIGRATION ===');

    // 1. Verify environment variables and database names.
    assert(sourceUri, 'DB_SEED_URI is missing.');
    assert(targetUri, 'DB_URI is missing.');

    assert(
        databaseNameFromUri(sourceUri) === SOURCE_DB,
        'Source must be SpookyMart_demo.'
    );

    assert(
        databaseNameFromUri(targetUri) === TARGET_DB,
        'Target must be SpookyMart.'
    );

    assert(
        sourceUri !== targetUri,
        'Source and target connections must be different.'
    );

    let source;
    let target;
    let session;

    try {
        // 2. Connect to both databases.
        source = await mongoose.createConnection(sourceUri, {
            dbName: SOURCE_DB
        }).asPromise();

        target = await mongoose.createConnection(targetUri, {
            dbName: TARGET_DB
        }).asPromise();

        assert(source.name === SOURCE_DB, 'Wrong source database.');
        assert(target.name === TARGET_DB, 'Wrong target database.');

        console.log('Source:', source.name);
        console.log('Target:', target.name);

        const sourceProducts = source.collection('products');
        const sourceCategories = source.collection('categories');

        const targetProducts = target.collection('products');
        const targetCategories = target.collection('categories');

        // 3. Read demo catalog.
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
        const demoNames = demoProducts.map(p => normalize(p.name));

        assert(
            demoNames.every(Boolean) &&
            new Set(demoNames).size === 17,
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
            'Demo category names or slugs are invalid.'
        );

        const validCategories = new Set(categoryNames);

        // 6. Validate product fields and images.
        for (const product of demoProducts) {
            assert(
                product.name && product.description,
                `Missing product text: ${product.name || 'unknown'}`
            );

            assert(
                Number.isFinite(Number(product.sellPrice ?? product.price)),
                `Invalid sellPrice: ${product.name}`
            );

            assert(
                Number.isFinite(Number(product.stock)),
                `Invalid stock: ${product.name}`
            );

            assert(
                validCategories.has(normalize(product.category)),
                `Unknown category: ${product.category}`
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

        // 7. Read production records and verify baseline.
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

        assert(existingProducts.length === 17,
            'Production product count changed. Migration stopped.');

        assert(existingCategories.length === 3,
            'Production category count changed. Migration stopped.');

        assert(usersCount === 7,
            'User count changed. Migration stopped.');

        assert(ordersCount === 21,
            'Order count changed. Migration stopped.');

        assert(cartsCount === 3,
            'Cart count changed. Migration stopped.');

        assert(customersCount === 3,
            'Customer count changed. Migration stopped.');

        // 8. Prevent duplicate product names.
        const existingNames = new Set(
            existingProducts.map(p => normalize(p.name))
        );

        for (const product of demoProducts) {
            assert(
                !existingNames.has(normalize(product.name)),
                `Product already exists: ${product.name}`
            );
        }

        // 9. Prevent category name or slug conflicts.
        for (const category of demoCategories) {
            assert(
                !existingCategories.some(c =>
                    normalize(c.name) === normalize(category.name) ||
                    normalize(c.slug) === normalize(category.slug)
                ),
                `Category conflict: ${category.name}`
            );
        }

        // 10. Check references before migration.
        const oldIds = existingProducts.map(p => p._id);

        const [cartReferences, orderReferences] = await Promise.all([
            target.collection('carts').countDocuments({
                'items.product': { $in: oldIds }
            }),
            target.collection('orders').countDocuments({
                'orderItems.product': { $in: oldIds }
            })
        ]);

        assert(
            cartReferences === 0,
            'A cart references an old product. Migration stopped.'
        );

        assert(
            orderReferences === 21,
            `Expected 21 orders referencing old products; found ${orderReferences}.`
        );

        console.log('\nPreflight passed.');
        console.log('Demo products:', demoProducts.length);
        console.log('Demo categories:', demoCategories.length);
        console.log('Old products to hide:', existingProducts.length);
        console.log('Orders to preserve:', ordersCount);
        console.log('Users to preserve:', usersCount);
        console.log('Customers to preserve:', customersCount);
        console.log('Carts to preserve:', cartsCount);

        // 11. Prepare new documents.
        const categoriesToInsert = demoCategories.map(category => {
            const { _id, ...data } = category;
            return data;
        });

        const productsToInsert = demoProducts.map(product => {
            const { _id, ...data } = product;

            const { price: legacyPrice, ...productFields } = data;
            return {
                ...productFields,
                sellPrice: Number(data.sellPrice ?? legacyPrice),
                costPrice: data.costPrice ?? null,

                // Never copy demo user reviews into production.
                reviews: [],
                ratings: 0,
                numOfReviews: 0,

                // Normalize image URLs.
                images: data.images.map(image => ({
                    ...image,
                    url: String(image.url).trim()
                })),

                isDeleted: false
            };
        });

        // 12. Apply all changes in one transaction.
        session = await target.startSession();

        await session.withTransaction(async () => {
            await targetCategories.insertMany(
                categoriesToInsert,
                { session }
            );

            await targetProducts.insertMany(
                productsToInsert,
                { session }
            );

            await targetProducts.updateMany(
                { _id: { $in: oldIds } },
                { $set: { isDeleted: true } },
                { session }
            );
        });

        console.log('\nTransaction committed.');

        // 13. Verify final database counts.
        const [
            activeProducts,
            deletedProducts,
            totalProducts,
            totalCategories,
            finalOrders,
            finalCarts,
            finalUsers,
            finalCustomers
        ] = await Promise.all([
            targetProducts.countDocuments({
                isDeleted: { $ne: true }
            }),
            targetProducts.countDocuments({
                isDeleted: true
            }),
            targetProducts.countDocuments(),
            targetCategories.countDocuments(),
            target.collection('orders').countDocuments(),
            target.collection('carts').countDocuments(),
            target.collection('users').countDocuments(),
            target.collection('customers').countDocuments()
        ]);

        console.log('\n=== MIGRATION RESULT ===');
        console.log('Active products:', activeProducts);
        console.log('Soft-deleted products:', deletedProducts);
        console.log('Total products:', totalProducts);
        console.log('Categories:', totalCategories);
        console.log('Orders:', finalOrders);
        console.log('Carts:', finalCarts);
        console.log('Users:', finalUsers);
        console.log('Customers:', finalCustomers);

        // 14. Strict final verification.
        assert(activeProducts === 17,
            'Active product verification failed.');

        assert(deletedProducts === 17,
            'Soft-deleted product verification failed.');

        assert(totalProducts === 34,
            'Total product verification failed.');

        assert(totalCategories === 5,
            'Category verification failed.');

        assert(finalOrders === 21,
            'Order count changed.');

        assert(finalCarts === 3,
            'Cart count changed.');

        assert(finalUsers === 7,
            'User count changed.');

        assert(finalCustomers === 3,
            'Customer count changed.');

        console.log('\n======================================');
        console.log('MIGRATION COMPLETED AND VERIFIED');
        console.log('======================================');

    } catch (error) {
        console.error('\nMIGRATION FAILED:', error.message);
        throw error;

    } finally {
        if (session) {
            await session.endSession();
        }

        if (source) {
            await source.close();
        }

        if (target) {
            await target.close();
        }
    }
}

main().catch(() => {
    process.exitCode = 1;
});
