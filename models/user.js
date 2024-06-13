const sql = require('mssql');
const { password } = require('../config/config');

const userSchema = {
    name: sql.NVarChar(100),
    image: sql.NVarChar(255),
    email: sql.NVarChar(255),
    password: sql.NVarChar(300),
    placeCount: sql.Int
  };

module.exports = userSchema;