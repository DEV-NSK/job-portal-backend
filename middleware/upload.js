const multer = require('multer');
const path = require('path');

// Use Cloudinary in production, local disk in development
if (process.env.NODE_ENV === 'production' && process.env.CLOUDINARY_CLOUD_NAME) {
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
      const isResume = file.fieldname === 'resume';
      return {
        folder: 'job-portal',
        resource_type: isResume ? 'raw' : 'image',
        allowed_formats: isResume
          ? ['pdf', 'doc', 'docx']
          : ['jpg', 'jpeg', 'png', 'webp'],
        public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
      };
    },
  });

  module.exports = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

} else {
  // Local disk storage for development
  const fs = require('fs');
  const diskPath = require('path').join(process.cwd(), 'uploads');
  if (!fs.existsSync(diskPath)) fs.mkdirSync(diskPath, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, diskPath),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });

  const fileFilter = (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('File type not allowed'));
  };

  module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
}
