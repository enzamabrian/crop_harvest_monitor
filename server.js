const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const moment = require('moment');
const mysql = require('mysql2/promise');
const session = require('express-session');
const path = require('path');
const pool = require('./functions/db'); // Import the pool
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const { Console } = require('console');
const { name } = require('ejs');
require('dotenv').config();






const app = express();
const port = process.env.PORT || 2400;

const apikey = process.env.API_KEY;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Set views directory


// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET, // Change this to a strong secret
    resave: false,
    saveUninitialized: true,
}));






// Create tables if they don't exist
async function createTables() {
    
    const usersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255),
            email VARCHAR(255) UNIQUE,
            phone VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            city VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`;

    const reset_password = `
            CREATE TABLE IF NOT EXISTS password_reset (
            email VARCHAR(255) NOT NULL,
            otp VARCHAR(6) NOT NULL,
            otp_expiry DATETIME NOT NULL,
            PRIMARY KEY (email)
        );`

   

    const otpTable = `
       CREATE TABLE IF NOT EXISTS temp_registration (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        otp_expiry DATETIME NOT NULL,
        phone VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;



    const cropType = `CREATE TABLE IF NOT EXISTS crop_types (
    crop_type_id INT AUTO_INCREMENT PRIMARY KEY,
    crop_type_name VARCHAR(255) NOT NULL UNIQUE,
    days_to_ripe INT NOT NULL,
    image_url VARCHAR(255) NOT NULL
);`

    const crops = `CREATE TABLE IF NOT EXISTS crops (
    crop_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    crop_type_id INT NOT NULL,
    crop_name VARCHAR(255) NOT NULL,
    planting_date DATE NOT NULL,
    expected_harvest_date DATE NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (crop_type_id) REFERENCES crop_types(crop_type_id) ON DELETE CASCADE
);`


    const Tips = `CREATE TABLE IF NOT EXISTS farming_tips (
    tip_id INT AUTO_INCREMENT PRIMARY KEY,
    tip_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`





   

    try {
        const connection = await pool.getConnection();
        await connection.query(usersTable);
        await connection.query(otpTable);
        await connection.query(reset_password);
        await connection.query(cropType);
        await connection.query(crops);
        await connection.query(Tips);


        connection.release();
        console.log('Tables created or already exist');
    } catch (error) {
        console.error('Error creating tables:', error.message);
    }
}


//insert crop types
async function insertCropTypes() {
    // Predefined crop types
    const cropTypes = [
    { crop_type_name: 'Tomato', days_to_ripe: 90, image_file_name: 'tomato.jpeg' },
    { crop_type_name: 'Carrot', days_to_ripe: 75, image_file_name: 'carrot.jpeg' },
    { crop_type_name: 'Beans', days_to_ripe: 90, image_file_name: 'beans.jpeg' },
    { crop_type_name: 'Maize', days_to_ripe: 120, image_file_name: 'maize.jpg' },
    { crop_type_name: 'Cabbage', days_to_ripe: 85, image_file_name: 'cabbage.jpeg' },
    { crop_type_name: 'Green Pepper', days_to_ripe: 85, image_file_name: 'greenpaper.jpeg' },
    { crop_type_name: 'Banana', days_to_ripe: 360, image_file_name: 'banana.jpeg' },
    { crop_type_name: 'Peanut', days_to_ripe: 150, image_file_name: 'peanut.jpeg' },
    { crop_type_name: 'Soyabeans', days_to_ripe: 120, image_file_name: 'soyabeans.jpg' },
    { crop_type_name: 'Sugarcane', days_to_ripe: 540, image_file_name: 'sugarcane.jpeg' }
    
        // Add more crops as needed
    ];

    try {
        const connection = await pool.getConnection();

        for (const crop of cropTypes) {
            const image_url = `/assets/crop-images/${crop.image_file_name}`;
            const insertQuery = `
                INSERT INTO crop_types (crop_type_name, days_to_ripe, image_url)
                VALUES (?, ?, ?)
            `;
            await connection.query(insertQuery, [crop.crop_type_name, crop.days_to_ripe, image_url]);
        }

        connection.release();

    } catch (error) {
    }
}


