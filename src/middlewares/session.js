import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../constants.js';

export const session = async (req, res, next) => {
    const token = req.cookies?.sid || req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.locals.userValid = false;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        res.locals.userValid = true;
        res.locals.year = new Date().getFullYear();
        res.locals.user = {
            id: decoded.id,
            username: decoded.username,
            superadmin: decoded.tipo_usuario_name === 'superadmin',
            admin: decoded.tipo_usuario_name === 'admin' || decoded.tipo_usuario_name === 'superadmin',
            tipo_usuario_id: decoded.tipo_usuario_id,
            tipo_usuario_name: decoded.tipo_usuario_name,
        };

        next();
    } catch (err) {
        console.error('Error verifying token:', err);
        res.locals.userValid = false;
        return next();
    }
};
