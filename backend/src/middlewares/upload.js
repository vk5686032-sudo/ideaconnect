const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { errorResponse } = require('../utils/response');

// Multer storage configuration
const storage = multer.memoryStorage();

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  // This was `||`, which accepted a file when *either* the extension or the
  // mimetype matched. A .html file with a pdf mimetype got through.
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Upload configurations
exports.uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

exports.uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

exports.uploadMultiple = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
});

// Chat file attachments — saved to local disk (served at /uploads/chat-files).
// Swap to Cloudinary when real credentials are configured.
const chatUploadDir = path.join(__dirname, '..', 'uploads', 'chat-files');
if (!fs.existsSync(chatUploadDir)) {
  fs.mkdirSync(chatUploadDir, { recursive: true });
}

// Canonical extension -> allowed. This is the whole allow-list, and the
// extension we write to disk is taken from here, never from the request.
// Anything the browser would treat as active content (html, svg, xml, js) is
// simply absent, so it cannot be stored and therefore cannot be served.
const CHAT_ALLOWED_EXT = {
  '.jpg': '.jpg',
  '.jpeg': '.jpg',
  '.png': '.png',
  '.gif': '.gif',
  '.webp': '.webp',
  '.pdf': '.pdf',
  '.doc': '.doc',
  '.docx': '.docx',
  '.txt': '.txt',
};

const IMAGE_EXT = new Set(['.jpg', '.png', '.gif', '.webp']);

// The mimetype in a multipart request is attacker-controlled, so it never
// decides acceptance on its own. It is only cross-checked for images, where it
// carries real signal because the decoder has to parse the bytes anyway.
const isAllowedChatFile = (originalname, mimetype = '') => {
  const ext = path.extname(String(originalname || '')).toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(CHAT_ALLOWED_EXT, ext)) return false;
  if (IMAGE_EXT.has(ext)) return /^image\//i.test(mimetype);
  return true;
};

const chatStoredFilename = (originalname) => {
  const ext = path.extname(String(originalname || '')).toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(CHAT_ALLOWED_EXT, ext)) return null;
  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
  return `chat-${unique}${CHAT_ALLOWED_EXT[ext]}`;
};

const chatFilter = (req, file, cb) => {
  if (isAllowedChatFile(file.originalname, file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Attachment type not allowed'), false);
  }
};

const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, chatUploadDir),
  filename: (req, file, cb) => cb(null, chatStoredFilename(file.originalname)),
});

exports.uploadChatFile = multer({
  storage: chatStorage,
  fileFilter: chatFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

exports.isAllowedChatFile = isAllowedChatFile;
exports.chatStoredFilename = chatStoredFilename;
