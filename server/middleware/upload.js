const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf'
};

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter
});

function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 2MB. Please compress your file and try again.'
      });
    }
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
}

module.exports = upload;
module.exports.handleUploadError = handleUploadError;
