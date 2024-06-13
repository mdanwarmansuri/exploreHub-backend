const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const placesRoutes = require('./routes/places-routes');
const usersRoutes =require('./routes/users-routes');
const HttpError = require('./models/http-error');
const app = express();

app.use(bodyParser.json()); 

app.use('/uploads/images',express.static(path.join('uploads','images')));

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Authorization');

    res.setHeader('Access-Control-Allow-Methods','GET, POST, PATCH, DELETE');
    next();
})
app.use('/api/places',placesRoutes);

app.use('/api/users',usersRoutes);

app.use((req,res,next)=>{
    const error= new HttpError('Could not find this route',404);
    throw error;
})

//this function will only execute only if any middle ware infront of it gives error.
app.use((error,req,res,next)=>{
    console.log(error.message);
    if(req.file){
        fs.unlink(req.file.path,(err)=>{
            console.log(err);
        });
    }
    if(res.headerSent){
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message: error.message || 'An unknown error occurred!'}); 
})
// app.use('/api/users',userRoutes);

app.listen(5000);  