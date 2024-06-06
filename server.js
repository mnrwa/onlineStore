const express = require('express');
const dbOperation = require('./database/dbOperation');
const { checkUsers, 
    getProducts,
    getUser, 
    login,
    setCart,
    newUser} = require('./database/dbOperation');
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
    const { login: userName, password } = req.body;
    try {
        const user = await login(userName, password);
        if (user) {
            req.session.user = { userName: userName, role: user.role, id: user.IDКлиента };
            console.log(req.session.user.role);
            return res.json({ success: true, role: user.role, userName: userName, id: user.IDКлиента });
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

app.post('/reg', async (req, res) => {
    const { firstName, lastName, email, adress, username, password } = req.body;

    try {
        await newUser(firstName, lastName, email, adress, username, password);

        res.status(200).send('Регистрация успешна');
    } catch (error) {
        console.log(error)
        res.status(500).send('Ошибка сервера');
    }
});


app.get('/cart', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    let productCounts = req.session.productCounts || {};
    const productIds = Object.keys(productCounts);

    const products = await setCart(productIds);

    res.render('cart', {
        user: req.session.user,
        products: products,
        productCounts: productCounts
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
    res.redirect('/');
    });
});


app.get("/lk", (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    //console.log("Session ID:", req.session.user.id);

    getUser(req.session.user.id).then(datauser => {
        //console.log("Data User:", datauser);

        res.render('account', {
            title: 'Личный кабинет',
            datauser: datauser,
            user: req.session.user
        });
    }).catch(err => {
        console.error(err);
        res.status(500).send('Ошибка при получении данных');
    });
});
//hello


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
    
});
