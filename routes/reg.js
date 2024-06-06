const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { newUser } = require('../database/dbOperation');

// Отображение страницы регистрации
router.get('/', (req, res) => {
    res.render('register');
});

// Обработка данных регистрации
router.post('/', async (req, res) => {
    const { firstName, lastName, eMail, adress, userName, password } = req.body;

    try {

        // Сохранение нового пользователя в базе данных
        await newUser(firstName, lastName, eMail, adress, userName, password);

        res.status(200).send('Регистрация успешна');
    } catch (error) {
        res.status(500).send('Ошибка сервера');
    }
});

module.exports = router;