// s3Uploader.js
import multer from 'multer';
import multerS3 from 'multer-s3';
import AWS from 'aws-sdk';
import path from 'path';

// ✅ Configure AWS S3
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});
console.log("🔐 AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY);
console.log("🪪 AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID);
console.log("🌍 AWS_REGION:", process.env.AWS_REGION);
console.log("🪣 AWS_BUCKET_NAME:", process.env.AWS_BUCKET_NAME);

const s3 = new AWS.S3();

// ✅ File filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const imageTypes = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
  const pdfTypes = ['.pdf'];

  if (file.fieldname === 'certificateImages') {
    if (pdfTypes.includes(ext)) return cb(null, true);
    return cb(new Error('Only PDF files allowed for certificateImages'));
  }

  if (['profileImage', 'coverImage', 'galleryImages'].includes(file.fieldname)) {
    if (imageTypes.includes(ext)) return cb(null, true);
    return cb(new Error(`Only image files allowed for ${file.fieldname}`));
  }

  cb(null, true); // allow other files
};

// ✅ Dynamic folder logic
const getFolderPath = (file, req) => {
  if (file.fieldname === 'profileImage') {
    if (req.baseUrl.includes('/user')) return 'userImage/';
    if (req.baseUrl.includes('/business')) return 'profile/';
  } else if (file.fieldname === 'coverImage') {
    return 'coverImage/';
  } else if (file.fieldname === 'certificateImages') {
    return 'certificates/';
  } else if (file.fieldname === 'galleryImages') {
    return 'gallery/';
  } else if (file.fieldname === 'eventImages') {
    return 'events/';
  } else if (file.fieldname === 'others') {
    return 'others/';
  }
  return 'misc/';
};

// ✅ Setup multerS3
const storage = multerS3({
  s3,
  bucket: process.env.AWS_BUCKET_NAME,
  acl: 'public-read', // Or 'private' if you want private URLs
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const folder = getFolderPath(file, req);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, `${folder}${filename}`);
  }
});

const upload = multer({ storage, fileFilter });

export default upload;
