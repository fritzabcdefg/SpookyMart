const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/product');
const Cart = require('./models/cart');
const Order = require('./models/order');
const Category = require('./models/category');

const EXPECTED_DB = 'SpookyMart';
const uri = process.env.MONGO_URI;

function databaseNameFromUri(value) {
    const match = String(value || '').match(/^mongodb(?:\\+srv)?:\\/\\/[^/]+\\/([^/?]+)(?:\\?|$)/i);
    return match ? decodeURIComponent(match[1]) : null;
}

const normalize = value => String(value || '').trim().toLowerCase();

async function main() {
    const dbName = databaseNameFromUri(uri);
    if (!uri || dbName !== EXPECTED_DB) {
        throw new Error(`Safety stop: MONGO_URI must target exactly ${EXPECTED_DB}. Detected: ${dbName || 'missing/unknown'}.`);
    }

    const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'productseed.json'), 'utf8'));
    const categories = JSON.parse(fs.readFileSync(path.join(__dirname, 'categoryseed.json'), 'utf8'));
    if (!Array.isArray(products) || products.length !== 17) throw new Error('Expected exactly 17 demo products.');
    if (!Array.isArray(categories) || categories.length !== 2) throw new Error('Expected exactly 2 demo categories.');

    await mongoose.connect(uri);
    try {
        const [currentProducts, carts, orders, currentCategories] = await Promise.all([
            Product.find({}).select('_id name isDeleted reviews').lean(),
            Cart.find({}).select('items.product').lean(),
            Order.find({}).select('orderItems.product').lean(),
            Category.find({}).select('_id name slug isActive').lean()
        ]);

        const byName = new Map();
        for (const item of currentProducts) {
            const key = normalize(item.name);
            if (!byName.has(key)) byName.set(key, []);
            byName.get(key).push(item);
        }

        const matched = [];
        const toInsert = [];
        const nameConflicts = [];
        for (const seed of products) {
            const found = byName.get(normalize(seed.name)) || [];
            if (found.length > 1) nameConflicts.push({ name: seed.name, matches: found.length });
            else if (found.length === 1) matched.push(found[0]);
            else toInsert.push(seed.name);
        }

        const matchedIds = new Set(matched.map(item => String(item._id)));
        const legacy = currentProducts.filter(item => !matchedIds.has(String(item._id)));
        const legacyIds = new Set(legacy.map(item => String(item._id)));

        const cartRefs = carts.flatMap(cart => {
            const count = (cart.items || []).filter(item => item.product && legacyIds.has(String(item.product))).length;
            return count ? [{ cartId: String(cart._id), oldProductItems: count }] : [];
        });
        const orderRefs = orders.flatMap(order => {
            const count = (order.orderItems || []).filter(item => item.product && legacyIds.has(String(item.product))).length;
            return count ? [{ orderId: String(order._id), oldProductItems: count }] : [];
        });

        const categoryConflicts = [];
        const categoriesToAdd = [];
        for (const seed of categories) {
            const byCategoryName = currentCategories.filter(item => normalize(item.name) === normalize(seed.name));
            const bySlug = currentCategories.filter(item => normalize(item.slug) === normalize(seed.slug));
            if (byCategoryName.length > 1 || bySlug.length > 1 ||
                (byCategoryName.length && bySlug.length && String(byCategoryName[0]._id) !== String(bySlug[0]._id))) {
                categoryConflicts.push({ seed: seed.name, issue: 'Ambiguous category name/slug match' });
            } else if (!byCategoryName.length && !bySlug.length) {
                categoriesToAdd.push(seed.name);
            } else if (byCategoryName.length && byCategoryName[0].slug !== seed.slug) {
                categoryConflicts.push({ seed: seed.name, issue: 'Existing name has a different slug', existingSlug: byCategoryName[0].slug });
            } else if (!byCategoryName.length && bySlug.length) {
                categoryConflicts.push({ seed: seed.name, issue: 'Existing slug belongs to another category', existingName: bySlug[0].name });
            }
        }

        const imageIssues = [];
        for (const product of products) {
            if (!Array.isArray(product.images) || !product.images.length) {
                imageIssues.push({ product: product.name, issue: 'No images' });
                continue;
            }
            for (const image of product.images) {
                if (!image.public_id || !/^https:\\/\\//i.test(String(image.url || '').trim())) {
                    imageIssues.push({ product: product.name, issue: 'Missing public_id or HTTPS URL' });
                }
            }
        }

        console.log('\\n=== SPOOKYMART CATALOG DRY RUN — READ ONLY ===');
        console.log('Verified database:', dbName);
        console.log('Current products:', currentProducts.length);
        console.log('Demo products:', products.length);
        console.log('Demo products matched by name:', matched.length);
        console.log('Demo products to insert:', toInsert.length);
        console.log('Old products that would be soft-deleted:', legacy.length);
        console.log('Carts:', carts.length, '| carts referencing old products:', cartRefs.length);
        console.log('Orders:', orders.length, '| orders referencing old products:', orderRefs.length);
        console.log('Categories:', currentCategories.length, '| demo categories to add:', categoriesToAdd.length);
        console.log('Existing reviews on matched demo products to preserve:', matched.reduce((n, item) => n + (item.reviews || []).length, 0));

        console.log('\\nMatched products:');
        console.table(matched.map(item => ({ name: item.name, id: String(item._id), deleted: item.isDeleted === true, reviews: (item.reviews || []).length })));
        console.log('\\nDemo products to insert:', toInsert);
        console.log('\\nOld products to hide:', legacy.map(item => item.name));
        console.log('\\nCart references (cart docs remain untouched):');
        console.table(cartRefs);
        console.log('\\nOrder references (orders remain untouched):');
        console.table(orderRefs);
        console.log('\\nCategory conflicts:');
        console.table(categoryConflicts);
        console.log('\\nCategories to add:', categoriesToAdd);
        console.log('\\nImage data structure issues (URLs are NOT tested for availability):');
        console.table(imageIssues);
        console.log('\\nDuplicate seed-name conflicts:');
        console.table(nameConflicts);
        console.log('\\nDRY RUN FINISHED. No database documents were changed.');
    } finally {
        await mongoose.disconnect();
    }
}

main().catch(async error => {
    console.error('DRY RUN FAILED:', error.message);
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    process.exitCode = 1;
});
