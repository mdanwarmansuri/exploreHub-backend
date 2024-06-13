const sql = require('mssql');

const placeSchema = {
    title: sql.NVarChar(255),
    description: sql.NVarChar(sql.MAX),
    image: sql.NVarChar(sql.MAX),
    address: sql.NVarChar(255),
    lat: sql.Float,
    lng: sql.Float,
    creator: sql.Int,
    created_at:sql.DateTime
  };

module.exports = placeSchema;