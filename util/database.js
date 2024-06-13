const sql = require('mssql');
const dotenv = require('dotenv');


// Load environment variables from .env file
dotenv.config();

// Configuration object
const config = {
  server : process.env.MYSQL_HOST, 
  user : process.env.MYSQL_USER,  
  password:process.env.MYSQL_PASSWORD,  
  database:process.env.MYSQL_DA,  
  options: {
    encrypt: true, // Use encryption
    trustServerCertificate: true // Trust the server certificate (useful for self-signed certificates)
  }
};



// Function to fetch employees
export async function fetchEmployees() {
  try {
    // Connect to the database
    let pool = await sql.connect(config);

    // Query the database
    let result = await pool.query('SELECT * FROM Employee');
    
    // Log the result
    console.log(result);

    // Close the connection pool
    await pool.close();
  } catch (error) {
    console.error('Error executing query', error);
  }
}

export async function fetchEmployeeById(id) {
    try {
      // Connect to the database
      let pool = await sql.connect(config);
  
      // Create a new request
      let request = pool.request();
  
      // Add the input parameter and execute the query
      request.input('id', sql.Int, id); // 'id' is the parameter name, sql.Int specifies the data type, id is the value
      let result = await request.query('SELECT * FROM Employee WHERE id = @id'); // @id is the placeholder
  
      // Return the result
      return result.recordset[0];
    } catch (error) {
      console.error('Error executing query', error);
      throw error;
    } finally {
      // Close the connection pool
      sql.close();
    }
}

// Call the function
const res = fetchEmployeeById(201).then(res=>{
    console.log(res);
});

// console.log(res);
