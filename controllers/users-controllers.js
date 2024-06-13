const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const sql = require("mssql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const config = require("../config/config.js");

const userSchema = require("../models/user");

const HttpError = require("../models/http-error");



let users = {}; 

const getUsers = async (req, res, next) => {
  let pool;
  let userId= req.params.userId;
  try {
    // Connect to the database
    pool = await sql.connect(config);

    // Create a new request
    let request = pool.request();

    request.input('userId',sql.Int,userId);


    let result = await request.query("SELECT top(5) u1.*,(select count(*) from friends f1 where f1.userId=u1.id and  f1.friendId in( select f2.friendId from friends f2 where f2.userId=@userId)) as mutual from users u1 where u1.id!=@userId and u1.id not in (select fr1.receiverId as uid from friendRequests fr1 where senderId=@userId union select fr2.senderId as uid from friendRequests fr2 where receiverId=@userId) and u1.id not in (select friendId from friends where userId=@userId) ");
    const users = result.recordset;

    const usersWithoutPasswords = users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);

    res.json({ users:usersWithoutPasswords });
  } catch (error) {
    console.error("Error executing query", error);
    next(error); // Pass the error to the next middleware
  } finally {
    // Close the connection pool
    if (pool) {
      pool.close();
    }
  }
};

const getConnections = async (req, res, next) => {
  let pool;
  let userId= req.params.userId;
  try {
    // Connect to the database
    pool = await sql.connect(config);

    // Create a new request
    let request = pool.request();

    request.input('userId',sql.Int,userId);


    let result = await request.query('select * from users where id in (select friendId from friends where userId=@userId)');
    const users = result.recordset;

    const usersWithoutPasswords = users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);

    res.json({ users:usersWithoutPasswords });
  } catch (error) {
    console.error("Error executing query", error);
    next(error); // Pass the error to the next middleware
  } finally {
    // Close the connection pool
    if (pool) {
      pool.close();
    }
  }
};

const getRequests = async (req, res, next) => {
  let pool;
  let userId= req.params.userId;
  try {
    // Connect to the database
    pool = await sql.connect(config);

    // Create a new request
    let request = pool.request();

    request.input('userId',sql.Int,userId);


    let result = await request.query('select * from users where id in (select senderId from friendRequests where receiverId=@userId)');
    const users = result.recordset;

    const usersWithoutPasswords = users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);

    res.json({ users:usersWithoutPasswords });
  } catch (error) {
    console.error("Error executing query", error);
    next(error); // Pass the error to the next middleware
  } finally {
    // Close the connection pool
    if (pool) {
      pool.close();
    }
  }
};


const getUsersByName = async(req,res,next)=>{
  let pool;
  try {
    // Connect to the database
    pool = await sql.connect(config);

    let searchTerm= req.params.searchTerm;
    let userId = req.params.userId;
    console.log(searchTerm);
    // Create a new request
    let request = pool.request();
    request.input('searchTerm',userSchema['name'],`%${searchTerm}%`);
    request.input('userId',sql.Int,userId);

    let result = await request.query("SELECT u.*,(select count(*) from friends f1 where f1.userId=u.id and  f1.friendId in( select f2.friendId from friends f2 where f2.userId=@userId)) as mutual from users u where name like @searchTerm order by mutual desc");
    const users = result.recordset;

    const usersWithoutPasswords = users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);

    res.json({ users:usersWithoutPasswords });
  } catch (error) {
    console.error("Error executing query", error);
    next(error); // Pass the error to the next middleware
  } finally {
    // Close the connection pool
    if (pool) {
      pool.close();
    }
  }
};

const getUserById = async(req,res,next)=>{
  let pool;
  try {
    // Connect to the database
    pool = await sql.connect(config);

   
    let user1 = req.params.user1;
    let user2= req.params.user2;
  
    // Create a new request
    let request = pool.request();
  
    request.input('user1',sql.Int,user1);
    request.input('user2',sql.Int,user2);

    let result = await request.query("SELECT u.id as id,u.name as name,u.image as image,u.placeCount as placeCount,(select count(*) from friends f1 where f1.userId=@user1 and  f1.friendId in( select f2.friendId from friends f2 where f2.userId=@user2)) as mutual from users u where id=@user1");
    let  user = result.recordset[0];

    
    res.json({ user });
  } catch (error) {
    console.error("Error executing query", error);
    next(error); // Pass the error to the next middleware
  } finally {
    // Close the connection pool
    if (pool) {
      pool.close();
    }
  }
};

