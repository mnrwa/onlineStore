const express = require('express');
const router = express.Router();
const { login } = require('../database/dbOperation');

router.post('/login', async (req, res) => {
    const { login: userName, password } = req.body;
    try {
        const user = await login(userName, password);
        
        //console.log(password)

        if (user) {
            req.session.user = { userName: userName, role: user.role, id: user.IDКлиента };
            return res.json({ success: true, role: user.role, userName: userName, id: user.IDКлиента });
        }
        res.json({ success: false });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        res.redirect('/');
    });
});

module.exports = router;