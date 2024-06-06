const express = require('express');
const router = express.Router();
const { getUser } = require('../database/dbOperation');

router.get('/lk', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    try {
        const datauser = await getUser(req.session.user.id);
        res.render('account', {
            title: 'Личный кабинет',
            datauser: datauser,
            user: req.session.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при получении данных');
    }
});

module.exports = router;