//function to insert farming tips
async function insertFarmingTips() {
    // Predefined farming tips
    const farmingTips = [
        'Water your crops early in the morning to reduce evaporation and ensure they get enough moisture.',
        'Rotate your crops annually to prevent soil depletion and reduce pest and disease problems.',
        'Use organic fertilizers to enrich the soil and improve crop health.',
        'Regularly check for pests and diseases, and take action promptly to protect your crops.',
        'Ensure proper spacing between plants to allow for adequate air circulation and reduce disease risk.',
        'Mulch around your plants to retain soil moisture and suppress weeds.',
        'Prune your plants to promote better growth and improve air circulation.',
        'Use companion planting techniques to enhance crop growth and deter pests.',
        'Monitor weather conditions regularly to anticipate and prepare for adverse weather events.',
        'Harvest your crops at the right time to ensure optimal flavor and nutritional value.'
    ];

    try {
        const connection = await pool.getConnection();

        for (const tip of farmingTips) {
            const insertQuery = `
                INSERT INTO farming_tips (tip_text)
                VALUES (?)
            `;
            await connection.query(insertQuery, [tip]);
        }

        connection.release();
        console.log('Farming tips inserted successfully.');

        
    } catch (error) {
        console.error('Error inserting farming tips:', error.message);
    }
}


// Create tables
createTables().then(() => {
    // Insert crop types after tables are created
    insertCropTypes();
    insertFarmingTips();

});








