const multer = require("multer");
const path = require("path");

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./server/public");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const uploadImg = multer({
  storage,
  limits: { fileSize: 20000000 },
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
}).single("postimage");

// checking file
const checkFileType = (file, cb) => {
  // allowed ext
  const fileTypes = /jpg|jpeg|png/;
  // check ext
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  // check mimetype
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Error: jpg/jpeg/png file only"));
  }
};

module.exports = uploadImg;
