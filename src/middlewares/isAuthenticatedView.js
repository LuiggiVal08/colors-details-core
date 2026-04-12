import { JWT_SECRET, NODE_ENV, timeExpiresToken } from '../constants.js';
import jsonwebtoken from 'jsonwebtoken';
import jwt from '../helpers/jwt.js';

const isAuthenticatedView = async (req, res, next) => {
    const token = req.cookies?.sid;
    const route = req.originalUrl;
    if (route === '/login' && !token) return next();
    if (!token || (route === '/login' && token)) return res.redirect('/');
    try {
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        const { exp, iat, ...user } = decoded;
        // { id: 1, username: 'admin', tipo_usuario_id: 1 } esto es el usuario

        // if (route === '/management/') {
        //     if (!user.tipo_usuario_id) return res.redirect('/');
        //     if (user.tipo_usuario_id === 1) return next();
        //     return res.redirect('/');
        // }
        // if (route === '/setings/') {
        //     if (!user.tipo_usuario_id) return res.redirect('/');
        //     if (user.tipo_usuario_id === 1 || user.tipo_usuario_id === 2) return next();
        //     return res.redirect('/');
        // }

        // req.body.session = user;
        const newToken = await jwt(user, 'access');
        res.cookie('sid', newToken, {
            httpOnly: true,
            sameSite: 'strict',
            expires: new Date(Date.now() + timeExpiresToken), // ⏱️ expira en 1 hora
        });

        // req.body.session = user;
        next();
    } catch (err) {
        res.clearCookie('sid');
        return res.redirect('/');
    }
};
export default isAuthenticatedView;
