
const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');

const products = require('./routes/product');
const auth = require('./routes/auth');
const order = require('./routes/order');
const customer = require('./routes/customer');
const cart = require('./routes/cart');
const firebaseAuth = require('./routes/firebaseAuth');

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(cookieParser());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
    limit: '50mb',
    extended: true
}));

app.use('/api/v1', products);
app.use('/api/v1', auth);
app.use('/api/v1', firebaseAuth);
app.use('/api/v1', order);
app.use('/api/v1', customer);
app.use('/api/v1', cart);

module.exports = app;
