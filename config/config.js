const sql = require('mssql');
const dotenv = require('dotenv');
const path = require('path');


// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });


// Configuration object
const config = {
  server : process.env.MYSQL_HOST, 
  user : process.env.MYSQL_USER,  
  password:process.env.MYSQL_PASSWORD,  
  database:process.env.MYSQL_DATABASE,  
  options: {
    encrypt: true, // Use encryption
    trustServerCertificate: true // Trust the server certificate (useful for self-signed certificates)
  }
};

// console.log(config);

module.exports = config;