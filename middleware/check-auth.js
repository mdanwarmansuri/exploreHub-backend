const jwt = require('jsonwebtoken');
const HttpError = require('../models/http-error');
module.exports = (req,res,next) =>{
    if(req.method === 'OPTIONS'){
        return next();
    }
    
    try{
        const token = req.headers.authorization.split(' ')[1];
        if(!token){
            throw new Error('Authenticaton failed!');
        }
        const decodeToken = jwt.verify(token,"supersecret_dont_share");
        console.log(decodeToken);
        req.userData = {userId:decodeToken.userId}
        next();
    }catch(err){
        const error = new HttpError('Authentication failed plizz try again!',401);
        return next(error);
    }

};