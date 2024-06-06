const express = require('express');
const router = express.Router();
const { setCart } = require('../database/dbOperation');

router.get('/cart', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    let productCounts = req.session.productCounts || {};
    const productIds = Object.keys(productCounts);

    try {
        const products = await setCart(productIds);
        res.render('cart', {
            user: req.session.user,
            products: products,
            productCounts: productCounts
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при получении данных');
    }
});

module.exports = router;