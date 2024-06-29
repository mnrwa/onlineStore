const sql = require("mssql");
const config = require("../database/dbConfig");
const bcrypt = require('bcrypt');
const { query } = require("express");

const login = async (userName, Password) => {
  try {
    let pool = await sql.connect(config);
    let connect = await pool.request()
          .input('userName', sql.NVarChar, userName)
          .query("SELECT * FROM users WHERE login = @userName");

    if (connect.recordset.length > 0) {
      let user = connect.recordset[0];
      const isPasswordValid = await bcrypt.compare(Password, user.password);

      if (isPasswordValid) {
        let pooladmin = await sql.connect(config);
        let connectadmin = await pooladmin.request()
            .query(`SELECT admin_id FROM role WHERE admin_id = ${user.id}`);

        if (connectadmin.recordset.length > 0) {
          return { ...user, role: 'admin', connectadmin };
        }
        return { ...user, role: 'user', connect };
      }
    }
    return null;
  } catch (err) {
    console.log(err);
    throw err;
  }
};



const getProducts = async () => {
  try {
      let pool = await sql.connect(config);
      let query = `
          SELECT p.id, p.name, p.description, p.price, p.image_path, c.name AS category_name
          FROM products p
          JOIN categories c ON p.category_id = c.id
      `;
      let result = await pool.request().query(query);
      return result.recordset;
  } catch (error) {
      console.log(error);
      throw error;
  }
};


const setCart = async (productIds) => {
  try {
      const idsString = productIds.join(',');

      let pool = await sql.connect(config);
      let result = await pool.request()
        .query(`SELECT * FROM products WHERE id IN (${idsString})`);

      //console.log(result.recordset);
      return result.recordset;
  } catch (err) {
      console.log(err);
  }
};

const getUser = async (userId) => {
    try {
      //console.log(userId)
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('userId', sql.Int, userId)
            .query("SELECT login,name,email,address,password FROM users WHERE id = @userId");

        return result.recordset;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getUsers = async () => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query(`
      SELECT u.id, u.login 
      FROM users u
      LEFT JOIN role r ON u.id = r.admin_id
      WHERE r.admin_id IS NULL
    `);
    //console.log(result.recordset);
    return result.recordset;
  } catch (err) {
    console.log(err);
  }
};

const getAdmins = async () => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query(`
      SELECT role.admin_id, users.login 
      FROM role 
      JOIN users ON role.admin_id = users.id
    `);
    return result.recordset;
  } catch (err) {
    console.log(err);
  }
};


const checkUserExists = async (login, email) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request()
      .input('login', sql.VarChar, login)
      .input('email', sql.VarChar, email)
      .query('SELECT COUNT(*) AS count FROM users WHERE login = @login OR email = @email');

    return result.recordset[0].count > 0;
  } catch (err) {
    console.error('Error checking if user exists:', err);
    throw err;
  }
};

const newUser = async (login, name, email, address, password) => {
  try {

    console.log(login, name, email, address, password)
    const hashedPassword = await bcrypt.hash(password, 10);
    let pool = await sql.connect(config);
    await pool.request()
      .input('login', sql.VarChar, login)
      .input('name', sql.VarChar, name)
      .input('email', sql.VarChar, email)
      .input('address', sql.NChar, address)
      .input('password', sql.VarChar, hashedPassword)
      .query('INSERT INTO users (login, name, email, address, password) VALUES (@login, @name, @email, @address, @password)');
  } catch (err) {
    console.error('Error creating new user:', err);
    throw err;
  }
};

const upd_user = async (id, name, email, address, password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    let pool = await sql.connect(config);
    let result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('address', sql.NChar, address)
      .input('password', sql.NVarChar, hashedPassword)
      .input('id', sql.Int, id)
      .query('UPDATE users SET name = @name, email = @email, address = @address, password = @password WHERE id = @id');
      return true;
  } catch (err) {
    console.error(err);
    throw err; 
    sql.close();
  }
};


const getProductsById = async (idProdArray) => {
  try {
      let pool = await sql.connect(config);
      let result = await pool.request()
          .input('idProdArray', sql.NVarChar, idProdArray.join(','))
          .query(`SELECT * FROM products WHERE id IN (${idProdArray.map(id => `'${id}'`).join(',')})`);
      return result.recordset;
  } catch (err) {
      console.log(err);
      throw err;
  }
};

const getprodbyid = async(id)=>{
  try {
    let pool = await sql.connect(config);
    let result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM products WHERE id = @id');

    if (result.recordset.length === 1) {
      let pool = await sql.connect(config);
      await pool.request()
          .input('id', sql.Int, id)
          .input('name', sql.NVarChar, name)
          .input('description', sql.NVarChar, description)
          .input('price', sql.Decimal, price)
          .input('image_path', sql.NVarChar, image_path)
          .input('category_id', sql.Int, category_id)
          .query('select products SET name = @name, description = @description, price = @price, image_path = @image_path, category_id = @category_id WHERE id = @id');
    } else {
        res.status(404).json({ message: "Продукт не найден." });
    }
} catch (err) {
    console.error(err);
    res.status(500).json({ message: "Произошла ошибка при получении данных о продукте." });
}
}


const createOrder = async (products, userId) => {
  try {
    let pool = await sql.connect(config);

    for (let product of products) {
      let orderResult = await pool.request()
        .input('product_id', sql.Int, product.productId)
        .input('quantality', sql.Int, product.quantity)
        .input('user_id', sql.Int, userId)
        .query("INSERT INTO orders (product_id, quantality, user_id) OUTPUT INSERTED.id AS orderId VALUES (@product_id, @quantality, @user_id)");
      if (orderResult.recordset.length > 0) {
        let orderId = orderResult.recordset[0].orderId;
        await pool.request()
          .input('order_id', sql.Int, orderId)
          .query("INSERT INTO cart (order_id) VALUES (@order_id)");
      } else {
        throw new Error('Failed to retrieve the inserted order ID');
      }
    }
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    sql.close();
  }
};

