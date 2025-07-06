import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ✅ Ensure upload folders exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ✅ File storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'uploads/others';

    if (file.fieldname === 'profileImage') {
      if (req.baseUrl.includes('/user')) {
        folder = 'uploads/userImage';
      } else if (req.baseUrl.includes('/business')) {
        folder = 'uploads/profile';
      }
    } else if (file.fieldname === 'coverImage') {
      folder = 'uploads/coverImage';
    } else if (file.fieldname === 'certificateImages') {
      folder = 'uploads/certificates';
    } else if (file.fieldname === 'galleryImages') {
      folder = 'uploads/gallery';
    }
    
    //other
    else if (file.fieldname === 'others') {
  folder = 'uploads/others';
}
//events
 
     else if (file.fieldname === 'bannerImage') { 
      folder = 'uploads/events';
    }


    ensureDir(folder);
    cb(null, folder);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = Date.now() + '-' + file.fieldname + ext;
    cb(null, uniqueName);
  }
});

// ✅ File type validation
// ✅ File type validation
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  const imageTypes = ['.jpg', '.jpeg', '.png', '.webp', '.avif']; // ✅ added .avif
  const pdfTypes = ['.pdf'];

  if (file.fieldname === 'certificateImages') {
    if (pdfTypes.includes(ext)) return cb(null, true);
    return cb(new Error('Only PDF files are allowed for certificateImages'));
  }

  if (['profileImage', 'coverImage', 'galleryImages'].includes(file.fieldname)) {
    if (imageTypes.includes(ext)) return cb(null, true);
    return cb(new Error(`Only image files are allowed for ${file.fieldname}`));
  }

  // Accept other files by default
  cb(null, true);
};


// ✅ Multer upload setup
const upload = multer({ storage, fileFilter });

export default upload;
