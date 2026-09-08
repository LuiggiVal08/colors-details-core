import multer from 'multer';
import path from 'path';
import { cwd } from 'node:process';
import logger from './logger.js';
import fs from 'fs';
/**
 * @typedef {import('multer').File} CustomFile
 */

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        try {
            const uploadDir = path.resolve(cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        } catch (error) {
            logger.error(error);
        }
    },
    filename: (req, file, cb) => {
        try {
            const productName = req.body.nombre || 'producto_desconocido';
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const sanitizedProductName = productName.replace(/\s+/g, '_').toLowerCase();
            const ext = path.extname(file.originalname);
            const filename = sanitizedProductName + '_' + uniqueSuffix + ext;
            cb(null, filename);
        } catch (error) {
            logger.error(error);
        }
    },
});

/**
 *
 * @param {Request} _req
 * @param {CustomFile} file
 * @param {multer.FileFilterCallback} cb
 * @returns
 */
const fileFilter = (_req, file, cb) => {
    try {
        const allowedTypes = /jpg|jpeg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype);

        if (extname && mimeType) {
            return cb(null, true);
        } else {
            cb(null, false);
        }
    } catch (error) {
        logger.error(error);
    }
};

/**
 * @type {multer.Instance}
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // Límite de tamaño de archivo: 10 MB
});

export { upload };
