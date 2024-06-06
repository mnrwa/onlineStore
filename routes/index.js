const express = require('express');
const router = express.Router();
const { getProducts } = require('../database/dbOperation');

router.get("/", async (req, res) => {
    try {
        const products = await getProducts();
        res.render('main', {
            title: 'Главная страница',
            products: products,
            user: req.session.user
        });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send('Ошибка при получении данных');
    }
});

module.exports = router;