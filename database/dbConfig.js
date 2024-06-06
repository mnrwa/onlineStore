const config = {
  user : "Admin",
  password: "root",
  server: "VLADIMIR",
  database: "db_shop",
  options:{
    trustServerCertificate: true,
    trustConnection: false,
    enableArithAbort: true,
    instancename: "SQLEXPRESS",
  },
  port: 1433
}
module.exports = config;
