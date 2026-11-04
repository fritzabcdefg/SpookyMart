const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'config', '.env') });

const EXPECTED_DATABASE = 'SpookyMart';
const uri = process.env.DB_URI;
const applyChanges = process.argv.includes('--apply');

function databaseNameFromUri(value) {
    const match = String(value || '').match(
        /^mongodb(?:\\+srv)?:\\/\\/[^/]+\\/([^/?#]+)(?:[?#]|$)/i
    );

    if (!match) return null;

    try {
        return decodeURIComponent(match[1]);
    } catch {
        return null;
    }
}

async function main() {
    if (!uri) {
        throw new Error('DB_URI is missing from BackEnd/config/.env.');
    }

    const databaseName = databaseNameFromUri(uri);

    if (databaseName !== EXPECTED_DATABASE) {
        throw new Error(
            `Safety stop: DB_URI must target ${EXPECTED_DATABASE}; detected ${databaseName || 'unknown'}.`
        );
    }

    const connection = await mongoose.createConnection(uri, {
        dbName: EXPECTED_DATABASE
    }).asPromise();

    try {
        const products = connection.collection('products');
        const allProducts = await products.find({}).toArray();

        const migrationPlan = allProducts.map(product => {
            const sellPrice = product.sellPrice ?? product.price;

            if (sellPrice === null || sellPrice === undefined || sellPrice === '' || !Number.isFinite(Number(sellPrice))) {
                throw new Error(
                    `Cannot migrate "${product.name || product._id}": no valid sellPrice or legacy price exists.`
                );
            }

            return {
                _id: product._id,
                name: product.name,
                sellPrice: Number(sellPrice),
                costPrice: product.costPrice ?? null,
                hadLegacyPrice: product.price !== undefined
            };
        });

        console.log('\n=== PRODUCT PRICE FIELD MIGRATION ===');
        console.log('Database:', databaseName);
        console.log('Products checked:', migrationPlan.length);
        console.log('Products with old price field:', migrationPlan.filter(p => p.hadLegacyPrice).length);
        console.log('Products missing costPrice:', migrationPlan.filter(p => p.costPrice === null).length);
        console.log('Mode:', applyChanges ? 'APPLY CHANGES' : 'DRY RUN ONLY');

        for (const item of migrationPlan) {
            console.log(
                `- ${item.name}: sellPrice ₱${item.sellPrice.toFixed(2)}, costPrice ${item.costPrice === null ? 'NOT SET' : '₱' + Number(item.costPrice).toFixed(2)}`
            );
        }

        if (!applyChanges) {
            console.log('\nNo database changes made. Re-run with --apply to update product documents.');
            return;
        }

        let updated = 0;

        for (const item of migrationPlan) {
            const result = await products.updateOne(
                { _id: item._id },
                {
                    $set: {
                        sellPrice: item.sellPrice,
                        costPrice: item.costPrice
                    },
                    $unset: { price: '' }
                }
            );

            updated += result.modifiedCount;
        }

        const remainingLegacy = await products.countDocuments({
            price: { $exists: true }
        });

        const missingSellPrice = await products.countDocuments({
            sellPrice: { $exists: false }
        });

        if (remainingLegacy !== 0 || missingSellPrice !== 0) {
            throw new Error(
                `Verification failed: ${remainingLegacy} legacy price fields and ${missingSellPrice} missing sellPrice fields remain.`
            );
        }

        console.log('\nMigration completed.');
        console.log('Product documents modified:', updated);
        console.log('Legacy product price fields remaining:', remainingLegacy);
        console.log('Products missing sellPrice:', missingSellPrice);
        console.log('Orders, users, customers, carts, and reviews were not modified.');
    } finally {
        await connection.close();
    }
}

main().catch(error => {
    console.error('\nPRODUCT MIGRATION FAILED:', error.message);
    process.exitCode = 1;
});
