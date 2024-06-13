const HttpError = require("../models/http-error");
const fs = require("fs");
const sql = require("mssql");

const { validationResult } = require("express-validator");
// Import the v4 function from uuid
const { v4: uuidv4 } = require("uuid");

const getCoordsForAddress = require("../util/location");

const config = require("../config/config.js");

const placeSchema = require("../models/place");

// Arrow function
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let pool;

  try {
    // Connect to the database
    pool = await sql.connect(config);

    // Create a new request
    let request = pool.request();

    request.input("id", sql.Int, placeId); // Assuming 'id' is of type Int

    let result = await request.query(`SELECT 
    p.*, 
    u.name as creatorName,
    u.image as userImage,
    DATEDIFF(HOUR, p.created_at, GETDATE()) as hrs,
    (SELECT COUNT(*) FROM friends WHERE userId = p.creator) as connectionsCount
FROM 
    places p
JOIN 
    users u ON p.creator = u.id
WHERE 
    p.id=@id;
`);

    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ message: "Place not found" });
    } else {
      const place = result.recordset[0];
      res.json({ place });
    }
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

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  try {
    // Connect to the database
    pool = await sql.connect(config);

    // Create a new request
    let request = pool.request();

    request.input("creator", placeSchema["creator"], userId);

    let result = await request.query(
      `SELECT 
      p.*, 
      u.name as creatorName,
      u.image as userImage,
      DATEDIFF(HOUR, p.created_at, GETDATE()) as hrs,
      (SELECT COUNT(*) FROM friends WHERE userId = p.creator) as connectionsCount
  FROM 
      places p
  JOIN 
      users u ON p.creator = u.id
  WHERE 
      p.creator = @creator;
  `
    );

    const places = result.recordset;
    res.json({ places });
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

const getFeed = async (req, res, next) => {
  const userId = req.params.uid;
  console.log(userId);
  try {
    // Connect to the database
    pool = await sql.connect(config);

    // Create a new request
    let request = pool.request();

    request.input("creator", placeSchema["creator"], userId);

    let result = await request.query(
      `SELECT 
      p.*, 
      u.name as creatorName, 
      u.image as userImage, 
      DATEDIFF(MINUTE, p.created_at, GETDATE()) / 60.0 as hrs,
      (SELECT COUNT(*) FROM friends WHERE userId = p.creator) as connectionsCount
  FROM 
      places p
  JOIN 
      users u ON p.creator = u.id
  WHERE 
      p.creator IN (
          SELECT friendId 
          FROM friends 
          WHERE userId = @creator
      ) 
  ORDER BY 
      hrs ASC;
  `
    );

    const places = result.recordset;
    res.json({ places });
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

const getPlacesByName = async (req, res, next) => {
  const searchTerm = req.params.searchTerm;
  const creator = req.params.postCreator;
  try {
    // Connect to the database
    pool = await sql.connect(config);

    // Create a new request
    let request = pool.request();
    request.input("searchTerm", placeSchema["title"], `%${searchTerm}%`);

    let result = await request.query(
      "SELECT p.id as id,p.image as placeImage,p.title as title,p.address as address,u.name as creator,u.image as userImage from places p inner join users u on p.creator=u.id WHERE p.title like @searchTerm"
    );

    const places = result.recordset;
    res.json({ places });
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

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  let placeData = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(placeData.address);
  } catch (error) {
    return next(error);
  }
  // Get the current date and time in UTC
  const now = new Date();

  // Calculate the IST offset (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30 hours

  // Create a new Date object for IST
  const istTime = new Date(now.getTime() + istOffset);
  placeData = {
    ...placeData,
    lat: coordinates.lat,
    lng: coordinates.lng,
    image: req.file.path,
    creator: req.userData.userId,
    created_at: istTime,
  };

  // console.log(placeData);

  try {
    // Connect to the database
    const pool = await sql.connect(config);

    // Create a new request object
    const request = pool.request();

    for (const key in placeSchema) {
      request.input(key, placeSchema[key], placeData[key]);
    }

    console.log(placeData.creator);
    // Insert place into the database
    const result = await request.query(`
          INSERT INTO places (title, description,image,address,lat,lng,creator,created_at) OUTPUT INSERTED.*
          VALUES (@title, @description,@image,@address,@lat,@lng,@creator,@created_at)
        `);

    await request.query(
      `UPDATE users SET placeCount=placeCount+1 where id=@creator`
    );
    // Close the connection pool
    await sql.close();
    res.status(201).json({ place: result.recordset[0] });
    // return result.recordset[0];
  } catch (error) {
    console.error("Error creating place:", error);
    throw error;
  }
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data.", 422);
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let pool;

  try {
    // Connect to the database
    pool = await sql.connect(config);

    // Create a new request
    let request = pool.request();

    // Add the input parameter and execute the query
    request.input("id", sql.Int, placeId); // 'id' is the parameter name, sql.Int specifies the data type, id is the value

    let result1 = await request.query("SELECT * from places where id=@id");

    if (result1.recordset.length === 0) {
      return next(new HttpError("Could not find place for this id.", 404));
    }
    const place = result1.recordset[0];

    if (place.creator !== req.userData.userId) {
      const error = new HttpError(
        "You are not allowed to edit this place",
        401
      );
      return next(error);
    }

    let placeData = req.body;

    let coordinates;
    try {
      coordinates = await getCoordsForAddress(placeData.address);
    } catch (error) {
      return next(error);
    }
    placeData = {
      ...placeData,
      lat: coordinates.lat,
      lng: coordinates.lng,
      creator: req.userData.userId,
    };

    if (req.file) {
      placeData = {
        ...placeData,
        image: req.file.path,
      };
    }
    // console.log(placeData);

    for (const key in placeSchema) {
      if (placeData[key] === undefined || placeData[key] === null) {
        continue;
      }
      request.input(key, placeSchema[key], placeData[key]);
    }

    if (req.file) {
      let result = await request.query(
        "UPDATE places SET title=@title, description = @description, address=@address, image=@image, lat=@lat, lng=@lng, creator=@creator WHERE id = @id"
      );
    } else {
      let result = await request.query(
        "UPDATE places SET title=@title, description = @description, address=@address, lat=@lat, lng=@lng, creator=@creator WHERE id = @id"
      );
    }

    res.status(200).json({ message: "Place Updated Successfully" });
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


const likePlace = async (req,res,next) =>{
  let {postId,userId} = req.body;

  

  try {
    // Connect to the database
    const pool = await sql.connect(config);

    // Create a new request object
    const request = pool.request();

    request.input('post_id',sql.Int,postId);
    request.input('user_id',sql.Int,userId);
    

    
    const result = await request.query(`
          INSERT INTO likes (post_id,user_id) OUTPUT INSERTED.*
          VALUES (@post_id,@user_id)
        `);

    
    await sql.close();
    res.status(200).json({message:'Liked successfully'});
    // return result.recordset[0];
  } catch (error) {
    console.error("Error liking place:", error);
    throw error;
  }
}

const unlikePlace = async (req,res,next) =>{
  let {postId,userId} = req.body;

  

  try {
    // Connect to the database
    const pool = await sql.connect(config);

    // Create a new request object
    const request = pool.request();

    request.input('post_id',sql.Int,postId);
    request.input('user_id',sql.Int,userId);
    

    
    const result = await request.query(`
          DELETE from likes where post_id=@post_id and user_id=@user_id
        `);

    
    await sql.close();
    res.status(200).json({message:'Unliked successfully'});
    // return result.recordset[0];
  } catch (error) {
    console.error("Error unliking place:", error);
    throw error;
  }
}

const getLiked = async (req,res,next) =>{

  let userId=req.params.userId;
  let postId = req.params.postId;

  try {
    // Connect to the database
    const pool = await sql.connect(config);

    // Create a new request object
    const request = pool.request();

    request.input('post_id',sql.Int,postId);
    request.input('user_id',sql.Int,userId);
    

    
    const result = await request.query(`
          select * from likes where user_id = @user_id and post_id=@post_id;
        `);

    
    await sql.close();
    res.status(201).json({data:result.recordset});
    // return result.recordset[0];
  } catch (error) {
    console.error("Error liking place:", error);
    throw error;
  }
}



const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let pool;

  try {
    // Connect to the database
    pool = await sql.connect(config);

    // Create a new request
    let request = pool.request();

    request.input("id", sql.Int, placeId); // Assuming 'id' is of type Int

    let result1 = await request.query("SELECT * from places where id = @id");

    if (result1.recordset.length == 0) {
      res.status(404).json({ message: "Place not found" });
    }

    const place = result1.recordset[0];

    if (place.creator !== req.userData.userId) {
      const error = new HttpError(
        "You are not allowed to delete this place",
        401
      );
      return next(error);
    }

    request.input("creator", placeSchema["creator"], place.creator);
    const imagePath = place.image;

    let result2 = await request.query("DELETE FROM places WHERE id = @id");

    await request.query(
      `UPDATE users SET placeCount=placeCount-1 where id=@creator`
    );

    fs.unlink(imagePath, (err) => {
      console.log(err);
    });

    res.status(200).json({ message: "Place deleted" });
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

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.getPlacesByName = getPlacesByName;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
exports.getFeed = getFeed;
exports.likePlace = likePlace;
exports.getLiked = getLiked;
exports.unlikePlace = unlikePlace;