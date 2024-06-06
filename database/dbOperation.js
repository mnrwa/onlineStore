const sql = require("mssql");
const config = require("../database/dbConfig");
const bcrypt = require('bcrypt');

const login = async (userName, Password) => {
  try {
    let pool = await sql.connect(config);
    let connect = await pool.request()
          .input('userName', sql.NVarChar, userName)
          .query("SELECT * FROM Клиенты WHERE user_name = @userName");

    if (connect.recordset.length > 0) {
      let user = connect.recordset[0];
      const isPasswordValid = await bcrypt.compare(Password, user.password);

      if (isPasswordValid) {
        let pooladmin = await sql.connect(config);
        let connectadmin = await pooladmin.request()
            .query(`SELECT idПользователя FROM Админ WHERE idПользователя = ${user.IDКлиента}`);

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
    let result = await pool.request().query("SELECT * FROM Товары");
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
        .query(`SELECT * FROM Товары WHERE IDТовара IN (${idsString})`);

      console.log(result.recordset);
      return result.recordset;
  } catch (err) {
      console.log(err);
  }
};

const getUser = async (userId) => {
    try {
      console.log(userId)
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('userId', sql.Int, userId)
            .query("SELECT Имя,Фамилия,ЭлектроннаяПочта,Адрес,user_name FROM Клиенты WHERE IDКлиента = @userId");

        return result.recordset;
    } catch (error) {
        console.error(error);
        throw error;
    }
};


const newUser = async (firstName, lastName, eMail, adress, userName, password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    let pool = await sql.connect(config);
    await pool.request()
      .input('Имя', sql.NVarChar, firstName)
      .input('Фамилия', sql.NVarChar, lastName)
      .input('ЭлектроннаяПочта', sql.NVarChar, eMail)
      .input('Адрес', sql.NVarChar, adress)
      .input('user_name', sql.NVarChar, userName)
      .input('password', sql.NVarChar, hashedPassword)
      .query('insert into Клиенты (Имя,Фамилия,ЭлектроннаяПочта,Адрес,user_name,password) values (@Имя,@Фамилия,@ЭлектроннаяПочта,@Адрес,@user_name,@password)');
  } catch (err) {
    console.log(err);
  }
};

const changeUser = async (firstName, lastName, eMail, adress, userName, password) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request()
      .input('Имя', sql.NVarChar, firstName)
      .input('Фамилия', sql.NVarChar, lastName)
      .input('ЭлектроннаяПочта', sql.NVarChar, eMail)
      .input('Адрес', sql.NVarChar, adress)
      .input('user_name', sql.NVarChar, userName)
      .input('password', sql.NVarChar, password)
      .query('update Клиенты set Имя = @Имя, Фамилия = @Фамилия, ЭлектроннаяПочта = @ЭлектроннаяПочта, Адрес = @Адрес, user_name = @user_name, password = @password');
  } catch (err) {
    console.log(err)
  }
};

module.exports = {
  newUser,
  getProducts,
  login,
  getUser,
  setCart
};