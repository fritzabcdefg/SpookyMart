
const PDFDocument = require('pdfkit');

const generateReceiptPDF = order => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 45,
                    bottom: 45,
                    left: 45,
                    right: 45
                }
            });

            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const pageWidth = doc.page.width;
            const left = 45;
            const right = pageWidth - 45;
            const contentWidth = right - left;

            const purple = '#24133F';
            const orange = '#F28C28';
            const muted = '#777777';
            const light = '#F5F2F8';

            const money = amount =>
                `PHP ${Number(amount || 0).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;

            // Header
            doc.rect(0, 0, pageWidth, 145).fill(purple);

            doc.fillColor('#FFFFFF')
                .font('Helvetica-Bold')
                .fontSize(25)
                .text('SPOOKYMART', left, 42);

            doc.fillColor(orange)
                .fontSize(10)
                .text('YOUR SPOOKY SHOPPING DESTINATION', left, 75);

            doc.fillColor('#FFFFFF')
                .font('Helvetica-Bold')
                .fontSize(19)
                .text('ORDER RECEIPT', left, 105);

            // Order information
            doc.fillColor(purple)
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('TRANSACTION DETAILS', left, 170);

            doc.moveTo(left, 190)
                .lineTo(right, 190)
                .strokeColor(orange)
                .lineWidth(2)
                .stroke();

            const orderDate = order.createdAt
                ? new Date(order.createdAt).toLocaleString('en-PH')
                : new Date().toLocaleString('en-PH');

            doc.fillColor(muted)
                .font('Helvetica')
                .fontSize(9)
                .text('Order ID', left, 205);

            doc.fillColor(purple)
                .font('Helvetica-Bold')
                .fontSize(10)
                .text(String(order._id), left, 219, {
                    width: 240
                });

            doc.fillColor(muted)
                .font('Helvetica')
                .fontSize(9)
                .text('Order Date', right - 150, 205);

            doc.fillColor(purple)
                .font('Helvetica-Bold')
                .fontSize(10)
                .text(orderDate, right - 150, 219, {
                    width: 150,
                    align: 'right'
                });

            doc.fillColor(muted)
                .fontSize(9)
                .text('Order Status', left, 250);

            doc.fillColor(orange)
                .font('Helvetica-Bold')
                .fontSize(11)
                .text(String(order.orderStatus || 'Processing').toUpperCase(), left, 264);

            // Customer information
            const customerY = 295;

            doc.roundedRect(left, customerY, contentWidth, 76, 8)
                .fill(light);

            doc.fillColor(purple)
                .font('Helvetica-Bold')
                .fontSize(10)
                .text('CUSTOMER', left + 14, customerY + 12);

            doc.fillColor('#333333')
                .font('Helvetica')
                .fontSize(9)
                .text(order.user?.name || order.shippingInfo?.recipientName || 'Customer', left + 14, customerY + 29);

            doc.fillColor(muted)
                .text(order.user?.email || '', left + 14, customerY + 43);

            // Product table
            let y = 395;

            doc.fillColor(purple)
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('PURCHASE SUMMARY', left, y);

            y += 25;

            const columns = {
                product: left + 10,
                quantity: left + 270,
                price: left + 335,
                total: right - 10
            };

            doc.rect(left, y, contentWidth, 27).fill(purple);

            doc.fillColor('#FFFFFF')
                .font('Helvetica-Bold')
                .fontSize(8)
                .text('PRODUCT / SERVICE', columns.product, y + 9)
                .text('QTY', columns.quantity, y + 9, { width: 35, align: 'center' })
                .text('PRICE', columns.price, y + 9, { width: 65, align: 'right' })
                .text('TOTAL', columns.total - 70, y + 9, { width: 70, align: 'right' });

            y += 27;

            for (const item of order.orderItems || []) {
                const quantity = Number(item.quantity || 0);
                const price = Number(item.price || 0);
                const lineTotal = quantity * price;

                const productName = String(item.name || 'Product');

                const rowHeight = Math.max(
                    30,
                    doc.heightOfString(productName, {
                        width: 235,
                        font: 'Helvetica',
                        fontSize: 9
                    }) + 16
                );

                if (y + rowHeight > doc.page.height - 190) {
                    doc.addPage();
                    y = 55;
                }

                doc.rect(left, y, contentWidth, rowHeight)
                    .fill(y % 2 === 0 ? '#FFFFFF' : light);

                doc.fillColor('#333333')
                    .font('Helvetica')
                    .fontSize(9)
                    .text(productName, columns.product, y + 9, {
                        width: 235
                    })
                    .text(String(quantity), columns.quantity, y + 9, {
                        width: 35,
                        align: 'center'
                    })
                    .text(money(price), columns.price, y + 9, {
                        width: 65,
                        align: 'right'
                    })
                    .text(money(lineTotal), columns.total - 70, y + 9, {
                        width: 70,
                        align: 'right'
                    });

                y += rowHeight;
            }

            // Totals
            y += 20;

            if (y > doc.page.height - 160) {
                doc.addPage();
                y = 60;
            }

            const totalLabelX = right - 190;
            const totalValueX = right - 100;

            const drawTotal = (label, value, bold = false) => {
                doc.fillColor(bold ? purple : muted)
                    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
                    .fontSize(bold ? 12 : 10)
                    .text(label, totalLabelX, y, {
                        width: 100
                    });

                doc.fillColor(purple)
                    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
                    .fontSize(bold ? 12 : 10)
                    .text(money(value), totalValueX, y, {
                        width: 100,
                        align: 'right'
                    });

                y += bold ? 25 : 20;
            };

            const subtotal = Number(order.itemsPrice || 0);
            const shipping = Number(order.shippingPrice || 0);

            const grandTotal = Number(order.totalPrice || 0) > 0
                ? Number(order.totalPrice)
                : subtotal + shipping;

            drawTotal('Subtotal', subtotal);
            drawTotal('Shipping', shipping);

            doc.moveTo(totalLabelX, y)
                .lineTo(right, y)
                .strokeColor(orange)
                .lineWidth(1.5)
                .stroke();

            y += 12;

            drawTotal('GRAND TOTAL', grandTotal, true);


            // Footer
            const footerY = doc.page.height - 75;

            doc.moveTo(left, footerY)
                .lineTo(right, footerY)
                .strokeColor('#DDDDDD')
                .lineWidth(1)
                .stroke();

            doc.fillColor(purple)
                .font('Helvetica-Bold')
                .fontSize(10)
                .text('THANK YOU FOR SHOPPING WITH SPOOKYMART!', left, footerY + 13, {
                    width: contentWidth,
                    align: 'center'
                });

            doc.fillColor(muted)
                .font('Helvetica')
                .fontSize(8)
                .text('Please keep this receipt for your records.', left, footerY + 30, {
                    width: contentWidth,
                    align: 'center'
                });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = generateReceiptPDF;