// Function to send OTP email
async function sendOtp(email, otp) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for port 465, false for port 587
        auth: {
            user: process.env.EMAIL_USER, // your Gmail address
            pass: process.env.EMAIL_PASS, // your Gmail password or App password
        },
    });
    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Verification Code',
        text: `Hello, thank you for creating your account with Harvest crop. Your OTP code is ${otp}. It expires in 5 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending OTP email:', error.message);
        throw error;
    }
}









// Define a route to serve registration page
app.get('/register', (req, res) => {
    res.render('register', { errorMessage: null });
});

// Handle registration
app.post('/register', async (req, res) => {
    const { name, email,phone,city, password, confirm_password } = req.body;

    if (password !== confirm_password) {
        return res.render('register', { errorMessage: 'Passwords do not match, try again' });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Helper function to generate a 6-digit OTP
    function generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a random 6-digit number
    }

    // Generate a random 6-digit OTP
    const otp = generateOTP();

    // Set OTP expiry time 5 minutes from now
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    let connection;
    
    try {
        connection = await pool.getConnection();

        // Check if the email already exists in the users table
        const [existingUser] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);

        if (existingUser.length > 0) {
            connection.release();
            return res.render('register', { errorMessage: 'Email already exists. Please use a different email.' });
        }

        // Insert registration data into temporary table
        await connection.query(
            'INSERT INTO temp_registration (fullname, email, password_hash, otp, otp_expiry,phone,city) VALUES (?, ?, ?, ?, ?,?,?)',
            [name, email, passwordHash, otp, otpExpiry,phone,city]
        );

        // Send OTP email
        await sendOtp(email, otp);

        connection.release();
        res.render('registration-otp-verification', { email, errorMessage:null,successMessage:'Please check the email entered for OTP verification' });
    } catch (error) {
        console.error('Error during registration:', error);
        if (connection) connection.release();
        res.render('register', { errorMessage: 'Internal server error' });
    }
});

//verify registration otp
app.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        // Check OTP in temporary registration table
        const [rows] = await pool.query('SELECT * FROM temp_registration WHERE email = ? AND otp = ?', [email, otp]);

        if (rows.length === 0) {
            // Render the OTP verification page with the email and error message
            return res.render('registration-otp-verification', { email, errorMessage: 'Invalid OTP. Try again', successMessage: null });
        }

        const tempData = rows[0];

        // Check OTP expiry
        if (new Date() > new Date(tempData.otp_expiry)) {
            return res.render('registration-otp-verification', { email, errorMessage: 'OTP has expired', successMessage: null });
        }

        // Transfer data to main users table
        const insertUserQuery = `
            INSERT INTO users (full_name, email, phone, password, city)
            VALUES (?, ?, ?, ?, ?)
        `;
        await pool.query(insertUserQuery, [tempData.fullname, tempData.email, tempData.phone, tempData.password_hash, tempData.city]);

        // Delete from temporary table
        await pool.query('DELETE FROM temp_registration WHERE email = ?', [email]);

        // Redirect to the congratulations page
        res.render('congratulations', { successMessage: 'Registration successful!' });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.render('congratulations', { errorMessage: 'Internal server error' });
    }
});






// Define a route to serve login
app.get('/', (req, res) => {
     // If there is no error, we pass null as errorMessage
     res.render('login', { errorMessage: null, successMessage: null });
});


//login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('login', { errorMessage: 'Email and password are required', successMessage: null });
    }

    try {
        // Query to find the user by email
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        // If no user is found with that email
        if (rows.length === 0) {
            return res.render('login', { errorMessage: 'Invalid email or password', successMessage: null });
        }

        const user = rows[0];

        // Compare the entered password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            // Store user_id and email in the session
            req.session.user = { user_id: user.id, email: user.email };

            // Redirect to the dashboard after successful login
            res.redirect('/dashboard');
        } else {
            return res.render('login', { errorMessage: 'Invalid email or password', successMessage: null });
        }
    } catch (error) {
        console.error('Error during login:', error);
        return res.render('login', { errorMessage: 'An error occurred during login, please try again', successMessage: null });
    }
});



// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        res.redirect('/'); // Redirect to login if not authenticated
    }
}






//logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/'); // Redirect to login page after logout
    });
});


//tips
async function getRandomFarmingTips() {
    try {
        const connection = await pool.getConnection();

        // Query to get 3 random tips
        const query = `
            SELECT tip_text 
            FROM farming_tips 
            ORDER BY RAND() 
            LIMIT 3
        `;

        const [rows] = await connection.query(query);
        connection.release();

        // Return the tips
        return rows.map(row => row.tip_text);

    } catch (error) {
        console.error('Error fetching random farming tips:', error.message);
        return []; // Return an empty array on error
    }
}


async function getAllCropsWithDaysToHarvest(user_id) {
    try {
        const connection = await pool.getConnection();

        const query = `
            SELECT c.crop_name, c.planting_date, ct.days_to_ripe
            FROM crops c
            JOIN crop_types ct ON c.crop_type_id = ct.crop_type_id
            WHERE c.user_id = ?
        `;
        const [crops] = await connection.query(query, [user_id]);
        connection.release();

        const today = new Date();
        const cropsData = crops.map(crop => {
            const plantingDate = new Date(crop.planting_date);
            const expectedHarvestDate = new Date(plantingDate);
            expectedHarvestDate.setDate(plantingDate.getDate() + crop.days_to_ripe);
            
            const daysToHarvest = Math.ceil((expectedHarvestDate - today) / (1000 * 60 * 60 * 24));

            return {
                crop_name: crop.crop_name,
                days_to_harvest: daysToHarvest,
                expected_harvest_date: expectedHarvestDate.toISOString().split('T')[0]
            };
        });

        // Sort by days_to_harvest in ascending order and get top 6 crops
        const sortedCrops = cropsData.sort((a, b) => a.days_to_harvest - b.days_to_harvest).slice(0, 5);

        return sortedCrops;

    } catch (error) {
        console.error('Error fetching crop data:', error.message);
        return [];
    }
}




// Serve the 'Add Crop' form
app.get('/add-crop', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/'); // Redirect to login if the user is not authenticated
    }

    res.render('add-crop', {
        user: req.session.user,
        errorMessage: null,
        successMessage: null
    });
});

//render dashboard
app.get('/dashboard', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/'); // Redirect to login if not authenticated
    }

    const user_id = req.session.user?.user_id;

    try {
        // Fetch city and username from the database
        const [userRows] = await pool.query('SELECT city, full_name FROM users WHERE id = ?', [user_id]);

        if (userRows.length === 0) {
            return res.render('dashboard', {
                user: null,
                city: null,
                full_name: null,
                crops: [],
                errorMessage: 'User not found.',
                successMessage: null
            });
        }

        const { city, full_name } = userRows[0];

        // Fetch crops soon to be harvested (limit to 3) and sort by expected harvest date
        const [cropRows] = await pool.query(
            'SELECT crop_name, planting_date, expected_harvest_date, image_url FROM crops WHERE user_id = ? AND expected_harvest_date >= CURDATE() ORDER BY expected_harvest_date ASC LIMIT 3',
            [user_id]
        );

        // Calculate growth percentage for each crop
        const crops = cropRows.map(crop => {
            const now = new Date();
            const planting = new Date(crop.planting_date);
            const harvest = new Date(crop.expected_harvest_date);

            const totalDays = Math.max((harvest - planting) / (1000 * 60 * 60 * 24), 1); // Ensure at least 1 day to avoid division by zero
            const elapsedDays = Math.max((now - planting) / (1000 * 60 * 60 * 24), 0); // Ensure non-negative days

            const percentage = Math.round((elapsedDays / totalDays) * 100);

            return { ...crop, percentage };
        });


        // Fetch random tips
        const tips = await getRandomFarmingTips();
        // Fetch all crops with days to harvest for the farmer
        const cropsData = await getAllCropsWithDaysToHarvest(user_id);


        // Render dashboard.ejs with user data, city, username, and crops
        res.render('dashboard', {
            user: {
                id: user_id,
                full_name: full_name,
                city: city
            },
            crops: crops || [],
            tips: tips,
            cropsData: cropsData,
            errorMessage: null,
            successMessage: 'Login successful'
        });

    } catch (error) {
        console.error('Error fetching data:', error);
        res.render('dashboard', {
            user: null,
            city: null,
            full_name: null,
            crops: [],
            errorMessage: 'Internal server error. Please try again later.',
            successMessage: null
        });
    }
});


app.get('/my-crops', async (req, res) => {
    const user_id = req.session.user?.user_id;

    console.log("User ID from session:", user_id);

    if (!user_id) {
        return res.render('dashboard', { 
            user: null, 
            city: null, 
            fullname: null, 
            errorMessage: 'User not authenticated.', 
            successMessage: null 
        });
    }

    try {
        // Fetch city and full_name from the users table
        const [userRows] = await pool.query('SELECT city, full_name FROM users WHERE id = ?', [user_id]);

        console.log("User data from DB:", userRows);

        if (userRows.length === 0 || !userRows[0]) {
            return res.render('dashboard', { 
                user: null, 
                city: null, 
                fullname: null, 
                errorMessage: 'User not found.', 
                successMessage: null 
            });
        }

        const { city, full_name } = userRows[0];

        // Fetch crops associated with the user from the crops table
        const [cropRows] = await pool.query('SELECT crop_name, planting_date, expected_harvest_date, image_url FROM crops WHERE user_id = ?', [user_id]);

        console.log("Crops data from DB:", cropRows);

        // Compute the growth percentage for each crop
        const cropsWithPercentage = cropRows.map(crop => {
            const plantingDate = new Date(crop.planting_date);
            const expectedHarvestDate = new Date(crop.expected_harvest_date);
            const currentDate = new Date();

            // Calculate the percentage
            const totalTime = expectedHarvestDate - plantingDate;
            const timePassed = currentDate - plantingDate;
            let growthPercentage = (timePassed / totalTime) * 100;

            // Ensure the percentage is between 0 and 100
            growthPercentage = Math.min(Math.max(growthPercentage, 0), 100);

            return { ...crop, growthPercentage: Math.round(growthPercentage) };  // Add growthPercentage to crop object
        });

        // Render the my_crops.ejs view with user data and crops
        res.render('my_crops', {
            user: {
                id: user_id || null,
                full_name: full_name || null,
                city: city || null
            },
            crops: cropsWithPercentage || [],
            errorMessage: null,
            successMessage: cropRows.length > 0 ? 'Crops retrieved successfully' : 'No crops found.'
        });

    } catch (error) {
        console.error('Error fetching user or crops data:', error);
        res.render('my_crops', { 
            user: null, 
            city: null, 
            crops: [], 
            errorMessage: 'Internal server error. Please try again later.', 
            successMessage: null 
        });
    }
});










//notifications routes
app.get('/notifications', async(req, res) => {

    const user_id = req.session.user?.user_id;

    try {
        // Fetch city and username from the database
        const [rows] = await pool.query('SELECT city, full_name FROM users WHERE id = ?', [user_id]);

       
        const { city, full_name } = rows[0];

        // Fetch random tips
        const tips = await getRandomFarmingTips();
        // Fetch all crops with days to harvest for the farmer
        const cropsData = await getAllCropsWithDaysToHarvest(user_id);


        // Render dashboard.ejs with user data, city, and username
        res.render('notifications', {
            user: {
                id: user_id,
                full_name: full_name,
                city: city
            },
            tips: tips,
            cropsData: cropsData,
            errorMessage: null,
            successMessage: null,
        });
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.render('notifications', { 
            user: null, 
            city: null, 
            username: null, 
            errorMessage: 'Internal server error. Please try again later.', 
            successMessage: null 
        });
        }
    });



//serve weather page
 app.get('/weather', async (req, res) => {
        const user_id = req.session.user?.user_id; // Or use req.user.id if authenticated
    
        try {
            // Fetch city and username from the database
            const [rows] = await pool.query('SELECT city, full_name FROM users WHERE id = ?', [user_id]);

            const { city, full_name } = rows[0];
    
            // Render dashboard.ejs with user data, city, and username
            res.render('weather', {
                user: {
                    id: user_id,
                    full_name: full_name,
                    city: city,
                },
                errorMessage: null,
                successMessage: null,
                apikey: apikey,

            });
            
        } catch (error) {
            console.error('Error fetching user data:', error);
            res.render('weather', { 
                user: null, 
                city: null, 
                username: null, 
                errorMessage: 'Internal server error. Please try again later.', 
                successMessage: null,
                apikey: apikey,
            });
            }
    });
    

    

    


//forgot password file
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { errorMessage: null}); // Render forgot-password.ejs
});

//generate a 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a random 6-digit number
}

//send reset otp to the user for password reset
app.post('/send-otp-reset', async (req, res) => {
    const {email} = req.body;

    try {
        // Check if the email exists in the users table
        const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (user.length === 0) {
            res.render('forgot-password', { errorMessage: 'The email address you provided is not registered'}); 

        }

        // Generate a random 6-digit OTP
        const otp = generateOTP();


        // Set OTP expiry time 5 minutes from now
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        // Save OTP in temp table
        await pool.query(
            'INSERT INTO password_reset (email, otp, otp_expiry) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE email = ?, otp = ?, otp_expiry = ?',
            [email, otp, otpExpiry, email, otp, otpExpiry]
        );

        // Configure Nodemailer to send the email
        const transporter = nodemailer.createTransport({
            service: 'gmail', // or any other email service you use
            auth: {
                user: process.env.EMAIL_USER, // Your email address (use environment variables)
                pass: process.env.EMAIL_PASS  // Your email password (use environment variables)
            }
        });

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP for your account',
            text: `Your OTP for password reset is ${otp}. It is valid for 5 minutes.`
        };

        // Send the email
        await transporter.sendMail(mailOptions);


        return res.render('otp-verification', { email,successMessage:"OTP successfully sent, check your email", errorMessage: null });
     


    } catch (error) {
        res.render('forgot-password', {errorMessage: 'Error sending OTP for password reset, try again'});

    }
});

//verify the otp for password reset
app.post('/verify-otp-reset', async (req, res) => {
    const { email, otp } = req.body;
    try {
        // Check OTP in the password_reset table
        const [rows] = await pool.query('SELECT * FROM password_reset WHERE email = ? AND otp = ?', [email, otp]);
        
        // If no matching OTP is found
        if (rows.length === 0) {
            return res.render('otp-verification', { email, errorMessage: 'Invalid OTP, check and try again',successMessage:null });
        }
        
        const resetData = rows[0];
        
        // Check if OTP has expired
        if (new Date() > new Date(resetData.otp_expiry)) {
            return res.render('otp-verification', { email, errorMessage: 'OTP has expired',successMessage:null});
        }

        // OTP is valid and has not expired, proceed with password reset
        return res.render('reset-password', { successMessage:'OTP verification sucessful, reset your password', errorMessage: null, email});

    } catch (error) {
        return res.render('forgot-password', { errorMessage: 'An error occurred, please try again.',successMessage:null });
    }
});


//reset the password in the database
app.post('/update-password', async (req, res) => {
    const { email, new_password, confirm_password } = req.body;

    // Validate that the new passwords match
    if (new_password !== confirm_password) {
        return res.render('reset-password', { email, errorMessage: 'New password and confirm password do not match. Please re-enter.' });
    }

    try {
        // Hash the new password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(new_password, saltRounds);

        // Update the password in the users table
        const [result] = await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

        // Check if the update affected any rows (if the email exists)
        if (result.affectedRows === 0) {
            return res.render('reset-password', { errorMessage: 'Email not found. Please check your email address.' });
        }

        // Optionally, delete the OTP from the password_reset table
        await pool.query('DELETE FROM password_reset WHERE email = ?', [email]);

        // Render or redirect to the success page after password reset
        res.render('password-reset-success', { email });

    } catch (error) {
        // Log the error and send back a user-friendly message
        return res.status(500).render('reset-password', { email, errorMessage: 'An error occurred while updating your password. Please try again later.' });
    }
});













//dashboard routes
app.post('/add-crops', async (req, res) => {
    const { crop_type, planting_date } = req.body;
    const user_id = req.session.user?.user_id;

    // Check if all required fields are provided
    if (!crop_type || !planting_date || !user_id) {
        return res.render('add-crop', { user: null, successMessage: null, errorMessage: "Missing required fields" });
    }

    try {
        // Fetch full_name from the users table using user_id
        const userQuery = 'SELECT full_name FROM users WHERE id = ?';
        const [userResult] = await pool.execute(userQuery, [user_id]);

        if (userResult.length === 0) {
            return res.render('add-crop', { user: null, successMessage: null, errorMessage: "User not found" });
        }

        const full_name = userResult[0].full_name;

        // Fetch the crop type ID and image URL from the database
        const cropTypeQuery = 'SELECT crop_type_id, image_url FROM crop_types WHERE crop_type_name = ?';
        const [cropTypeResult] = await pool.execute(cropTypeQuery, [crop_type]);

        if (cropTypeResult.length === 0) {
            return res.render('add-crop', { user: { full_name }, successMessage: null, errorMessage: "Invalid crop type" });
        }

        const { crop_type_id, image_url } = cropTypeResult[0];

        // Calculate the harvest date
        const plantingDate = new Date(planting_date);
        const cropDetailsQuery = 'SELECT days_to_ripe FROM crop_types WHERE crop_type_id = ?';
        const [cropDetailsResult] = await pool.execute(cropDetailsQuery, [crop_type_id]);

        const days_to_ripe = cropDetailsResult[0]?.days_to_ripe;
        if (!days_to_ripe) {
            return res.render('add-crop', { user: { full_name }, successMessage: null, errorMessage: "Error retrieving crop type details, try again" });
        }

        const harvestDate = new Date(plantingDate);
        harvestDate.setDate(plantingDate.getDate() + days_to_ripe);
        const formattedHarvestDate = harvestDate.toISOString().split('T')[0]; // This ensures 'YYYY-MM-DD' format

        // Use crop_type as crop_name
        const crop_name = crop_type;

        // Insert crop into the crops table
        const insertCropQuery = `
            INSERT INTO crops (user_id, crop_type_id, crop_name, planting_date, expected_harvest_date, image_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await pool.execute(insertCropQuery, [user_id, crop_type_id, crop_name, planting_date, formattedHarvestDate, image_url]);

        return res.render('add-crop', { user: { full_name }, successMessage: "Crop added successfully", errorMessage: null });

    } catch (error) {
        console.error('Error adding crop:', error);
        return res.render('add-crop', { user: { full_name: null }, successMessage: null, errorMessage: "Internal server error" });
    }
});








