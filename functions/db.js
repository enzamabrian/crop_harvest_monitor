// server.js or db.js
const mysql = require('mysql2/promise');
require('dotenv').config();


// Create a pool of connections
const pool = mysql.createPool({   
host: process.env.HOST,        // Should be '3.110.110.208' in your case
  port: process.env.PORT2,        // Should be '3306'
  user: process.env.USER,        // Check your database user
  password: process.env.PASSWORD,// Make sure the password is correct
  database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 60000, // increase the timeout to 60 seconds
    
});

module.exports = pool; // Export the pool for use in other files
