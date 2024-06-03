const express = require('express');
const dbOperation = require('./database/dbOperation');
const { checkUsers, getProducts, newUser, getAdmin } = require('./database/dbOperation');
const app = express();
const hbs = require('hbs');
const port = 3000;
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'public', 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'keyauth',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

hbs.registerPartials(path.join(__dirname, 'public', 'views', 'partials'), (err) => {});

app.get("/", (req, res) => {
    getProducts().then(products => {
        res.render('main', {
            title: 'Главная страница',
            products: products,
            user: req.session.user
        });
    }).catch(err => {
        console.error('Error fetching products:', err);
        res.status(500).send('Ошибка при получении данных');
    });
});

app.post('/', async (req, res) => {
    const { login, password } = req.body;
    try {
        const isAdmin = await getAdmin(login, password);
        if (isAdmin) {
            req.session.user = { userName: login, role: 'admin' };
            return res.json({ success: true, role: 'admin', userName: login });
        }
        const userExists = await checkUsers(login, password);
        if (userExists) {
            req.session.user = { userName: login, role: 'user' };
            return res.json({ success: true, role: 'user', userName: login });
        }

        res.json({ success: false });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.get('/reg', (req, res) => {
    res.render('register');
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