//render profile 
app.get('/profile', async (req, res) => {
    const user_id = req.session.user?.user_id;
    // Or use req.user.id if authenticated

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);

        if (rows.length === 0) {
            return res.status(404).render('profile', { errorMessage: 'User not found', user: null });
        }

        const user = rows[0];

        res.render('profile', { user, errorMessage: null,successMessage:null });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.render('profile', { errorMessage: 'Internal server error', user: null });
    }

    
});

// Route to render the update profile page
app.get('/update-profile', async (req, res) => {
    const user_id = req.session.user?.user_id;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);

        if (rows.length === 0) {
            return res.status(404).render('update', { errorMessage: 'User not found', user: null });
        }

        const user = rows[0];

        res.render('update', { user, errorMessage: null, successMessage:null });
    } catch (error) {
        console.error('Error fetching user details for update:', error);
        res.render('update', { errorMessage: 'Internal server error', user: null });
    }
});

app.post('/update-profile', async (req, res) => {
    const { phone, city } = req.body;
    const user_id = req.session.user?.user_id;

    try {
        // Update user details (phone and city) in the database
        await pool.query('UPDATE users SET phone = ?, city = ? WHERE id = ?', 
            [phone, city, user_id]);

        // Fetch the updated user details to render on the profile page
        const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);

        // Render the profile page with the updated user details and a success message
        return res.render('profile', {
            user: updatedUser[0], // Pass the updated user data to the template
            successMessage: 'Profile updated successfully.',
            errorMessage: null
        });

    } catch (error) {
        console.error('Error updating user details:', error);
        // Render the update page with an error message in case of an error
        return res.status(500).render('update', { 
            errorMessage: 'Internal server error. Please try again later.', 
            user: req.body 
        });
    }
});



//notifications







app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