const getUserPurchases = async (userId) => {
  try { 
    let pool = await sql.connect(config);

    let result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT 
            o.id AS order_id,
            o.product_id,
            p.name AS product_name,
            p.price AS product_price,
            o.quantality,
            o.user_id,
            u.name AS user_name,
            u.email AS user_email,
            c.id AS cart_id
        FROM 
            orders o
        JOIN 
            products p ON o.product_id = p.id
        JOIN 
            users u ON o.user_id = u.id
        JOIN 
            cart c ON o.id = c.order_id
        WHERE 
            o.user_id = @user_id;
      `);
    console.log(result.recordset)
    return result.recordset;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    sql.close();
  }
};



async function getIdbyUsers() {
  try {
      let pool = await sql.connect(config);
      let result = await pool.request().query("SELECT id, name FROM users");
      return result.recordset;
  } catch (err) {
      console.log(err);
      throw err;
  }
}

async function addAdminbyId(id) {
  try {
      let pool = await sql.connect(config);
      let result = await pool.request()
          .input("id", sql.Int, id)
          .query("SELECT admin_id FROM role WHERE admin_id = @id");
      if (result.recordset.length <= 0) {
          await pool.request()
              .input("id", sql.Int, id)
              .query("INSERT INTO role (admin_id) VALUES (@id)");
          return true;
      } else {
          return false;
      }
  } catch (err) {
      console.log(err);
      throw err;
  }
}

async function dltAdminByid(id) {
  try {
      let pool = await sql.connect(config);
      //console.log(`Trying to delete admin with ID: ${id}`);
      let result = await pool.request()
          .input("id", sql.Int, id)
          .query("SELECT admin_id FROM role WHERE admin_id = @id");

      //console.log(`Database query result:`, result.recordset);

      if (result.recordset.length > 0) {
          await pool.request()
              .input("id", sql.Int, id)
              .query("DELETE FROM role WHERE admin_id = @id");
          return true;
      } else {
          return false;
      }
  } catch (err) {
      console.error('Ошибка БД: ', err);
      throw err;
  }
}

async function addProduct(name,description,price,image_path,category_id){
  try{
    let pool = await sql.connect(config);
    let res = await pool.request()
      .input("name",sql.VarChar,name)
      .input("description",sql.VarChar,description)
      .input("price",sql.Decimal,price)
      .input("image_path",sql.VarChar,image_path)
      .input("category_id",sql.Int,category_id)
      .query('insert into products (name,description,price,image_path,category_id) values (@name, @description, @price, @image_path, @category_id)');
  }
  catch(err){
    console.log(err);
    throw err;
  }
}

async function getIDCat(){
  try{
    let pool = await sql.connect(config);
    let res = await pool.request().query("select * from categories")
    return res.recordset;
  }
  catch(err){
    console.log(err);
    throw err;
  }
}

async function dltProduct(id) {
  try {
      let pool = await sql.connect(config);
      let check = await pool.request()
          .input("id", sql.Int, id)
          .query("SELECT id FROM products WHERE id = @id");

      if (check.recordset.length >= 1) {
          await pool.request()
              .input("id", sql.Int, id)
              .query("DELETE FROM products WHERE id = @id");
          return true;
      } else {
          return false;
      }
  } catch (err) {
      console.log(err);
      throw err;
  }
}

async function updateProductInDatabase(id, name, description, price, image_path, category_id) {
  try {
      let pool = await sql.connect(config);
      let check = await pool.request()
          .input('id', sql.Int, id)
          .query('select id from products where id = @id');
      
      if (check.recordset.length > 0) {
          let result = await pool.request()
              .input('id', sql.Int, id)
              .input('name', sql.VarChar, name)
              .input('description', sql.VarChar, description)
              .input('price', sql.Decimal, price)
              .input('image_path', sql.VarChar, image_path)
              .input('category_id', sql.Int, category_id)
              .query('update products set name = @name, description = @description, price = @price, image_path = @image_path, category_id = @category_id where id = @id');
          if (result.rowsAffected[0] === 1) {
              return true;
          } else {
              return false; 
          }
      } else {
          return false; 
      }
  } catch (err) {
      console.log(err);
      throw err; 
  }
}

async function add_category(name){
  try{
    let pool = await sql.connect(config);
    let res = await pool.request()
      .input("name",sql.VarChar,name)
      .query("insert into categories (name) values (@name)");
    sql.close();
    return true;

  }
  catch(err){
    console.log(err);
  }
}

async function delete_category(categoryId) {
  try {
      let pool = await sql.connect(config);
      let result = await pool.request()
          .input("categoryId", sql.Int, categoryId)
          .query("DELETE FROM categories WHERE id = @categoryId");

      sql.close(); 
      return result.rowsAffected > 0; 
  } catch (err) {
      console.error('Ошибка при удалении категории из базы данных:', err);
      return false;
  }
}

// async function upd_user(id){

// }


module.exports = {
  newUser,
  getProducts,
  login,
  getUser,
  setCart,
  getProductsById,
  createOrder,
  getUserPurchases,
  getIdbyUsers,
  getUsers,
  addAdminbyId,
  dltAdminByid,
  getAdmins,
  getIDCat,
  addProduct,
  dltProduct,
  getprodbyid,
  updateProductInDatabase,
  add_category,
  delete_category,
  checkUserExists,
  upd_user
};