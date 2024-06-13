const express = require("express");

//check is a method inside express-validator
const { check } = require("express-validator");

const fileUpload = require('../middleware/file-upload');
const placesControllers = require("../controllers/places-controllers");
const router = express.Router();
const checkAuth = require('../middleware/check-auth');

router.get("/:pid", placesControllers.getPlaceById);

router.post("/like", placesControllers.likePlace);

router.delete("/unlike",placesControllers.unlikePlace);

router.get("/like/:userId/:postId",placesControllers.getLiked);

router.get("/user/:uid", placesControllers.getPlacesByUserId);

router.get("/feed/:uid", placesControllers.getFeed);



router.get("/search/:searchTerm", placesControllers.getPlacesByName);

router.use(checkAuth);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty()
  ],
  placesControllers.createPlace
);

router.patch("/:pid",fileUpload.single("image"),[
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 })
  ],
  placesControllers.updatePlace);

router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