const getFriends = async(req,res,next)=>{
  let pool;
  try {
    // Connect to the database
    pool = await sql.connect(config);

    let user1= req.params.user1;
    let user2 = req.params.user2;
   
    // Create a new request
    let request = pool.request();
    request.input('user1',sql.Int,user1);
    request.input('user2',sql.Int,user2);

    let result = await request.query("SELECT * from friends where (userId= @user1 and friendId=@user2) or (userId= @user2 and friendId=@user1)");
    const data = result.recordset;

    res.json({data});
  } catch (error) {
    console.error("Error executing query", error);
    next(error); // Pass the error to the next middleware
  } finally {
    // Close the connection pool
    if (pool) {
      pool.close();
    }
  }
};


const getRequestsSent = async(req,res,next)=>{
  let pool;
  try {
    // Connect to the database
    pool = await sql.connect(config);

    let sender= req.params.sender;
    let receiver = req.params.receiver;
   
    // Create a new request
    let request = pool.request();
    request.input('sender',sql.Int,sender);
    request.input('receiver',sql.Int,receiver);

    let result = await request.query("SELECT * from friendRequests where senderId= @sender and receiverId= @receiver");
    const requestsSent= result.recordset;

    res.json({data:requestsSent});
  } catch (error) {
    console.error("Error executing query", error);
    next(error); // Pass the error to the next middleware
  } finally {
    // Close the connection pool
    if (pool) {
      pool.close();
    }
  }
};

const getRequestsReceived = async(req,res,next)=>{
  let pool;
  try {
    // Connect to the database
    pool = await sql.connect(config);

    let userId= req.params.uid;
   
    // Create a new request
    let request = pool.request();
    request.input('userId',sql.Int,userId);

    let result = await request.query("SELECT senderId from friendRequests where receiverId= @userId");
    const requestsReceived= result.recordset;

    res.json({requestsReceived});
  } catch (error) {
    console.error("Error executing query", error);
    next(error); // Pass the error to the next middleware
  } finally {
    // Close the connection pool
    if (pool) {
      pool.close();
    }
  }
};

