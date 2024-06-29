const express = require('express');
const {
    checkUsers,
    getProducts,
    getUser,
    login,
    setCart,
    newUser,
    getProductsById,
    createOrder,
    getUserPurchases,
    getIdbyUsers,
    getUsers,
    addAdminbyId,
    dltAdminByid,
    getAdmins,
    addProduct,
    getIDCat,
    dltProduct,
    getprodbyid,
    updateProductInDatabase,
    add_category,
    delete_category,
    checkUserExists,
    upd_user
} = require('./database/dbOperation');

const path = require('path');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');


const app = express();
const port = 3000;

hbs.registerHelper('eq', function(a, b) {
    return a == b;
});

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'public', 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'keyauth',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(express.urlencoded({ extended: true }));

hbs.registerPartials(path.join(__dirname, 'public', 'views', 'partials'), (err) => {
    if (err) console.error('Ошибка регистрации частичных шаблонов:', err);
});


const checkSession = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    next();
};

const checkAdmin = (req,res,next) =>{
    if (!req.session.user.role == "admin"){
        return res.redirect('/')
    }
    next();
}



app.get("/", async (req, res) => {
    try {
        const products = await getProducts();
        res.render('main', {
            title: 'Главная страница',
            products,
            user: req.session.user
        });
    } catch (err) {
        console.error('Ошибка при получении продуктов:', err);
        res.status(500).send('Ошибка при получении данных');
    }
});


app.post('/', async (req, res) => {
    const { login: userName, password } = req.body;
    try {
        const user = await login(userName, password);
        if (user) {
            req.session.cookie.maxAge = 600000; // Время жизни в 10 минут 
            req.session.user = { userName, role: user.role, id: user.id };
            console.log(`Роль пользователя: ${req.session.user.role}`);
            return res.json({ success: true, role: user.role, userName, id: user.id });
        }
        res.json({ success: false });
    } catch (error) {
        console.error('Ошибка при входе в систему:', error);
        res.status(500).send({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/reg', (req, res) => {
    res.render('register');
});


app.post('/api/products', checkSession, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send('No product IDs provided');
    }

    try {
        const products = await getProductsById(ids);
        res.json(products);
    } catch (error) {
        console.error('Ошибка при получении данных о товарах:', error);
        res.status(500).send('Ошибка при получении данных о товарах');
    }
});



// app.post('/reg', async (req, res) => {
//     const { login, name, email, address, password } = req.body;
//     try {
//         if (checkUserExists(login, email))
//             {
//                 res.status(400).send('Пользователь с таким логином или email уже зарегистрирован');
//                 return;
//             }
//         await newUser(login, name, email, address, password );
//         res.status(200).send('Регистрация успешна');
//     } catch (error) {
//         console.error('Ошибка при регистрации нового пользователя:', error);
//         res.status(500).send('Ошибка сервера');
//     }
// });


app.post('/registr', async (req, res) => {
    const { login, name, email, address, password } = req.body;

    console.log('Сервак прверка', req.body);
    
    try {
        const userExists = await checkUserExists(login, email);
        if (userExists) {
            res.status(400).send('Пользователь с таким логином или email уже существует');
            return;
        }
        await newUser(login, name, email, address, password);

        res.status(200).send('Регистрация успешно завершена');
    } catch (error) {
        console.error('Ошибка при регистрации нового пользователя:', error);
        res.status(500).send('Ошибка сервера');
    }
});


app.post('/new-order', (req, res) => {
    const { products,userId } = req.body; 
    //someFunc()
    console.log(products,userId)
    //console.log(Object.keys(products).length) Количесвто товаров в корзине 
    createOrder(products,userId);
    
});



app.get('/cart', checkSession, (req, res) => {
    res.render('cart', {
        user: req.session.user
    });
});


app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Ошибка при завершении сессии:', err);
            return res.status(500).send('Ошибка при выходе из системы');
        }
        res.redirect('/');
    });
});
// app.get('/test', async (req, res) => {
//     try {
//         const idUsers = await getIdbyUsers();

//         if (req.headers.accept && req.headers.accept.includes('application/json')) {
//             res.json(idUsers); 
//         } else {
//             res.render('admin', {
//                 getIdbyUsers: idUsers
//             }); 
//         }
//     } catch (err) {
//         console.log(err);
//         res.status(500).send('Ошибка сервера');
//     }
// });

app.get("/lk", checkSession, async (req, res) => {
    if (req.session.user.role === 'user') {
        try {
            const datauser = await getUser(req.session.user.id);
            res.render('account', {
                title: 'Личный кабинет',
                datauser,
                user: req.session.user
            });
        } catch (err) {
            console.error('Ошибка при получении данных пользователя:', err);
            res.status(500).send('Ошибка при получении данных');
        }
    } 
    else {
        try {
            const dataUsers = await getUsers();
            const dataAdmin = await getAdmins();
            const dataCat = await getIDCat();
            const dataproducts = await getProducts();
            res.render('admin',{
                user: req.session.user,
                dataUsers,
                dataAdmin,
                dataCat,
                dataproducts

            })
        } catch (err) {
            console.error('Ошибка при получении данных пользователей:', err);
            res.status(500).send('Ошибка при получении данных');
        }
    }
});


