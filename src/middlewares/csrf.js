import crypto from 'crypto';
import { APP_SECRET, NODE_ENV } from '../constants.js';

const TOKEN_SECRET = APP_SECRET;

const createCsrfToken = () => crypto.randomBytes(32).toString('hex');

const hashToken = (token) => crypto.createHmac('sha256', TOKEN_SECRET).update(token).digest('hex');

const addCsrfCookies = (res) => {
    const csrfToken = createCsrfToken();
    const csrfTokenHash = hashToken(csrfToken);

    res.cookie('s_tk', csrfTokenHash, {
        httpOnly: true,
        sameSite: 'strict',
        secure: NODE_ENV === 'production',
    });

    res.cookie('s_tkc', csrfToken, {
        sameSite: 'strict',
        secure: NODE_ENV === 'production',
    });
};

/**
 * Custom CSRF Middleware
 * @param options Opciones de configuración del middleware
 * @returns Middleware para Express
 */
const csrf = ({ excludedRoutes = [] }) => {
    return (req, res, next) => {
        try {
            if (req.method === 'GET' || excludedRoutes.includes(req.path) || NODE_ENV === 'test') {
                addCsrfCookies(res);
                return void next();
            }

            if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
                const csrfTokenClient = req.headers['x-csrf-token'] || req.cookies['s_tkc'];
                const csrfTokenServer = req.cookies['s_tk'];

                if (!csrfTokenClient || !csrfTokenServer) {
                    return void res.status(403).json({ error: 'Missing CSRF token' });
                }

                const csrfTokenClientHash = hashToken(csrfTokenClient);
                if (csrfTokenClientHash !== csrfTokenServer) {
                    return void res.status(403).json({ error: 'Invalid CSRF token' });
                }

                addCsrfCookies(res);
                return void next();
            }
            next();
        } catch (error) {
            res.status(500).json({ message: 'Internal server error: ' + error.message });
        }
    };
};

export default csrf;
