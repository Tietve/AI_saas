/**
 * Upload Middleware
 *
 * Handles multipart/form-data file uploads using Multer
 */

import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Create temp uploads directory
const UPLOADS_DIR = path.join(__dirname, '../../temp/uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  },
});

// File filter (only PDFs)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

// Configure multer
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.PDF_MAX_SIZE || '10485760', 10), // 10MB default
    files: 1, // Single file upload
  },
});

// Error handler for multer
export const handleUploadError = (
  error: any,
  req: any,
  res: any,
  next: any
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          message: `File too large (max ${process.env.PDF_MAX_SIZE || 10485760} bytes)`,
          code: 'FILE_TOO_LARGE',
        },
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Too many files (max 1 file)',
          code: 'TOO_MANY_FILES',
        },
      });
    }

    return res.status(400).json({
      success: false,
      error: {
        message: error.message,
        code: 'UPLOAD_ERROR',
      },
    });
  }

  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Only PDF files are allowed',
        code: 'INVALID_FILE_TYPE',
      },
    });
  }

  next(error);
};
