const sql = require("mssql");
const config = require("../database/dbConfig");

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

const getAdmin = async (userName, password) => {
  try {
    let pool = await sql.connect(config);
    let idadminResult = await pool.request().query('SELECT idПользователя FROM Админ');
    let idadmin = idadminResult.recordset[0].idПользователя;

    let getusers = await pool.request()
      .input('idadmin', sql.Int, idadmin)
      .input('user_name', sql.NVarChar, userName)
      .input('password', sql.NVarChar, password)
      .query("SELECT * FROM Клиенты WHERE IDКлиента = @idadmin AND user_name = @user_name AND password = @password");

    return getusers.recordset.length > 0;
  } catch (error) {
    console.log(error);
    throw error;
  }
};


const checkUsers = async (userName, password) => {
  try {
      let pool = await sql.connect(config);
      let result = await pool.request()
          .input('user_name', sql.NVarChar, userName)
          .input('password', sql.NVarChar, password)
          .query("SELECT * FROM Клиенты WHERE user_name = @user_name AND password = @password");
      return result.recordset.length > 0;
  } catch (error) {
      console.error('Error checking users:', error);
      throw error;
  }
};

const newUser = async(firstName,lastName,eMail,adress,userName,password) =>{
  try{
    let pool = await sql.connect(config);
    let result = await pool.request()
      .input('Имя',sql.NVarChar,firstName)
      .input('Фамилия',sql.NVarChar,lastName)
      .input('ЭлектроннаяПочта',sql.NVarChar,eMail)
      .input('Адрес',sql.NVarChar,adress)
      .input('user_name', sql.NVarChar, userName) 
      .input('password', sql.NVarChar, password)
      .query('insert into Клиенты (Имя,Фамилия,ЭлектроннаяПочта,Адрес,user_name,password) values (@Имя,@Фамилия,@ЭлектроннаяПочта,@Адрес,@user_name,@password)');
  }
  catch(err){
    console.log(err);
    
  }
}

module.exports = {
  newUser,
  getProducts,
  checkUsers,
  getAdmin
};