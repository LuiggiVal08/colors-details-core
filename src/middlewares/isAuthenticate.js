import jsonwebtoken from 'jsonwebtoken';
import jwt from '../helpers/jwt.js';
import { JWT_SECRET, NODE_ENV, timeExpiresToken } from '../constants.js';

const isAuthenticated = async (req, res, next) => {
    if (NODE_ENV === 'test') {
        return next();
    }

    // const expirationTime = Date.now() + 15 * 60 * 1000; // Expira en 15 minutos
    const expirationTime = Date.now() + timeExpiresToken; // Expira en 1 hora

    const token = req.cookies?.sid || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return void res.status(401).json({ message: 'Token de autenticación no encontrado' });
    }

    try {
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        const { iat, exp, ...user } = decoded;
        const newToken = await jwt(user, 'access');

        res.cookie('sid', newToken, {
            httpOnly: true,
            expires: new Date(expirationTime),
            secure: NODE_ENV === 'production',
            sameSite: 'strict',
        });
        // req.body.session = user;
        req.user = user;

        res.setHeader('Authorization', `Bearer ${newToken}`);
        next();
    } catch (err) {
        res.clearCookie('sid');
        res.status(401).json({ message: 'Token de autenticación inválido o caducado' + err });
    }
};

export default isAuthenticated;