app.post("/add_admin", async (req, res) => {
    const { addAdmin, idUser } = req.body;
    try {

        let result;
        if (addAdmin) {
            result = await addAdminbyId(addAdmin);
        } else if (idUser && login) {
            result = await addAdminbyId(idUser);
        } else {
            return res.status(400).json({ message: "Необходимо указать ID пользователя или выбрать логин" });
        }

        if (result) {
            res.status(200).json({ message: "Пользователь успешно добавлен" });
        } else {
            res.status(400).json({ message: "Пользователь уже существует" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Произошла ошибка при добавлении пользователя" });
    }
});




app.post("/deleteAdminForm", async (req, res) => {
    const { deleteAdmin, idUser } = req.body;
    console.log(deleteAdmin, idUser)
    try {
        let result;
        if (deleteAdmin) {
            result = await dltAdminByid(deleteAdmin);
        } else if (idUser) {
            result = await dltAdminByid(idUser);
        } else {
            return res.status(400).json({ message: "Необходимо указать ID пользователя или выбрать логин" });
        }

        if (result) {
            res.status(200).json({ message: "Пользователь успешно удален" });
        } else {
            res.status(400).json({ message: "Пользователь не найден" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Произошла ошибка при удалении пользователя" });
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/products_img/');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const filename = uuidv4() + ext;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

app.post('/addProductForm', upload.single('photo'), (req, res) => {
    const { name, description, price, category_id } = req.body;
    const photo = req.file;
    const filenameWithExtension = photo.filename;
    if (addProduct(name, description, price, filenameWithExtension, category_id))
        res.json({ message: 'Продукт успешно добавлен!' });
    else{
        res.json({message: "Произошла ошибка!"})
    }
});

app.post('/dltprodform', async (req, res) => {
    const { id } = req.body;

    try {
        const result = await dltProduct(id);
        if (result) {
            res.json({ message: "Продукт успешно удален!" });
        } else {
            res.status(404).json({ message: "Продукт не найден." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Произошла ошибка при удалении продукта." });
    }
});

app.get('/editproduct', async (req, res) => {
    try {
        const dataCat = await getIDCat();
        const dataproducts = await getProducts();
        
        if (req.session && req.session.user && req.session.user.role === 'admin') {
            let id = req.query.id;
            const product = dataproducts.find(prod => prod.id == id); 

            if (!product) {
                res.status(404).send('Product not found');
                return;
            }

            res.render('redprod', {
                title: `Редактировать товар ${id}`,
                user: req.session.user,
                product,
                dataCat
            });
        } else {
            res.redirect("/");
        }
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
});

app.post('/updateproduct', upload.single('photo'), async (req, res) => {
    try {
        const { id, name, description, price, category_id } = req.body;
        const photo = req.file ? req.file.filename : null;

        updateProductInDatabase(id, name, description, price, photo, category_id );

        res.json({ success: true });
    } catch (err) {
        console.log(err);
        res.json({ success: false, error: err.message });
    }
});

app.post('/add_category', async (req, res) => {
    const { categoryName } = req.body;
    try {
        const result = await add_category(categoryName);
        if (result) {
            res.json({ message: "Категория успешно добавлена!" });
        } else {
            res.status(500).json({ message: "Ошибка при добавлении категории." });
        }
    } catch (err) {
        console.error('Ошибка при добавлении категории:', err);
        res.status(500).json({ message: "Произошла ошибка при добавлении категории." });
    }
});

app.post('/dlt_category', async (req, res) => {
    const { category_id } = req.body;
    try {
        const result = await delete_category(category_id);
        if (result) {
            res.json({ message: "Категория успешно удалена!" });
        } else {
            res.status(500).json({ message: "Ошибка при удалении категории." });
        }
    } catch (err) {
        console.error('Ошибка при удалении категории:', err);
        res.status(500).json({ message: "Произошла ошибка при удалении категории." });
    }
});

app.post('/updateUser', async (req, res) => {
    const { id, name, email, address, password } = req.body;
    try {
        const result = await upd_user(id, name, email, address, password);
        if (result) {
            res.json({ message: "Данные успешно обновлены!" });
        } else {
            res.status(500).json({ message: "Ошибка при обновлении" });
        }
    } catch (err) {
        console.error('Ошибка при обновлении', err);
        res.status(500).json({ message: "Произошла ошибка при обновлении." });
    }
});



app.listen(port, () => {
    console.log(`Сервер запущен на порту: ${port}`);
});
