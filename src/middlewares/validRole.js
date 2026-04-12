import path from 'path';
import { JWT_SECRET } from '../constants.js';
import jsonwebtoken from 'jsonwebtoken';
const basePath = (page) => path.join('pages', page);
const validRole = (roles = []) => {
    return async (req, res, next) => {
        const token = req.cookies?.sid || req.headers.authorization?.split(' ')[1];
        const forbidden = {
            title: '403 Acceso no autorizado',
            session: req.cookies?.sid ? true : false,
            isAdmin: req.cookies?.role === 'admin',
            year: new Date().getFullYear(),
        };

        if (!token) {
            res.render(basePath('403'), forbidden);
        }

        try {
            const decoded = jsonwebtoken.verify(token, JWT_SECRET);
            const { exp, iat, ...user } = decoded;

            const role = user.tipo_usuario_name;
            if (!role) {
                res.render(basePath('403'), forbidden);
            }

            if (roles.length > 0 && !roles.includes(role)) {
                res.render(basePath('403'), forbidden);
            }

            return next();
        } catch (error) {
            console.log(error);

            return res.status(401).json({ error: 'Token inválido o expirado' });
        }
    };
};

export default validRole;
