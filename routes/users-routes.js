const express= require('express');
const {check} =require('express-validator');

const router= express.Router();

const usersController = require('../controllers/users-controllers');
const fileUpload = require('../middleware/file-upload');

router.get('/suggestions/:userId',usersController.getUsers);

router.get('/profile/:user1/:user2',usersController.getUserById);

router.get('/connections/:userId',usersController.getConnections);

router.get('/requests/:userId',usersController.getRequests);


router.get('/search/:userId/:searchTerm',usersController.getUsersByName);

router.get('/friends/:user1/:user2',usersController.getFriends);

router.get('/connRequest/:sender/to/:receiver',usersController.getRequestsSent);

router.get('/requestsReceived/:uid',usersController.getRequestsReceived);


router.post('/verifyEmail',usersController.verifyEmail);
router.get('/confirm/:token',usersController.verifyToken);

router.post('/signup',
fileUpload.single('image'),
[
    check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({min:6})    
]
,usersController.signup);

router.post('/login',usersController.login);

router.post('/connRequest',usersController.connectionRequest);
router.post('/acceptRequest',usersController.acceptRequest);
router.post('/cancelRequest',usersController.cancelRequest);

module.exports = router;