const verifyEmail = async(req,res,next) =>{
  const email = req.body.email;
  try{
    // Connect to the database
    const pool = await sql.connect(config);

    // Create a new request object
    const request = pool.request();

    // Check if the email already exists
    request.input("email", userSchema["email"], email);
    const emailCheckResult = await request.query(
      "SELECT * FROM users WHERE email = @email"
    );

    if (emailCheckResult.recordset.length > 0) {
      // Close the connection pool
      await pool.close();
      return next(
        new HttpError("User is already registered, you can login.", 422)
      );
    }
  }
  catch(err){
    await pool.close();
    return next(err);
  }
 
  const token = crypto.randomBytes(32).toString('hex');
  users[email] = { token, isConfirmed: false,email:email };

  console.log('token while sending ',token);

  const confirmationLink = `http://localhost:3000/confirm/${token}`;

  
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'mdanwarmansuri123@gmail.com',
      pass: 'poyk avrz kgtd jgkf',
    },
  });

  const mailOptions = {
    from: 'mdanwarmansuri123@gmail.com',
    to: email,
    subject: 'Email Confirmation',
    text: `Click this link to complete your registration: ${confirmationLink}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ error });
    }
    res.status(200).json({ message: 'Confirmation email sent' });
});
}

const verifyToken = async(req,res,next)=>{
  const { token } = req.params;
  // console.log('token while recieving ',token);
  const user = Object.values(users).find(user => user.token === token);

  if (!user) {
    return res.status(400).json({ message: 'Could not verify your email, please sign up again' });
  }

  user.isConfirmed = true;

  console.log(user.email);
  res.status(200).json({ message: 'Email confirmed',email:user.email });
}

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { name, email, password } = req.body;

  try {
    const pool = await sql.connect(config);

    // Create a new request object
    const request = pool.request();
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
      const error = new HttpError(
        "Could not create user,please try again",
        500
      );
      return next(error);
    }
    request.input("email", userSchema["email"], email);
    request.input("name", userSchema["name"], name);
    request.input("password", userSchema["password"], hashedPassword);
    request.input("image", userSchema["image"], req.file.path);
    request.input("placeCount", userSchema["placeCount"], 0);
    const result = await request.query(`
            INSERT INTO users (name, email, password,image,placeCount) OUTPUT INSERTED.*
            VALUES (@name, @email, @password,@image,@placeCount)
        `);

    //Close the connection pool
    // await pool.close();
    const user = result.recordset[0];
    let token;
    try{
    token = jwt.sign(
      { userId: user.id, email: user.email },
      "supersecret_dont_share",
      { expiresIn: "1h" }
    );
    } catch(err){
        const error = new HttpError('Signing up failed, please try again later',500);

        return next(error);
    }

    res.status(201).json({ userId:user.id,email:user.email,token:token});
  } catch (error) {
    console.error("Error creating user:", error);
    next(error);
  }
};



const login = async (req, res, next) => {

  const fetch = (await import('node-fetch')).default;

  const RECAPTCHA_SECRET_KEY = '6LfRkvQpAAAAAEdJ_LUzDVCuWqzJhpRzjd-tH7M9';

  const { email, password,recaptchaToken } = req.body;

  if (!recaptchaToken) {
    return res.status(400).json({ message: 'reCAPTCHA token is missing' });
  }

  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;

  const response = await fetch(verificationUrl, { method: 'POST' });
  const data = await response.json();

  if (!data.success) {
    return res.status(400).json({ message: 'reCAPTCHA verification failed' });
  }
  try {
    // Connect to the database
    const pool = await sql.connect(config);

    // Create a new request object
    const request = pool.request();

    // Check if the email already exists
    request.input("email", userSchema["email"], email);
    const result = await request.query(
      "SELECT * FROM users WHERE email = @email"
    );
    // Close the connection pool
    await pool.close();

   
    if (result.recordset.length === 0) {
      return next(new HttpError("Invalid credentials", 404));
    }

    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(
        password,
        result.recordset[0].password
      );
    } catch (err) {
      const error = new HttpError(
        "Could not log you in, please check your credentials and try again"
      );
      return next(error);
    }

    if (!isValidPassword) {
      return next(new HttpError("Invalid credentials", 404));
    }

    const user = result.recordset[0];
    

    let token;
    try{
    token = jwt.sign(
      { userId: user.id, email: user.email },
      "supersecret_dont_share",
      { expiresIn: "1h" }
    );
    } catch(err){
        const error = new HttpError('Logging in failed, please try again later',500);

        return next(error);
    }
    res.status(201).json({ userId:user.id,email:user.email,token:token,image:user.image});
  } catch (error) {
    console.error("Error verifying user:", error);
    next(error);
  }
};

const connectionRequest = async (req, res, next) => {
  const { senderId,receiverId } = req.body;

  console.log(req.body);
  try {
    // Connect to the database
    const pool = await sql.connect(config);

    // Create a new request object
    const request = pool.request();

    // Check if the email already exists
    request.input("SenderId", sql.Int, senderId);
    request.input("ReceiverId", sql.Int, receiverId);
    const result = await request.query(`
            INSERT INTO FriendRequests (SenderId,ReceiverId) OUTPUT INSERTED.*
            VALUES (@SenderId,@ReceiverId)
        `);
    // Close the connection pool
    await pool.close();
    
    res.status(201).json({ message:'Request sent successfully'});
  } catch (error) {
    console.error("Error sending request:", error);
    next(error);
  }
};

const acceptRequest = async (req, res, next) => {
  const { senderId,receiverId } = req.body;

  console.log(req.body);
  try {
    // Connect to the database
    const pool = await sql.connect(config);

    // Create a new request object
    const request = pool.request();

    // Check if the email already exists
    request.input("SenderId", sql.Int, senderId);
    request.input("ReceiverId", sql.Int, receiverId);
    const result = await request.query(`
            INSERT INTO Friends (userId,friendId) OUTPUT INSERTED.*
            VALUES (@SenderId,@ReceiverId)
        `);
        const result2 = await request.query(`
        INSERT INTO Friends (userId,friendId) OUTPUT INSERTED.*
        VALUES (@ReceiverId,@SenderId)
    `);
    // Close the connection pool
    await pool.close();
    
    res.status(200).json({ message:'Request accepted successfully'});
  } catch (error) {
    console.error("Error sending request:", error);
    next(error);
  }
};


const cancelRequest = async (req, res, next) => {
  const { senderId,receiverId } = req.body;

  console.log(req.body);
  try {
    // Connect to the database
    const pool = await sql.connect(config);

    // Create a new request object
    const request = pool.request();

    // Check if the email already exists
    request.input("SenderId", sql.Int, senderId);
    request.input("ReceiverId", sql.Int, receiverId);
    const result = await request.query(`
           DELETE FROM FriendRequests where SenderId = @SenderId and ReceiverId= @ReceiverId 
        `);
    // Close the connection pool
    await pool.close();
    
    res.status(201).json({ message:'Request cancelled successfully'});
  } catch (error) {
    console.error("Error sending request:", error);
    next(error);
  }
};


exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.getConnections = getConnections;

exports.getRequests = getRequests;
exports.getUsersByName = getUsersByName;
exports.getFriends = getFriends;
exports.getRequestsSent = getRequestsSent;
exports.getRequestsReceived = getRequestsReceived;
exports.verifyEmail = verifyEmail;
exports.verifyToken = verifyToken;
exports.signup = signup;
exports.login = login;
exports.connectionRequest = connectionRequest;
exports.acceptRequest = acceptRequest;
exports.cancelRequest = cancelRequest;


