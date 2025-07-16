import dotenv from 'dotenv';
dotenv.config();
import multer from 'multer';
import multerS3 from 'multer-s3';
import aws from 'aws-sdk';
import path from 'path';

// ✅ Setup AWS credentials from .env
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new aws.S3();

// ✅ Allowed file types
const imageTypes = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const pdfTypes = ['.pdf'];

// ✅ File filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'certificateImages') {
    return pdfTypes.includes(ext)
      ? cb(null, true)
      : cb(new Error('Only PDF files are allowed for certificateImages'));
  }

  if (['profileImage', 'coverImage', 'galleryImages'].includes(file.fieldname)) {
    return imageTypes.includes(ext)
      ? cb(null, true)
      : cb(new Error(`Only image files are allowed for ${file.fieldname}`));
  }

  cb(null, true);
};

// ✅ S3 folder selection based on fieldname
const getS3Folder = (fieldname, baseUrl) => {
  if (fieldname === 'profileImage') {
    return baseUrl.includes('/user') ? 'userImage' : 'profile';
  } else if (fieldname === 'coverImage') {
    return 'coverImage';
  } else if (fieldname === 'certificateImages') {
    return 'certificates';
  } else if (fieldname === 'galleryImages') {
    return 'gallery';
  } else if (fieldname === 'eventImages') {
    return 'events';
  } else {
    return 'others';
  }
};

// ✅ Multer-S3 storage setup
const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET_NAME,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    const folder = getS3Folder(file.fieldname, req.baseUrl);
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, `${folder}/${fileName}`);
  }
});

// ✅ Final Multer Upload
const upload = multer({ storage, fileFilter });

export default upload;
